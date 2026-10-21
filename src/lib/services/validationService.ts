import { z } from "zod";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_DESCRIPTION_WORDS,
  MAX_IMAGES,
  MAX_IMAGES_PER_ROOM_VIDEO,
  MAX_IMAGE_BYTES,
  ROOM_DECOR_SLOT_KEYS,
  ROOM_DECOR_TYPES,
  ROOM_VIDEO_KEYS,
} from "@/lib/constants";
import { countWords } from "@/lib/utils/wordCount";

export const addressSchema = z
  .string()
  .trim()
  .min(3, "Address is required.");

export const descriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required.")
  .superRefine((value, ctx) => {
    const words = countWords(value);
    if (words > MAX_DESCRIPTION_WORDS) {
      ctx.addIssue({
        code: "custom",
        message: `Description must be ${MAX_DESCRIPTION_WORDS} words or fewer (currently ${words}).`,
      });
    }
  });

/** Server-side shape: images arrive as base64 JSON, not File objects. */
export const imageMetaSchema = z.object({
  name: z.string(),
  type: z.enum(ALLOWED_IMAGE_TYPES),
  size: z.number().max(MAX_IMAGE_BYTES, "Image must be 10MB or smaller."),
  data: z.string().min(1, "Image data is empty."),
});

export const propertyInputSchema = z.object({
  address: addressSchema,
  description: descriptionSchema,
  images: z.array(imageMetaSchema).max(MAX_IMAGES).optional(),
});

export type PropertyInputParseResult = ReturnType<typeof propertyInputSchema.safeParse>;

export function validatePropertyInput(data: unknown): PropertyInputParseResult {
  return propertyInputSchema.safeParse(data);
}

/** Client-side shape for React Hook Form: images are still File objects at this stage. */
export const propertyFormSchema = z.object({
  address: addressSchema,
  description: descriptionSchema,
  images: z
    .array(z.instanceof(File))
    .max(MAX_IMAGES, `You can attach up to ${MAX_IMAGES} images.`)
    .optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const roomVideoKeySchema = z.enum(ROOM_VIDEO_KEYS);

/** Server-side shape: images arrive as base64 JSON, same as propertyInputSchema. */
export const roomVideoFieldSchema = z.object({
  key: roomVideoKeySchema,
  images: z.array(imageMetaSchema).min(1).max(MAX_IMAGES_PER_ROOM_VIDEO),
});

export const generateRoomVideosRequestSchema = z.object({
  fields: z.array(roomVideoFieldSchema).min(1, "Add at least one photo before generating videos."),
});

export type GenerateRoomVideosParseResult = ReturnType<typeof generateRoomVideosRequestSchema.safeParse>;

export function validateGenerateRoomVideosInput(data: unknown): GenerateRoomVideosParseResult {
  return generateRoomVideosRequestSchema.safeParse(data);
}

/** Client-side shape for React Hook Form: images are still File objects at this stage. */
export const roomVideoFormFieldSchema = z.object({
  key: roomVideoKeySchema,
  images: z
    .array(z.instanceof(File))
    .max(MAX_IMAGES_PER_ROOM_VIDEO, `Up to ${MAX_IMAGES_PER_ROOM_VIDEO} images per room.`),
});

export const roomVideoFormSchema = z.object({
  fields: z.array(roomVideoFormFieldSchema),
});

export type RoomVideoFormValues = z.infer<typeof roomVideoFormSchema>;

export const roomDecorSlotKeySchema = z.enum(ROOM_DECOR_SLOT_KEYS);
export const roomDecorTypeSchema = z.enum(ROOM_DECOR_TYPES);

/** Server-side shape: the source photo arrives as base64 JSON, same as propertyInputSchema. */
export const roomDecorSlotSchema = z.object({
  key: roomDecorSlotKeySchema,
  roomType: roomDecorTypeSchema,
  image: imageMetaSchema,
});

export const generateRoomDecorRequestSchema = z.object({
  slots: z
    .array(roomDecorSlotSchema)
    .min(1, "Add at least one photo before staging a room.")
    .max(ROOM_DECOR_SLOT_KEYS.length),
});

export type GenerateRoomDecorParseResult = ReturnType<typeof generateRoomDecorRequestSchema.safeParse>;

export function validateGenerateRoomDecorInput(data: unknown): GenerateRoomDecorParseResult {
  return generateRoomDecorRequestSchema.safeParse(data);
}
