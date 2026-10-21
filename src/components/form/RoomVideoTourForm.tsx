"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Clapperboard, Video } from "lucide-react";
import { ImageUploadField } from "@/components/form/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MAX_IMAGES_PER_ROOM_VIDEO, ROOM_VIDEO_KEYS, ROOM_VIDEO_LABELS } from "@/lib/constants";
import { base64ToObjectUrl, fileToPropertyImage } from "@/lib/utils/fileHelpers";
import type { ApiErrorResponse, GenerateRoomVideosResponse, RoomVideoKey } from "@/types/property";

type FieldStatus = "idle" | "generating" | "done" | "error";

interface FieldState {
  images: File[];
  status: FieldStatus;
  videoUrl?: string;
  error?: string;
}

function createInitialFields(): Record<RoomVideoKey, FieldState> {
  const entries = ROOM_VIDEO_KEYS.map(
    (key): [RoomVideoKey, FieldState] => [key, { images: [], status: "idle" }],
  );
  return Object.fromEntries(entries) as Record<RoomVideoKey, FieldState>;
}

export function RoomVideoTourForm() {
  const [fields, setFields] = useState<Record<RoomVideoKey, FieldState>>(createInitialFields);
  const [submitting, setSubmitting] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const fieldsRef = useRef(fields);
  useEffect(() => {
    fieldsRef.current = fields;
  });

  useEffect(() => {
    return () => {
      for (const field of Object.values(fieldsRef.current)) {
        if (field.videoUrl) URL.revokeObjectURL(field.videoUrl);
      }
    };
  }, []);

  function handleImagesChange(key: RoomVideoKey, files: File[]) {
    setFields((prev) => {
      if (prev[key].videoUrl) URL.revokeObjectURL(prev[key].videoUrl);
      return { ...prev, [key]: { images: files, status: "idle" } };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setRootError(null);

    const populated = ROOM_VIDEO_KEYS.filter((key) => fields[key].images.length > 0);
    if (populated.length === 0) {
      setRootError("Add at least one photo to a room before generating videos.");
      return;
    }

    setSubmitting(true);
    setFields((prev) => {
      const next = { ...prev };
      for (const key of populated) {
        next[key] = { ...next[key], status: "generating", error: undefined };
      }
      return next;
    });

    try {
      const fieldsPayload = await Promise.all(
        populated.map(async (key) => ({
          key,
          images: await Promise.all(fields[key].images.map(fileToPropertyImage)),
        })),
      );

      const response = await fetch("/api/generate-room-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: fieldsPayload }),
      });

      const body = (await response.json()) as GenerateRoomVideosResponse | ApiErrorResponse;

      if (!response.ok || "error" in body) {
        const message = "error" in body ? body.error : "Something went wrong. Please try again.";
        setRootError(message);
        setFields((prev) => {
          const next = { ...prev };
          for (const key of populated) {
            next[key] = { ...next[key], status: "error", error: message };
          }
          return next;
        });
        return;
      }

      setFields((prev) => {
        const next = { ...prev };
        for (const result of body.results) {
          if (result.status === "success" && result.video) {
            const videoUrl = base64ToObjectUrl(result.video.data, result.video.mimeType);
            next[result.key] = { ...next[result.key], status: "done", videoUrl, error: undefined };
          } else {
            next[result.key] = {
              ...next[result.key],
              status: "error",
              error: result.error ?? "Failed to generate this video.",
            };
          }
        }
        return next;
      });
    } catch {
      setRootError("Network error. Please try again.");
      setFields((prev) => {
        const next = { ...prev };
        for (const key of populated) {
          next[key] = { ...next[key], status: "error", error: "Network error." };
        }
        return next;
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-ink/20">
      <div className="h-2 w-full bg-gradient-to-r from-berry via-berry to-indigo" />

      <div className="flex items-start gap-4 border-b border-ink/10 px-6 py-7 sm:px-10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo text-white">
          <Clapperboard className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-ink">Room Walkthrough Videos</h2>
          <p className="text-sm text-slate-500">
            Add up to {MAX_IMAGES_PER_ROOM_VIDEO} photos per room — we&apos;ll turn each one into a short
            walkthrough video.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-7 sm:px-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {ROOM_VIDEO_KEYS.map((key) => (
            <div key={key} className="rounded-2xl border border-ink/10 bg-slate-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-ink">{ROOM_VIDEO_LABELS[key]}</h3>
              <ImageUploadField
                files={fields[key].images}
                onChange={(files) => handleImagesChange(key, files)}
                max={MAX_IMAGES_PER_ROOM_VIDEO}
              />

              {fields[key].status === "generating" ? (
                <div className="mt-4 rounded-xl border border-berry/15 bg-white py-8">
                  <Spinner label="Generating walkthrough… this can take a few minutes." />
                </div>
              ) : null}

              {fields[key].status === "done" && fields[key].videoUrl ? (
                <video
                  className="mt-4 w-full rounded-xl border border-ink/10"
                  src={fields[key].videoUrl}
                  controls
                  playsInline
                />
              ) : null}

              {fields[key].status === "error" ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {fields[key].error}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {rootError ? (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {rootError}
          </p>
        ) : null}

        <div className="border-t border-ink/10 pt-7 mt-7">
          <Button
            type="submit"
            loading={submitting}
            icon={<Video className="h-4 w-4" />}
            className="w-full bg-gradient-to-r from-berry to-indigo sm:w-auto sm:px-10"
          >
            Generate Videos
          </Button>
          <p className="mt-2.5 text-xs text-slate-400">
            Each room can take a few minutes to generate.
          </p>
        </div>
      </form>
    </div>
  );
}
