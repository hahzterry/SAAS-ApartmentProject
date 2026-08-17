import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

/** Single shared @google/genai client instance. Server-only — never import this from a client component. */
export function getGeminiClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}
