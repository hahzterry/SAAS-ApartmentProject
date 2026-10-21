import { NextRequest, NextResponse } from "next/server";
import { validateGenerateRoomDecorInput } from "@/lib/services/validationService";
import { generateRoomDecorImage, RoomDecorGenerationError } from "@/lib/services/roomDecorService";
import type { ApiErrorResponse, GenerateRoomDecorResponse, RoomDecorSlotResult } from "@/types/property";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<GenerateRoomDecorResponse | ApiErrorResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = validateGenerateRoomDecorInput(body);
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
    parsed.data.slots.map(async ({ key, roomType, image }): Promise<RoomDecorSlotResult> => {
      try {
        const staged = await generateRoomDecorImage(roomType, image);
        return { key, status: "success", image: staged };
      } catch (error) {
        if (!(error instanceof RoomDecorGenerationError)) {
          console.error(`[generate-room-decor] Unexpected error for ${key}:`, error);
        }
        const message =
          error instanceof RoomDecorGenerationError
            ? error.message
            : "Unexpected error staging this room.";
        return { key, status: "error", error: message };
      }
    }),
  );

  return NextResponse.json({ results });
}
