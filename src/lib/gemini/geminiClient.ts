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
