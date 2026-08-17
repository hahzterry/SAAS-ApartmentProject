export const MAX_DESCRIPTION_WORDS = 50;
export const MAX_IMAGE_MB = 10;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const MAX_IMAGES = 3;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"] as const;

export const GEMINI_MODEL = "gemini-3.7-flash";

export const SCRIPT_MIN_WORDS = 65;
export const SCRIPT_MAX_WORDS = 75;
/** Deterministic timing assumption: average spoken words per second for narration pacing. */
export const WORDS_PER_SECOND = 2.3;
