# Apartment's Tour and Location — Script Generator

Given a property address, a short description (≤50 words), and optional photos, this app
researches the surrounding neighborhood (via Gemini with Google Search + Google Maps
grounding) and generates a 28–32 second property narration script. No video/audio is
produced — text script only. See `CLAUDE.MD` for the full project brief.

---

## Usage instructions

### 1. Get your API keys

- **`GEMINI_API_KEY`** — create one at [Google AI Studio](https://aistudio.google.com/apikey).
  Must have access to the `gemini-3.7-flash` model with Search + Maps grounding.
- **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** — a separate Google Cloud credential. In
  [Google Cloud Console](https://console.cloud.google.com/), enable the **Maps JavaScript
  API** and **Places API** for a key, and restrict it by HTTP referrer (e.g.
  `localhost:3000/*` for local dev). This is unrelated to the Gemini key even though
  Gemini's grounding tool is also called "Maps" — they're different products/keys.

### 2. Configure environment variables

`.env.local` is already created at the project root (gitignored). Open it and paste in
both keys:

```
GEMINI_API_KEY=your-key-here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
```

`.env.local.example` documents the same two variables without values, for reference.

### 3. Install & run

```bash
npm install     # already run once; re-run if package.json changes
npm run dev     # starts the dev server at http://localhost:3000
```

Other scripts: `npm run build` (production build + type-check), `npm start` (serve the
production build), `npm run lint` (ESLint).

### 4. Use the app

1. Start typing the property address — pick a suggestion from the autocomplete dropdown
   (the field only accepts a selected suggestion, not free-typed text, since it's driven
   by the Google Places picker).
2. Enter a description of up to 50 words — the counter turns red past the limit and
   blocks submission.
3. Optionally attach up to 3 photos (PNG/JPG, ≤10MB each before client-side compression).
4. Click **Generate Script**. This calls `POST /api/generate-tour`, which researches the
   address and writes the script — expect roughly 5–15 seconds for the two chained Gemini
   calls.
5. Read the result, then **Copy** or **Download .txt**.

If a key is missing or invalid, the address field or the submit action will show a plain
error message rather than crashing.

---

## Project structure & what each file does

```
src/
  app/                        Next.js App Router: pages and API routes
  components/                 React UI, grouped by role
  lib/                        Server-safe business logic (services, Gemini client, utils)
  types/                      Shared TypeScript types
```

### `src/app/` — routes

| File | Purpose |
|---|---|
| `layout.tsx` | Root HTML shell: loads the Geist fonts, sets page `<title>`/description, wraps every page. |
| `page.tsx` | The single page of the app. Holds `result`/`submitting` state, renders `PropertyForm`, a loading `Spinner`, and `ScriptResultPanel` once a result comes back. This is the top of the client-side data flow. |
| `globals.css` | Tailwind v4 entry point. Defines the CLAUDE.md color tokens (`--berry`, `--sky`, plus slate background/foreground) via `@theme inline`, which auto-generates utility classes like `bg-berry`, `text-sky`. |
| `api/generate-tour/route.ts` | The **only** server module allowed to import both `locationService` and `scriptService` together. Parses the JSON body, validates it with `validatePropertyInput`, calls `getLocationHighlights` then `generateScript`, and returns `{ locationHighlights, scriptResult }`. Maps known Gemini failures to HTTP 502, validation failures to 400, anything else to 500 — never leaks stack traces to the client. |

### `src/lib/` — business logic (server-safe, no React)

| File | Purpose |
|---|---|
| `constants.ts` | Single source of truth for tunables: `MAX_DESCRIPTION_WORDS` (50), `MAX_IMAGE_MB`/`MAX_IMAGE_BYTES` (10MB), `MAX_IMAGES` (3), `ALLOWED_IMAGE_TYPES`, `GEMINI_MODEL` (`gemini-3.7-flash`), and the script's target word range/pacing assumption. |
| `gemini/geminiClient.ts` | Lazily constructs and caches one `GoogleGenAI` client using `GEMINI_API_KEY` from the server environment. Throws a clear error if the key is missing. Nothing outside `lib/gemini` and `lib/services` should import `@google/genai` directly. |
| `services/validationService.ts` | All Zod schemas, defined once and reused on both sides: `addressSchema`, `descriptionSchema` (enforces the 50-word cap via the shared `countWords` util, so the client counter and server check can never disagree), `imageMetaSchema`/`propertyInputSchema` (server-side shape: images as base64 JSON), and `propertyFormSchema` (client-side shape: images as `File` objects, for `react-hook-form`). |
| `services/locationService.ts` | Calls Gemini with `googleSearch` + `googleMaps` grounding tools and a strict JSON response schema, asking for the 5 CLAUDE.md pillars (schools, shopping, parks, roads/transit, attractions & vibe). Parses the JSON, pulls citation `sources` out of `groundingMetadata`, and throws a typed `LocationGroundingError` on any failure. Knows nothing about scripts. |
| `services/scriptService.ts` | Builds one prompt that explicitly ranks inputs — description primary, location highlights secondary, photos tertiary/optional — and asks for a 65–75 word narration. Attaches any images as inline multimodal parts. Computes `wordCount`/`estimatedSeconds` itself (doesn't trust the model's self-reported timing) and does one corrective retry if the word count drifts far outside range. Throws `ScriptGenerationError` on failure. Knows nothing about grounding. |
| `utils/wordCount.ts` | The single `countWords()` function used everywhere a word count matters (live UI counter, Zod validation) — guarantees they can't drift apart. |
| `utils/fileHelpers.ts` | Client-side only: `validateImageFile()` (type/size check, mirrors the Zod schema for instant feedback) and `fileToPropertyImage()` (downscales large images on a `<canvas>` to ~1600px/JPEG quality 0.8, then base64-encodes) — keeps the JSON payload to `/api/generate-tour` well under typical serverless body-size limits. |

### `src/types/property.ts` — shared types

The single definition point for every domain shape used across the app: `PropertyImage`,
`PropertyInput`, `LocationHighlights` (the 5 pillars + `sources`), `ScriptGenerationResult`,
`GenerateTourResponse`, and `ApiErrorResponse`. Services, the API route, and components all
import from here — no shape is ever redefined locally.

### `src/components/form/` — the input side

| File | Purpose |
|---|---|
| `PropertyForm.tsx` | Wires everything together with `react-hook-form` + `zodResolver(propertyFormSchema)`. On submit: converts staged `File[]` images to base64 `PropertyImage[]` via `fileToPropertyImage`, `POST`s the whole payload to `/api/generate-tour`, and hands the parsed response up to `page.tsx` via the `onResult` callback (or surfaces a root-level error). |
| `AddressAutocompleteInput.tsx` | Client component that lazy-loads the Google Maps JS `places` library (`@googlemaps/js-api-loader`'s `importLibrary`), mounts a `PlaceAutocompleteElement`, and on the `gmp-select` event fetches the place's `formattedAddress` and feeds it into the React Hook Form field. Shows a plain-text fallback message if the Maps key is missing or fails to load, instead of breaking. |
| `DescriptionField.tsx` | Wraps the shared `TextArea` primitive with a live `WordCounter` computed from the same `countWords()` the server uses. |
| `ImageUploadField.tsx` | Multi-file picker capped at `MAX_IMAGES`, with thumbnail previews, per-file removal, and client-side type/size validation via `validateImageFile`. |

### `src/components/results/` — the output side

| File | Purpose |
|---|---|
| `ScriptResultPanel.tsx` | Top-level results view (fades/slides in with Framer Motion). Shows the script text, word count/estimated seconds, and composes `CopyButton` + `DownloadButton`, plus `LocationHighlightsPreview` underneath. |
| `CopyButton.tsx` | Copies the script to the clipboard via the Clipboard API; shows a checkmark for 1.5s as confirmation. |
| `DownloadButton.tsx` | Builds a `Blob`/object URL and triggers a `property-script.txt` download. |
| `LocationHighlightsPreview.tsx` | Renders the 5 grounded pillars as labeled rows (icon badge + text), so the user can see what fed the script. |

### `src/components/ui/` — shared primitives (no domain knowledge)

| File | Purpose |
|---|---|
| `GlassCard.tsx` | The one place the glassmorphism recipe (`bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm`) is defined; every card composes it. |
| `Button.tsx` | Centralizes the Apple HIG micro-interaction (`active:scale-[0.98] transition-all duration-200`) with `primary` (berry) / `secondary` (glass) variants and a loading spinner state. |
| `TextArea.tsx` | Styled textarea with an optional inline error message. |
| `Badge.tsx` | Small pill used for the location-highlight labels. |
| `Spinner.tsx` | Loading indicator shown while the two Gemini calls are in flight. |
| `WordCounter.tsx` | Pure display component: renders `count / max words`, shifting color (slate → berry → red) as the limit approaches/passes. |

---

## Code flow: from form submit to rendered script

1. **User fills the form** (`PropertyForm.tsx`) — address via `AddressAutocompleteInput`,
   description via `DescriptionField`, optional photos via `ImageUploadField`. Client-side
   Zod (`propertyFormSchema`) blocks submission on invalid input before any network call.
2. **Submit** — images are compressed/base64-encoded (`fileToPropertyImage`), and the whole
   `{ address, description, images }` payload is `POST`ed as JSON to `/api/generate-tour`.
3. **API route** (`app/api/generate-tour/route.ts`) re-validates the body with
   `validatePropertyInput` (server-side Zod, `propertyInputSchema`) — this is the real
   security boundary, since client validation can be bypassed.
4. **`locationService.getLocationHighlights(address)`** calls Gemini with Search + Maps
   grounding, requesting strict JSON for the 5 pillars, and returns `LocationHighlights`.
5. **`scriptService.generateScript(...)`** takes that result plus the description and any
   images, builds the priority-ordered prompt, calls Gemini again, and returns
   `ScriptGenerationResult` (script text + computed word count/timing).
6. **The route responds** with `{ locationHighlights, scriptResult }` (or a clean error
   JSON with an appropriate 4xx/5xx status).
7. **`page.tsx`** receives the response via `PropertyForm`'s `onResult` callback and renders
   `ScriptResultPanel`, which shows the script (with Copy/Download) and the highlights that
   informed it.

Throughout, UI components never import `@google/genai` — only the two services and the
route do, keeping the AI integration swappable without touching the UI layer.
