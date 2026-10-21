import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/constants";
import type { ImageMimeType, PropertyImage } from "@/types/property";

const RESIZE_MAX_DIMENSION = 1600;
const RESIZE_JPEG_QUALITY = 0.8;

function isAllowedImageType(type: string): type is ImageMimeType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function validateImageFile(file: File): string | null {
  if (!isAllowedImageType(file.type)) {
    return "Only PNG, JPEG, or JPG images are allowed.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 10MB or smaller.";
  }
  return null;
}

/** Downscales large images client-side before base64 encoding, to keep the JSON payload within serverless body-size limits. */
async function resizeImageFile(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, RESIZE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      "image/jpeg",
      RESIZE_JPEG_QUALITY,
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function fileToPropertyImage(file: File): Promise<PropertyImage> {
  const resized = await resizeImageFile(file);
  const data = await blobToBase64(resized);
  return {
    name: file.name,
    type: "image/jpeg",
    size: resized.size,
    data,
  };
}

/** Browser-only: turns a base64 media payload from the API into a blob URL for <img>/<video>. */
export function base64ToObjectUrl(base64: string, mimeType: string): string {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}
