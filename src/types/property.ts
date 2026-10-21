import type { ROOM_DECOR_SLOT_KEYS, ROOM_DECOR_TYPES, ROOM_VIDEO_KEYS } from "@/lib/constants";

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

export type RoomVideoKey = (typeof ROOM_VIDEO_KEYS)[number];

export interface RoomVideoFieldInput {
  key: RoomVideoKey;
  images: PropertyImage[];
}

export interface GenerateRoomVideosRequestBody {
  fields: RoomVideoFieldInput[];
}

export interface GeneratedRoomVideo {
  mimeType: string;
  /** Base64-encoded video data, no "data:" prefix. */
  data: string;
}

export interface RoomVideoFieldResult {
  key: RoomVideoKey;
  status: "success" | "error";
  video?: GeneratedRoomVideo;
  error?: string;
}

export interface GenerateRoomVideosResponse {
  results: RoomVideoFieldResult[];
}

export type RoomDecorSlotKey = (typeof ROOM_DECOR_SLOT_KEYS)[number];
export type RoomDecorType = (typeof ROOM_DECOR_TYPES)[number];

export interface RoomDecorSlotInput {
  key: RoomDecorSlotKey;
  roomType: RoomDecorType;
  image: PropertyImage;
}

export interface GenerateRoomDecorRequestBody {
  slots: RoomDecorSlotInput[];
}

export interface GeneratedRoomDecorImage {
  mimeType: string;
  /** Base64-encoded image data, no "data:" prefix. */
  data: string;
}

export interface RoomDecorSlotResult {
  key: RoomDecorSlotKey;
  status: "success" | "error";
  image?: GeneratedRoomDecorImage;
  error?: string;
}

export interface GenerateRoomDecorResponse {
  results: RoomDecorSlotResult[];
}
