"use client";

import { validateImageFile } from "@/lib/utils/fileHelpers";
import { MAX_IMAGES } from "@/lib/constants";
import { ImagePlus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface ImageUploadFieldProps {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
}

export function ImageUploadField({ files, onChange, max = MAX_IMAGES }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  function handleSelect(selected: FileList | null) {
    if (!selected) return;
    setError(null);

    const incoming = Array.from(selected);
    const combined = [...files, ...incoming].slice(0, max);

    for (const file of incoming) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    if (files.length + incoming.length > max) {
      setError(`You can attach up to ${max} images.`);
    }

    onChange(combined);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {previews.map((src, index) => (
          <div key={src} className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/20 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-0.5 text-white transition-all duration-200 active:scale-[0.98]"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {files.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/40 bg-white/50 text-slate-400 backdrop-blur-md transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px]">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        multiple
        className="hidden"
        onChange={(e) => handleSelect(e.target.files)}
      />

      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
      <p className="mt-1 text-xs text-slate-400">Optional. Up to {max} images, PNG/JPG, 10MB each.</p>
    </div>
  );
}
