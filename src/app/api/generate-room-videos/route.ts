import { NextRequest, NextResponse } from "next/server";
import { validateGenerateRoomVideosInput } from "@/lib/services/validationService";
import { generateRoomVideo, VideoGenerationError } from "@/lib/services/videoTourService";
import type { ApiErrorResponse, GenerateRoomVideosResponse, RoomVideoFieldResult } from "@/types/property";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<GenerateRoomVideosResponse | ApiErrorResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = validateGenerateRoomVideosInput(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    parsed.data.fields.map(async ({ key, images }): Promise<RoomVideoFieldResult> => {
      try {
        const video = await generateRoomVideo(images);
        return { key, status: "success", video };
      } catch (error) {
        if (!(error instanceof VideoGenerationError)) {
          console.error(`[generate-room-videos] Unexpected error for ${key}:`, error);
        }
        const message =
          error instanceof VideoGenerationError ? error.message : "Unexpected error generating this video.";
        return { key, status: "error", error: message };
      }
    }),
  );

  return NextResponse.json({ results });
}
