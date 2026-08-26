export const MAX_DESCRIPTION_WORDS = 50;
export const MAX_IMAGE_MB = 10;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const MAX_IMAGES = 16;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"] as const;

export const GEMINI_MODEL = "gemini-3.7-flash";

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
