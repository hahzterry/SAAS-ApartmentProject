import { GEMINI_RETRY_ATTEMPTS, GEMINI_RETRY_BASE_DELAY_MS } from "@/lib/constants";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

/** Server-only — never import this from a client component. */
export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
  }
  return apiKey;
}

/** Single shared @google/genai client instance. Server-only — never import this from a client component. */
export function getGeminiClient(): GoogleGenAI {
  if (client) return client;

  client = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  return client;
}

/** Statuses the Gemini API returns for load/quota pressure rather than a bad request. */
const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface MaybeApiError {
  status?: unknown;
  code?: unknown;
  message?: unknown;
}

/** Best-effort read of the upstream HTTP status off an @google/genai error. */
function readUpstreamStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { status, code, message } = error as MaybeApiError;

  for (const value of [status, code]) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  }

  // Some SDK errors only carry the status inside the serialized message body.
  if (typeof message === "string") {
    const match = message.match(/"code"\s*:\s*(\d{3})/) ?? message.match(/\b(429|5\d{2})\b/);
    if (match) return Number(match[1]);
  }

  return undefined;
}

export function isTransientGeminiError(error: unknown): boolean {
  const status = readUpstreamStatus(error);
  return status !== undefined && TRANSIENT_STATUS_CODES.has(status);
}

/** Human-readable upstream status suffix, e.g. " (upstream 503)", for error messages. */
export function describeUpstreamStatus(error: unknown): string {
  const status = readUpstreamStatus(error);
  return status === undefined ? "" : ` (upstream ${status})`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs a Gemini call, retrying only transient load/quota failures. Grounded calls
 * (Maps/Search) are noticeably more prone to 503 UNAVAILABLE than ungrounded ones,
 * and a single 503 used to surface to the user as a hard 502 from /api/generate-tour.
 */
export async function withGeminiRetry<T>(
  operation: () => Promise<T>,
  label: string,
  attempts = GEMINI_RETRY_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error) || attempt === attempts) throw error;

      const delayMs = GEMINI_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[geminiClient] ${label} hit a transient error on attempt ${attempt}/${attempts}; retrying in ${delayMs}ms.`,
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}
