import { Type } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/geminiClient";
import { GEMINI_MODEL } from "@/lib/constants";
import type { GroundingSource, LocationHighlights } from "@/types/property";

export class LocationGroundingError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "LocationGroundingError";
  }
}

interface RawLocationHighlights {
  schools: string;
  shoppingCenters: string;
  playgroundsAndParks: string;
  mainRoadsAndTransit: string;
  attractionsAndVibe: string;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    schools: { type: Type.STRING },
    shoppingCenters: { type: Type.STRING },
    playgroundsAndParks: { type: Type.STRING },
    mainRoadsAndTransit: { type: Type.STRING },
    attractionsAndVibe: { type: Type.STRING },
  },
  required: [
    "schools",
    "shoppingCenters",
    "playgroundsAndParks",
    "mainRoadsAndTransit",
    "attractionsAndVibe",
  ],
};

/**
 * Queries Gemini with Google Search + Google Maps grounding to extract the 5
 * neighborhood-highlight pillars for a given address. This is the only place
 * in the app that performs location/grounding research.
 */
export async function getLocationHighlights(address: string): Promise<LocationHighlights> {
  const client = getGeminiClient();

  let response;
  try {
    response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Research the real-world neighborhood around this property address: "${address}".

Use Google Search and Google Maps grounding to find real, currently accurate information. Return findings across exactly these 5 pillars:
1. schools: Primary, secondary, or higher education institutions nearby.
2. shoppingCenters: Malls, supermarkets, or local commercial centers nearby.
3. playgroundsAndParks: Family recreational areas and green spaces nearby.
4. mainRoadsAndTransit: Highways, arterial roads, and public transit links nearby.
5. attractionsAndVibe: Nearby highlights (e.g. beach/gym/pool within 500m) plus the qualitative neighborhood vibe (quiet, safe, family-friendly, etc).

Each pillar should be 1-2 concise sentences of real, specific detail (named places, approximate distances). If nothing relevant is found for a pillar, say so briefly rather than inventing details.`,
            },
          ],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });
  } catch (error) {
    throw new LocationGroundingError("Failed to reach Gemini for location grounding.", error);
  }

  const text = response.text;
  if (!text) {
    throw new LocationGroundingError("Gemini returned an empty grounding response.");
  }

  let parsed: RawLocationHighlights;
  try {
    parsed = JSON.parse(text) as RawLocationHighlights;
  } catch (error) {
    throw new LocationGroundingError("Gemini returned malformed JSON for location highlights.", error);
  }

  const sources = extractGroundingSources(response);

  return { ...parsed, sources };
}

function extractGroundingSources(response: {
  candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { title?: string; uri?: string }; maps?: { title?: string; uri?: string } }> } }>;
}): GroundingSource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources: GroundingSource[] = [];

  for (const chunk of chunks) {
    const web = chunk.web;
    const maps = chunk.maps;
    if (web?.title && web.uri) {
      sources.push({ title: web.title, uri: web.uri });
    } else if (maps?.title && maps.uri) {
      sources.push({ title: maps.title, uri: maps.uri });
    }
  }

  return sources;
}
