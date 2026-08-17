import { getGeminiClient } from "@/lib/gemini/geminiClient";
import { GEMINI_MODEL, WORDS_PER_SECOND } from "@/lib/constants";
import { countWords } from "@/lib/utils/wordCount";
import type { LocationHighlights, PropertyImage, ScriptGenerationResult } from "@/types/property";

export class ScriptGenerationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ScriptGenerationError";
  }
}

export interface ScriptGenerationInput {
  description: string;
  locationHighlights: LocationHighlights;
  images?: PropertyImage[];
}

function buildPrompt(input: ScriptGenerationInput): string {
  const { description, locationHighlights } = input;

  return `Write a 30-second real-estate voiceover narration script for a property listing.

PRIORITY ORDER (strict): the apartment description below is the PRIMARY source of truth and should shape most of the script. The neighborhood highlights are SECONDARY supporting detail, woven in briefly. ${
    input.images?.length
      ? "The attached photos are TERTIARY, lowest-weight context — use at most one small visual detail from them, only if it naturally fits, and never let them override the description."
      : "No photos were provided."
  }

APARTMENT DESCRIPTION (primary):
"${description}"

NEIGHBORHOOD HIGHLIGHTS (secondary):
- Schools: ${locationHighlights.schools}
- Shopping: ${locationHighlights.shoppingCenters}
- Playgrounds & parks: ${locationHighlights.playgroundsAndParks}
- Main roads & transit: ${locationHighlights.mainRoadsAndTransit}
- Attractions & vibe: ${locationHighlights.attractionsAndVibe}

REQUIREMENTS:
- Target length: 65-75 spoken words (about 28-32 seconds read aloud).
- Warm, high-converting, natural voiceover tone — not a bullet list.
- Open with a hook about the apartment itself, close with a sense of lifestyle/location.
- Output ONLY the narration script text, with no title, labels, or quotation marks.`;
}

async function callGemini(input: ScriptGenerationInput): Promise<string> {
  const client = getGeminiClient();

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: buildPrompt(input) },
  ];

  for (const image of input.images ?? []) {
    parts.push({ inlineData: { data: image.data, mimeType: image.type } });
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
    });

    const text = response.text?.trim();
    if (!text) {
      throw new ScriptGenerationError("Gemini returned an empty script.");
    }
    return text;
  } catch (error) {
    if (error instanceof ScriptGenerationError) throw error;
    throw new ScriptGenerationError("Failed to reach Gemini for script generation.", error);
  }
}

export async function generateScript(input: ScriptGenerationInput): Promise<ScriptGenerationResult> {
  let script = await callGemini(input);
  let wordCount = countWords(script);

  // One corrective retry if the model drifts noticeably outside the target range.
  if (wordCount < 55 || wordCount > 85) {
    const corrected = await callGemini({
      ...input,
      description: `${input.description}\n\n(Note: a previous attempt was ${wordCount} words — aim strictly for 65-75 words this time.)`,
    });
    const correctedWordCount = countWords(corrected);
    if (Math.abs(correctedWordCount - 70) < Math.abs(wordCount - 70)) {
      script = corrected;
      wordCount = correctedWordCount;
    }
  }

  return {
    script,
    wordCount,
    estimatedSeconds: Math.round(wordCount / WORDS_PER_SECOND),
  };
}
