import { getGeminiClient } from "@/lib/gemini/geminiClient";
import {
  GEMINI_MODEL,
  SCRIPT_MAX_WORDS,
  SCRIPT_MIN_WORDS,
  SCRIPT_RETRY_SLACK_WORDS,
  WORDS_PER_SECOND,
} from "@/lib/constants";
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

  const minSeconds = Math.round(SCRIPT_MIN_WORDS / WORDS_PER_SECOND);
  const maxSeconds = Math.round(SCRIPT_MAX_WORDS / WORDS_PER_SECOND);

  return `Write a real-estate voiceover narration script for a property listing.

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
- Target length: ${SCRIPT_MIN_WORDS}-${SCRIPT_MAX_WORDS} spoken words (about ${minSeconds}-${maxSeconds} seconds read aloud).
- Warm, high-converting, natural voiceover tone — not a bullet list.
- Open with a hook about the apartment itself so people keep watching, close with a sense of lifestyle/location.
- Output ONLY the narration script text, with no title, labels, or quotation marks.
- make sure to include some of the highlights inside the script, but not make it the center of the script
- make the script as natural and selling as possible, remember were advertising an apartment/house for sale.
- add AT LEAST but not AT MOST 1 of the highlights inside the script, whichever highlight seems best selling.
- the highlight should not be just a normal part of reading in the script but with a stop to acknowledge the highlight, for example : "one of the reasons this is a premium location is ...." , this is just an example, use your own proffessional words you see fit.
- make the script be selling, remember were creating an ad for the apartment so add point that help sell the house and make intrest in it
- write the script as 3 short paragraphs of the script, so i can create 3 videos , 1 for each paragraph.
-make the script as short and fast paced as you can, it cannot exceed the 30 secs to speak, a hook at the start (as part of the first paragraph) then fast paced high conversion speech
- after you thought of the script write it as hebrew language`;
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
    console.error("[scriptService] Gemini script generation call failed:", error);
    throw new ScriptGenerationError("Failed to reach Gemini for script generation.", error);
  }
}

export async function generateScript(input: ScriptGenerationInput): Promise<ScriptGenerationResult> {
  let script = await callGemini(input);
  let wordCount = countWords(script);

  // One corrective retry if the model drifts noticeably outside the target range.
  const targetCenter = (SCRIPT_MIN_WORDS + SCRIPT_MAX_WORDS) / 2;
  if (wordCount < SCRIPT_MIN_WORDS - SCRIPT_RETRY_SLACK_WORDS || wordCount > SCRIPT_MAX_WORDS + SCRIPT_RETRY_SLACK_WORDS) {
    const corrected = await callGemini({
      ...input,
      description: `${input.description}\n\n(Note: a previous attempt was ${wordCount} words — aim strictly for ${SCRIPT_MIN_WORDS}-${SCRIPT_MAX_WORDS} words this time.)`,
    });
    const correctedWordCount = countWords(corrected);
    if (Math.abs(correctedWordCount - targetCenter) < Math.abs(wordCount - targetCenter)) {
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
