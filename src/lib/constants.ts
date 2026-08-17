export const MAX_DESCRIPTION_WORDS = 50;
export const MAX_IMAGE_MB = 10;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const MAX_IMAGES = 3;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"] as const;

export const GEMINI_MODEL = "gemini-3.7-flash";

export const SCRIPT_MIN_WORDS = 90;
export const SCRIPT_MAX_WORDS = 130;
/** Retry slack around the target range before accepting a first-pass script as close enough. */
export const SCRIPT_RETRY_SLACK_WORDS = 10;
/** Deterministic timing assumption: average spoken words per second for narration pacing. */
export const WORDS_PER_SECOND = 2.3;
