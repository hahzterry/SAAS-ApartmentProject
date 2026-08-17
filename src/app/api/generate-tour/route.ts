import { NextRequest, NextResponse } from "next/server";
import { validatePropertyInput } from "@/lib/services/validationService";
import { getLocationHighlights, LocationGroundingError } from "@/lib/services/locationService";
import { generateScript, ScriptGenerationError } from "@/lib/services/scriptService";
import type { ApiErrorResponse, GenerateTourResponse } from "@/types/property";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<GenerateTourResponse | ApiErrorResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = validatePropertyInput(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
      { status: 400 },
    );
  }

  const { address, description, images } = parsed.data;

  try {
    const locationHighlights = await getLocationHighlights(address);
    const scriptResult = await generateScript({ description, locationHighlights, images });

    return NextResponse.json({ locationHighlights, scriptResult });
  } catch (error) {
    if (error instanceof LocationGroundingError || error instanceof ScriptGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("[generate-tour] Unexpected error:", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
