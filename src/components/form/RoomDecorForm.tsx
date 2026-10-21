"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, Sofa, Wand2 } from "lucide-react";
import { ImageUploadField } from "@/components/form/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  MAX_IMAGES_PER_ROOM_DECOR,
  ROOM_DECOR_SLOT_KEYS,
  ROOM_DECOR_SLOT_LABELS,
  ROOM_DECOR_TYPES,
  ROOM_DECOR_TYPE_LABELS,
} from "@/lib/constants";
import { base64ToObjectUrl, fileToPropertyImage } from "@/lib/utils/fileHelpers";
import type {
  ApiErrorResponse,
  GenerateRoomDecorResponse,
  RoomDecorSlotKey,
  RoomDecorType,
} from "@/types/property";

type SlotStatus = "idle" | "generating" | "done" | "error";

interface SlotState {
  roomType: RoomDecorType;
  images: File[];
  status: SlotStatus;
  stagedUrl?: string;
  error?: string;
}

const DEFAULT_ROOM_TYPE: RoomDecorType = "LIVING_ROOM";

function createInitialSlots(): Record<RoomDecorSlotKey, SlotState> {
  const entries = ROOM_DECOR_SLOT_KEYS.map(
    (key): [RoomDecorSlotKey, SlotState] => [
      key,
      { roomType: DEFAULT_ROOM_TYPE, images: [], status: "idle" },
    ],
  );
  return Object.fromEntries(entries) as Record<RoomDecorSlotKey, SlotState>;
}

export function RoomDecorForm() {
  const [slots, setSlots] = useState<Record<RoomDecorSlotKey, SlotState>>(createInitialSlots);
  const [submitting, setSubmitting] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const slotsRef = useRef(slots);
  useEffect(() => {
    slotsRef.current = slots;
  });

  useEffect(() => {
    return () => {
      for (const slot of Object.values(slotsRef.current)) {
        if (slot.stagedUrl) URL.revokeObjectURL(slot.stagedUrl);
      }
    };
  }, []);

  /** A new photo or a different room type invalidates whatever was staged before. */
  function resetSlot(key: RoomDecorSlotKey, patch: Partial<SlotState>) {
    setSlots((prev) => {
      const previousUrl = prev[key].stagedUrl;
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return {
        ...prev,
        [key]: { ...prev[key], ...patch, status: "idle", stagedUrl: undefined, error: undefined },
      };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setRootError(null);

    const populated = ROOM_DECOR_SLOT_KEYS.filter((key) => slots[key].images.length > 0);
    if (populated.length === 0) {
      setRootError("Add at least one room photo before staging.");
      return;
    }

    setSubmitting(true);
    setSlots((prev) => {
      const next = { ...prev };
      for (const key of populated) {
        next[key] = { ...next[key], status: "generating", error: undefined };
      }
      return next;
    });

    try {
      const slotsPayload = await Promise.all(
        populated.map(async (key) => ({
          key,
          roomType: slots[key].roomType,
          image: await fileToPropertyImage(slots[key].images[0]),
        })),
      );

      const response = await fetch("/api/generate-room-decor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: slotsPayload }),
      });

      const body = (await response.json()) as GenerateRoomDecorResponse | ApiErrorResponse;

      if (!response.ok || "error" in body) {
        const message = "error" in body ? body.error : "Something went wrong. Please try again.";
        setRootError(message);
        setSlots((prev) => {
          const next = { ...prev };
          for (const key of populated) {
            next[key] = { ...next[key], status: "error", error: message };
          }
          return next;
        });
        return;
      }

      setSlots((prev) => {
        const next = { ...prev };
        for (const result of body.results) {
          const previousUrl = prev[result.key].stagedUrl;
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          if (result.status === "success" && result.image) {
            next[result.key] = {
              ...next[result.key],
              status: "done",
              stagedUrl: base64ToObjectUrl(result.image.data, result.image.mimeType),
              error: undefined,
            };
          } else {
            next[result.key] = {
              ...next[result.key],
              status: "error",
              stagedUrl: undefined,
              error: result.error ?? "Failed to stage this room.",
            };
          }
        }
        return next;
      });
    } catch {
      setRootError("Network error. Please try again.");
      setSlots((prev) => {
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
      <div className="h-2 w-full bg-gradient-to-r from-indigo via-berry to-berry" />

      <div className="flex items-start gap-4 border-b border-ink/10 px-6 py-7 sm:px-10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-berry text-white">
          <Sofa className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-ink">Virtual Room Staging</h2>
          <p className="text-sm text-slate-500">
            Upload a room photo, pick what the room is, and we&apos;ll stage it with minimal, warm,
            buyer-ready decor fitted to the room&apos;s shape — walls, windows and layout untouched.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-7 sm:px-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {ROOM_DECOR_SLOT_KEYS.map((key) => {
            const slot = slots[key];
            return (
              <div key={key} className="rounded-2xl border border-ink/10 bg-slate-50 p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">
                    Room {ROOM_DECOR_SLOT_LABELS[key]}
                  </h3>
                  <select
                    value={slot.roomType}
                    onChange={(e) => resetSlot(key, { roomType: e.target.value as RoomDecorType })}
                    aria-label={`Room type for room ${ROOM_DECOR_SLOT_LABELS[key]}`}
                    className="rounded-xl border border-ink/10 bg-white px-3 py-1.5 text-sm text-ink shadow-sm outline-none transition-all duration-200 focus:border-berry/40 focus:ring-2 focus:ring-berry/20"
                  >
                    {ROOM_DECOR_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {ROOM_DECOR_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <ImageUploadField
                  files={slot.images}
                  onChange={(files) => resetSlot(key, { images: files })}
                  max={MAX_IMAGES_PER_ROOM_DECOR}
                />

                {slot.status === "generating" ? (
                  <div className="mt-4 rounded-xl border border-berry/15 bg-white py-8">
                    <Spinner label="Staging this room..." />
                  </div>
                ) : null}

                {slot.status === "done" && slot.stagedUrl ? (
                  <div className="mt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slot.stagedUrl}
                      alt={`Staged ${ROOM_DECOR_TYPE_LABELS[slot.roomType]}`}
                      className="w-full rounded-xl border border-ink/10"
                    />
                    <a
                      href={slot.stagedUrl}
                      download={`staged-${slot.roomType.toLowerCase()}-${ROOM_DECOR_SLOT_LABELS[key]}.png`}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download image
                    </a>
                  </div>
                ) : null}

                {slot.status === "error" ? (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {slot.error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {rootError ? (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {rootError}
          </p>
        ) : null}

        <div className="mt-7 border-t border-ink/10 pt-7">
          <Button
            type="submit"
            loading={submitting}
            icon={<Wand2 className="h-4 w-4" />}
            className="w-full bg-gradient-to-r from-indigo to-berry sm:w-auto sm:px-10"
          >
            Stage Rooms
          </Button>
          <p className="mt-2.5 text-xs text-slate-400">
            Each room is staged from its own photo using the prompt for the room type you picked.
          </p>
        </div>
      </form>
    </div>
  );
}
