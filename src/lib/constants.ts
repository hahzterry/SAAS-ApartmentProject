export const MAX_DESCRIPTION_WORDS = 50;
export const MAX_IMAGE_MB = 10;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const MAX_IMAGES = 16;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"] as const;

/**
 * gemini-3.7-flash consistently returns 503 UNAVAILABLE ("high demand") for calls
 * that attach the googleMaps/googleSearch grounding tools, which surfaced as a
 * blanket 502 from /api/generate-tour. 3.8-flash serves the same grounded calls fine.
 */
export const GEMINI_MODEL = "gemini-3.8-flash";

/** Total tries (not extra retries) for a Gemini call that fails transiently. */
export const GEMINI_RETRY_ATTEMPTS = 3;
export const GEMINI_RETRY_BASE_DELAY_MS = 800;

export const SCRIPT_MIN_WORDS =55;
export const SCRIPT_MAX_WORDS = 75;
/** Retry slack around the target range before accepting a first-pass script as close enough. */
export const SCRIPT_RETRY_SLACK_WORDS = 10;
/** Deterministic timing assumption: average spoken words per second for narration pacing. */
export const WORDS_PER_SECOND = 2.2;

export const ROOM_VIDEO_KEYS = ["ONE", "TWO", "THREE", "FOUR"] as const;
export const ROOM_VIDEO_LABELS: Record<(typeof ROOM_VIDEO_KEYS)[number], string> = {
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
};
export const MAX_IMAGES_PER_ROOM_VIDEO = 3;

/** Cheapest Veo 3.1 tier that still gets native audio and decent quality — plenty for a static room walkthrough. */
export const ROOM_VIDEO_MODEL = "veo-3.1-fast-generate-preview";
/** Veo 3.1 forces 8s whenever resolution is 1080p/4k or reference images are used — 6s isn't selectable at this resolution. */
export const ROOM_VIDEO_DURATION_SECONDS = 8;
export const ROOM_VIDEO_RESOLUTION = "1080p";
export const ROOM_VIDEO_ASPECT_RATIO = "16:9";
export const ROOM_VIDEO_COUNT = 1;
export const ROOM_VIDEO_POLL_INTERVAL_MS = 10_000;
export const ROOM_VIDEO_POLL_TIMEOUT_MS = 6 * 60 * 1000;

export const ROOM_DECOR_SLOT_KEYS = ["SLOT_1", "SLOT_2", "SLOT_3", "SLOT_4", "SLOT_5"] as const;
export const ROOM_DECOR_SLOT_LABELS: Record<(typeof ROOM_DECOR_SLOT_KEYS)[number], string> = {
  SLOT_1: "1",
  SLOT_2: "2",
  SLOT_3: "3",
  SLOT_4: "4",
  SLOT_5: "5",
};

export const ROOM_DECOR_TYPES = [
  "KIDS_ROOM",
  "PARENTS_ROOM",
  "LIVING_ROOM",
  "BALCONY",
  "STORAGE_ROOM",
  "CLOSET_ROOM",
  "KITCHEN",
] as const;
export const ROOM_DECOR_TYPE_LABELS: Record<(typeof ROOM_DECOR_TYPES)[number], string> = {
  KIDS_ROOM: "Kids room",
  PARENTS_ROOM: "Parents room",
  LIVING_ROOM: "Living room",
  BALCONY: "Balcony",
  STORAGE_ROOM: "Storage room",
  CLOSET_ROOM: "Closet room",
  KITCHEN: "Kitchen",
};

/** One source photo per slot — staging rewrites a single room shot, not a composite. */
export const MAX_IMAGES_PER_ROOM_DECOR = 1;

/** Image-out Gemini model: edits the uploaded photo in place rather than inventing a new room. */
export const ROOM_DECOR_MODEL = "gemini-3.1-flash-image";
export const ROOM_DECOR_IMAGE_SIZE = "2K";
