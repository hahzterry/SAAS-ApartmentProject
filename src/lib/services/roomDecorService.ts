import { Modality } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/geminiClient";
import { ROOM_DECOR_IMAGE_SIZE, ROOM_DECOR_MODEL } from "@/lib/constants";
import type { GeneratedRoomDecorImage, PropertyImage, RoomDecorType } from "@/types/property";

export class RoomDecorGenerationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "RoomDecorGenerationError";
  }
}

/**
 * Shared staging contract. Every room type gets the same three guarantees —
 * the room is never altered, the decor is fitted to this room's real shape, and
 * the style stays minimalist but warm — so a staged photo still reads as the
 * same apartment a buyer will walk through. Only the furnishing brief differs.
 */
const BASE_PROMPT = `You are a photorealistic virtual home-staging artist preparing a photo for a premium real estate listing. Edit the provided photograph of a real apartment room so it looks beautifully furnished, warm and move-in ready — while the room itself stays exactly the room it is.

RULE 1 — NEVER CHANGE THE ROOM. This overrides every styling instruction below:
- Do not change the room layout in any way whatsoever.
- Keep the exact camera angle, framing, perspective, lens and crop of the original photo.
- Keep every architectural element faithful to the original: walls, corners, ceiling, floor material, windows, doors, door frames, railings, radiators, columns, built-in niches, switches and outlets.
- Do not add, remove, move, resize or re-shape any wall, window, door or opening. Do not invent hallways, extra rooms, or a different view through the window.
- Keep the original room proportions, ceiling height and floor area.
- Keep the original natural light: same direction, same time of day, same colour temperature, same real view outside the windows.
- Remove only clutter, debris, protective sheeting and existing mismatched items — never anything structural.

RULE 2 — FIT THE DECOR TO THIS ROOM'S ACTUAL SHAPE:
- Read the real footprint, proportions and traffic flow of this specific room before placing anything.
- Scale every piece to the room's true dimensions and place it where that furniture could physically stand — along the real wall lines, clear of doors, windows and walkways.
- Follow the room's geometry: a narrow room gets a narrow, linear arrangement; a corner nook gets a corner piece; an alcove gets something sized to that alcove.
- Nothing may block a door, a window or a path through the room. Nothing floats — everything sits on the floor with correct contact shadows and correct perspective.

RULE 3 — STYLE: MINIMALIST, BUT WARM AND WELCOMING:
- Few, well-chosen pieces rather than a full room. Leave generous open floor and breathing space — the emptiness is part of the look, and it makes the room read larger.
- Clean lines, no fuss, no ornament for its own sake. Surfaces stay almost bare: one or two objects, never a clutter of styling props.
- Warmth comes from material and light, not from quantity: warm natural wood, soft linen and wool, cream / oatmeal / sand / warm-white tones with one gentle accent (muted terracotta, sage, or soft clay), matte finishes, a touch of greenery, and soft warm lighting.
- The result must feel calm, bright, airy and inviting — a room a buyer looks at and immediately wants to live in. Aspirational but real and livable, never a showroom or a catalogue set.

OUTPUT:
- Photorealistic, indistinguishable from a professionally shot real interior photograph.
- No people, no pets, no text, no labels, no logos, no watermarks, no illustration, CGI or 3D-render look.
- Return only the edited image.`;

/** One minimalist furnishing brief per selectable room type; picked by the user's dropdown choice. */
const ROOM_DECOR_PROMPTS: Record<RoomDecorType, string> = {
  KIDS_ROOM: `ROOM TYPE — a children's bedroom.
Place only: a low single bed with soft neutral bedding and one playful accent cushion; a compact desk and chair against a real wall or under the existing window if it genuinely fits; one low open shelf holding a handful of books and two or three wooden toys; a soft round rug; a single framed print. Nothing more.
Keep a large area of clear floor open to play on. Playful but muted — warm wood with soft pastel or clay accents. No bright plastic, no crowded toy room, no wall murals.`,

  PARENTS_ROOM: `ROOM TYPE — a primary (parents') bedroom.
Place only: a double or king bed centred on the longest usable wall, dressed in crisp white and oatmeal linen with one folded throw; two matching slim nightstands with simple warm lamps; a large soft rug grounding the bed; sheer light curtains on the existing windows; one large calm artwork above the headboard. Nothing more.
Serene hotel-suite restraint — quiet, warm, uncluttered, with clear floor on both sides of the bed.`,

  LIVING_ROOM: `ROOM TYPE — a family living room.
Place only: one comfortable sofa along the longest usable wall; a single accent armchair angled to it; a simple low coffee table holding one book and a small bowl; a large rug anchoring the seating; a slim low console or media unit; one floor lamp; one large potted plant in a corner; light curtains on the existing windows. Nothing more.
Keep the centre of the room and all walkways wide open so the space reads generous and easy to move through.`,

  BALCONY: `ROOM TYPE — an outdoor balcony or terrace.
Keep the existing railing, floor tiles and the real view beyond exactly as they are.
Place only: a small round bistro table with two chairs — or, if the balcony is narrow, a single low lounge chair with a cushion; one outdoor rug; two or three potted plants, one taller in the corner; a small lantern or a warm string light along the existing railing. Nothing more.
Leave most of the floor clear. The feeling should be an inviting morning-coffee spot, never a crowded or stored-on balcony.`,

  STORAGE_ROOM: `ROOM TYPE — a storage or utility room.
Place only: simple floor-to-ceiling shelving or closed cabinetry along one usable wall; a small number of uniform neutral storage boxes and baskets, evenly spaced; optionally a small step stool. Nothing more.
Leave plenty of empty shelf space and clear floor — the point is to show how much usable, well-planned capacity the room has, not to fill it. Bright, spotless, perfectly orderly, no stacked junk.`,

  CLOSET_ROOM: `ROOM TYPE — a walk-in closet / dressing room.
Place only: minimal built-in joinery on the usable walls; one hanging rail with a small, evenly spaced capsule wardrobe in neutral tones on matching wooden hangers; a few folded items on open shelves; two or three pairs of shoes on a shoe shelf; one drawer unit; a full-length mirror; warm integrated lighting along the rails. Nothing more.
Leave generous empty rail and shelf space — boutique calm, not a full closet.`,

  KITCHEN: `ROOM TYPE — a kitchen.
Keep the existing cabinetry, countertops, sink, appliances, backsplash and kitchen layout exactly where they are — do not redesign, refinish or relocate any of it.
Clear the counters completely, then add only two or three warm props: a wooden cutting board leaning against the backsplash, a simple ceramic bowl with a few pieces of fruit, and a small potted herb or a single stem of greenery in a vase. If there is genuinely room, add two simple stools at an existing island or bar, or a small round table with two chairs in an existing nook.
Surfaces must look clean, bright and freshly polished, with most of the counter left bare.`,
};

export async function generateRoomDecorImage(
  roomType: RoomDecorType,
  image: PropertyImage,
): Promise<GeneratedRoomDecorImage> {
  const client = getGeminiClient();
  const prompt = `${BASE_PROMPT}\n\n${ROOM_DECOR_PROMPTS[roomType]}`;

  let response;
  try {
    response = await client.models.generateContent({
      model: ROOM_DECOR_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: image.type, data: image.data } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: { imageSize: ROOM_DECOR_IMAGE_SIZE },
      },
    });
  } catch (error) {
    console.error(`[roomDecorService] Image generation call failed for ${roomType}:`, error);
    throw new RoomDecorGenerationError(
      error instanceof Error ? error.message : "Failed to reach Gemini for image staging.",
      error,
    );
  }

  const candidate = response.candidates?.[0];
  const inlineImage = candidate?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;

  if (!inlineImage?.data) {
    // A blocked or empty generation comes back as a finishReason rather than a thrown error.
    const finishReason = candidate?.finishReason;
    console.error(
      `[roomDecorService] No image returned for ${roomType} (finishReason: ${finishReason ?? "none"}).`,
    );
    throw new RoomDecorGenerationError(
      finishReason && finishReason !== "STOP"
        ? `The staged image was blocked (${finishReason}). Try a different photo.`
        : "No staged image was returned.",
    );
  }

  return { mimeType: inlineImage.mimeType ?? "image/png", data: inlineImage.data };
}
