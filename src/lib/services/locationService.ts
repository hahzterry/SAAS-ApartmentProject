import { getGeminiClient } from "@/lib/gemini/geminiClient";
import { GEMINI_MODEL } from "@/lib/constants";
import type { GroundingSource, LocationHighlights } from "@/types/property";

export class LocationGroundingError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "LocationGroundingError";
  }
}

interface MapsPillars {
  schools: string;
  shoppingCenters: string;
  playgroundsAndParks: string;
  mainRoadsAndTransit: string;
}

interface SearchPillars {
  attractionsAndVibe: string;
}

/**
 * Gemini rejects any request that combines the googleSearch and googleMaps
 * grounding tools in a single call (400 INVALID_ARGUMENT), so each grounding
 * source runs as its own call. Maps grounding covers the concrete
 * nearby-places pillars; Search grounding covers the qualitative
 * attractions/vibe pillar, which benefits from web reviews and news.
 */
export async function getLocationHighlights(address: string): Promise<LocationHighlights> {
  const [mapsResult, searchResult] = await Promise.all([
    queryMapsGrounding(address),
    querySearchGrounding(address),
  ]);

  return {
    ...mapsResult.pillars,
    ...searchResult.pillars,
    sources: [...mapsResult.sources, ...searchResult.sources],
  };
}

async function queryMapsGrounding(
  address: string,
): Promise<{ pillars: MapsPillars; sources: GroundingSource[] }> {
  const prompt = `The exact search anchor point is this property address: "${address}". Use Google Maps to find places genuinely closest to this precise address — not merely well-known or prominent places elsewhere in the same city.

For each category below, search for and compare at least 3-4 real candidates, calculate/compare their distance from the exact address above, and report only the closest 1-2. Do not default to a large or famous institution unless it is actually verified as the closest option — a smaller, less well-known place that is genuinely nearer is the correct answer.

Return a single JSON object with exactly these keys, no markdown fences, no commentary before or after:
{"schools": "...", "shoppingCenters": "...", "playgroundsAndParks": "...", "mainRoadsAndTransit": "..."}

- schools: Primary, secondary, or higher education institutions closest to the address.
- shoppingCenters: Malls, supermarkets, or local commercial centers closest to the address.
- playgroundsAndParks: Family recreational areas and green spaces closest to the address.
- mainRoadsAndTransit: Highways, arterial roads, and public transit links closest to the address.

Each value must be 1-2 concise sentences naming the specific closest place(s) with their approximate distance from the address (in meters or km). If nothing relevant is found nearby, say so briefly rather than inventing details or substituting a distant well-known alternative.`;

  const response = await runGroundedCall(prompt, { googleMaps: {} }, "Google Maps", 0.2);
  const pillars = extractJson<MapsPillars>(response.text, "Google Maps");
  return { pillars, sources: extractGroundingSources(response) };
}

async function querySearchGrounding(
  address: string,
): Promise<{ pillars: SearchPillars; sources: GroundingSource[] }> {
  const prompt = `Research the neighborhood around this property address using Google Search: "${address}".

Return a single JSON object with exactly this key, no markdown fences, no commentary before or after:
{"attractionsAndVibe": "..."}

- attractionsAndVibe: Nearby highlights (e.g. beach/gym/pool within 500m) plus the qualitative neighborhood vibe (quiet, safe, family-friendly, etc), drawing on real local reviews or coverage where available.

The value should be 1-2 concise sentences of real, specific detail. If nothing relevant is found, say so briefly rather than inventing details.`;

  const response = await runGroundedCall(prompt, { googleSearch: {} }, "Google Search");
  const pillars = extractJson<SearchPillars>(response.text, "Google Search");
  return { pillars, sources: extractGroundingSources(response) };
}

type GeminiResponse = Awaited<ReturnType<ReturnType<typeof getGeminiClient>["models"]["generateContent"]>>;

async function runGroundedCall(
  prompt: string,
  tool: { googleMaps: Record<string, never> } | { googleSearch: Record<string, never> },
  toolLabel: string,
  temperature?: number,
): Promise<GeminiResponse> {
  const client = getGeminiClient();
  try {
    return await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { tools: [tool], temperature },
    });
  } catch (error) {
    console.error(`[locationService] ${toolLabel} grounding call failed:`, error);
    throw new LocationGroundingError(`Failed to reach Gemini for ${toolLabel} grounding.`, error);
  }
}

function extractJson<T>(text: string | undefined, toolLabel: string): T {
  if (!text) {
    throw new LocationGroundingError(`Gemini returned an empty ${toolLabel} grounding response.`);
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const jsonMatch = candidate.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : candidate;

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    throw new LocationGroundingError(
      `Gemini returned malformed JSON for ${toolLabel} grounding.`,
      error,
    );
  }
}

function extractGroundingSources(response: {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: { title?: string; uri?: string };
        maps?: { title?: string; uri?: string };
      }>;
    };
  }>;
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
