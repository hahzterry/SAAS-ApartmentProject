# CLAUDE.md - Real Estate AI SaaS Project Guidelines

## 1. Executive Project Overview
You are building an AI-powered SaaS platform for real estate clients and property owners. The platform allows users to input apartment images (PNG/JPG/JPEG), a physical address, and a brief property description (up to 50 words). 

Using the Google Gemini API with native Google Maps and Search grounding, the system performs deep neighborhood research, extracts 5 key local selling points, and synthesizes a high-converting **30-second property narration script** combining apartment specs with local lifestyle highlights.

---

## 2. Architectural Principles & Coding Standards
To maintain high code quality, strictly enforce **Low Coupling & High Cohesion**:
- **High Cohesion**: Each module or service handles strictly one domain (e.g., `locationService` only queries Google Maps/Search; `scriptService` only handles prompt engineering for narration; `validationService` validates user inputs).
- **Low Coupling**: Modules communicate through abstract TypeScript interfaces or internal API routes (`/api/generate-tour`). UI components must never call external AI APIs directly.
- **Type Safety**: Write strict TypeScript without using `any`. Define shared domain types in `@/types/property.ts`.

---

## 3. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14+ (App Router, Server Components, API Routes) |
| **Language** | TypeScript (Strict mode) |
| **Styling** | Tailwind CSS v3+ |
| **Design Language**| Apple Human Interface Guidelines (HIG) |
| **AI Engine** | Google Gemini API (`@google/genai`) with Maps/Search Grounding |
| **Form & Validation**| React Hook Form + Zod |
| **UI & Animations** | Framer Motion + Lucide React Icons |

---

## 4. UI / UX & Design Specifications

### Color Palette
- **Primary Berry Accent**: `#C2185B` (Used for CTAs, active states, key metric highlights)
- **Soft Sky Tint**: `#E0F2FE` (Used for subtle card backgrounds, badge fills, subtle glow effects)
- **Dark Neutral**: `#0F172A` (Slate 900 for high-contrast headers)
- **Light Surface**: `#F8FAFC` (Slate 50 for main background)

### Apple Design Rules
- **Glassmorphism**: Use translucent surfaces (`bg-white/70 backdrop-blur-md border border-white/20`).
- **Depth & Radii**: Multi-layered subtle drop shadows (`shadow-sm`, `shadow-xl`) and generous border rounding (`rounded-2xl` for cards, `rounded-xl` for form controls).
- **Micro-Interactions**: Smooth active states (`active:scale-[0.98] transition-all duration-200`).

---

## 5. Input Requirements & Constraints

1. **Apartment Images**:
   - Formats: `image/png`, `image/jpeg`, `image/jpg`
   - Maximum size: 10MB per image.
2. **Property Address**:
   - Required string input with autocomplete support.
3. **General Apartment Description**:
   - Text input restricted to a **maximum of 50 words**.
   - UI must display a dynamic word counter (e.g., `38 / 50 words`).
   - Example input: *"5 room apartment near the sea with 3 bathrooms, a big balcony, special parent room suite with shower and closet room, includes a shelter room."*
   - Server-side Zod validator enforces `<= 50` words strictly.

---

## 6. AI Processing & Business Logic

### Step 1: Location Grounding (5 Bullet Points)
When an address is submitted, the system queries the Gemini API with Grounding enabled to extract real-world details across 5 pillars:
1. **Nearby Schools**: Primary, secondary, or higher education institutions nearby.
2. **Nearby Shopping Centers**: Malls, supermarkets, or local commercial centers.
3. **Nearby Playgrounds & Parks**: Family recreational areas and green spaces.
4. **Nearby Main Roads / Exits**: Highways, arterial roads, and public transit links.
5. **Local Attractions & Neighborhood Vibe**: Proximity to highlights (e.g., beach/gym/pool within 500m) plus qualitative area benefits (quiet, safe community, family-friendly environment).

### Step 2: 30-Second Script Generation
- Synthesize a voiceover narration strictly timed for **28 to 32 seconds** (~65 to 75 spoken words).
- Blends the internal apartment description (from the 50-word input and image context) with the key neighborhood highlights found during grounding.

---

## 7. Recommended Folder Structure