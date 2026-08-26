import { VideoGenerationReferenceType } from "@google/genai";
import { getGeminiApiKey, getGeminiClient } from "@/lib/gemini/geminiClient";
import {
  ROOM_VIDEO_ASPECT_RATIO,
  ROOM_VIDEO_COUNT,
  ROOM_VIDEO_DURATION_SECONDS,
  ROOM_VIDEO_MODEL,
  ROOM_VIDEO_POLL_INTERVAL_MS,
  ROOM_VIDEO_POLL_TIMEOUT_MS,
  ROOM_VIDEO_RESOLUTION,
} from "@/lib/constants";
import type { GeneratedRoomVideo, PropertyImage } from "@/types/property";

const PROMPT = `Photorealistic POV real estate walkthrough video. CRITICAL: The very first frame of the video MUST be an exact, unaltered match to the provided reference image. The camera then executes a slow, steady forward dolly at eye-level (~1.6m) with a gentle, handheld natural sway, subtly panning left and right to observe the space. Strictly maintain the exact room layout, original furniture placement, wall colors, flooring, and window positions from the reference image without adding new doors, windows, rooms, hallways, or furniture. The scene must remain entirely static with no people, moving objects, text, or watermarks. Ensure architectural stability with no warping walls or morphing architecture. Camera movement must be smooth and natural, strictly avoiding fisheye distortion, fast spinning, dutch angles, upside-down frames, or extreme rotation. Lighting should feature natural daylight matching the reference. The video must be completely silent, devoid of any audio, music, dialogue, voiceover, narration, or ambient sound.`;

const NEGATIVE_PROMPT = `new doors, new windows, new rooms, extra hallways,
additional furniture, changing layout, warping walls, morphing architecture,
people, text, watermark, fisheye distortion, fast spinning, dutch angle,
upside-down, extreme rotation, audio, sound, music, dialogue, talking,
voiceover, narration`;

export class VideoGenerationError extends Error {}

export async function generateRoomVideo(images: PropertyImage[]): Promise<GeneratedRoomVideo> {
  const ai = getGeminiClient();

  const referenceImages = images.map((image) => ({
    image: { imageBytes: image.data, mimeType: image.type },
    referenceType: VideoGenerationReferenceType.ASSET,
  }));

  let operation;
  try {
    operation = await ai.models.generateVideos({
      model: ROOM_VIDEO_MODEL,
      // `prompt` at the top level is deprecated in favor of `source.prompt` as of this SDK version.
      source: { prompt: PROMPT },
      config: {
        referenceImages,
        durationSeconds: ROOM_VIDEO_DURATION_SECONDS,
        resolution: ROOM_VIDEO_RESOLUTION,
        aspectRatio: ROOM_VIDEO_ASPECT_RATIO,
        numberOfVideos: ROOM_VIDEO_COUNT,
      },
    });
  } catch (error) {
    throw new VideoGenerationError(
      error instanceof Error ? error.message : "Failed to start video generation.",
    );
  }

  const startedAt = Date.now();
  while (!operation.done) {
    if (Date.now() - startedAt > ROOM_VIDEO_POLL_TIMEOUT_MS) {
      throw new VideoGenerationError("Video generation timed out.");
    }
    await new Promise((resolve) => setTimeout(resolve, ROOM_VIDEO_POLL_INTERVAL_MS));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (operation.error) {
    const message =
      typeof operation.error.message === "string" ? operation.error.message : "Video generation failed.";
    throw new VideoGenerationError(message);
  }

  const video = operation.response?.generatedVideos?.[0]?.video;
  if (!video) {
    const filteredReasons = operation.response?.raiMediaFilteredReasons;
    if (filteredReasons?.length) {
      console.error("[videoTourService] Video filtered by content policy:", filteredReasons);
      throw new VideoGenerationError(`Blocked by content policy: ${filteredReasons.join(" ")}`);
    }
    console.error(
      "[videoTourService] No video in operation response:",
      JSON.stringify(operation.response),
    );
    throw new VideoGenerationError("No video was returned.");
  }

  if (video.videoBytes) {
    return { mimeType: video.mimeType ?? "video/mp4", data: video.videoBytes };
  }

  if (video.uri) {
    // The SDK's `files`/`fileSearchStores` download helpers assume a URI shape that doesn't
    // match what generateVideos actually returns (`.../files/{id}:download?alt=media`), so
    // fetch it directly instead — it's a plain authenticated REST GET.
    const downloadResponse = await fetch(video.uri, {
      headers: { "x-goog-api-key": getGeminiApiKey() },
    });
    if (!downloadResponse.ok) {
      throw new VideoGenerationError(
        `Failed to download the generated video (HTTP ${downloadResponse.status}).`,
      );
    }
    const arrayBuffer = await downloadResponse.arrayBuffer();
    return {
      mimeType: video.mimeType ?? "video/mp4",
      data: Buffer.from(arrayBuffer).toString("base64"),
    };
  }

  throw new VideoGenerationError("No video data was returned.");
}
