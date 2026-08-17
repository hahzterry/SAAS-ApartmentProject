import { z } from "zod";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_DESCRIPTION_WORDS,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
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
