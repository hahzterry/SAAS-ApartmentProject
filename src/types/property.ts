export type ImageMimeType = "image/png" | "image/jpeg" | "image/jpg";

export interface PropertyImage {
  name: string;
  type: ImageMimeType;
  size: number;
  /** Base64-encoded image data, no "data:" prefix. */
  data: string;
}

export interface PropertyInput {
  address: string;
  description: string;
  images?: PropertyImage[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface LocationHighlights {
  schools: string;
  shoppingCenters: string;
  playgroundsAndParks: string;
  mainRoadsAndTransit: string;
  attractionsAndVibe: string;
  sources: GroundingSource[];
}

export interface ScriptGenerationResult {
  script: string;
  wordCount: number;
  estimatedSeconds: number;
}

export interface GenerateTourRequestBody {
  address: string;
  description: string;
  images?: PropertyImage[];
}

export interface GenerateTourResponse {
  locationHighlights: LocationHighlights;
  scriptResult: ScriptGenerationResult;
}

export interface ApiErrorResponse {
  error: string;
  fieldErrors?: Record<string, string[]>;
}
