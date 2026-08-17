"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { propertyFormSchema, type PropertyFormValues } from "@/lib/services/validationService";
import { fileToPropertyImage } from "@/lib/utils/fileHelpers";
import { AddressAutocompleteInput } from "@/components/form/AddressAutocompleteInput";
import { DescriptionField } from "@/components/form/DescriptionField";
import { ImageUploadField } from "@/components/form/ImageUploadField";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Sparkles } from "lucide-react";
import type { GenerateTourResponse, ApiErrorResponse } from "@/types/property";

interface PropertyFormProps {
  onResult: (result: GenerateTourResponse) => void;
  submitting: boolean;
  onSubmittingChange: (submitting: boolean) => void;
}

export function PropertyForm({ onResult, submitting, onSubmittingChange }: PropertyFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: { address: "", description: "", images: [] },
  });

  async function onSubmit(values: PropertyFormValues) {
    onSubmittingChange(true);
    try {
      const images = await Promise.all((values.images ?? []).map(fileToPropertyImage));

      const response = await fetch("/api/generate-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: values.address,
          description: values.description,
          images,
        }),
      });

      const body = (await response.json()) as GenerateTourResponse | ApiErrorResponse;

      if (!response.ok || "error" in body) {
        const message = "error" in body ? body.error : "Something went wrong. Please try again.";
        setError("root", { message });
        return;
      }

      onResult(body);
    } catch {
      setError("root", { message: "Network error. Please try again." });
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <GlassCard className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Property address</label>
          <Controller
            control={control}
            name="address"
            render={({ field }) => (
              <AddressAutocompleteInput
                value={field.value}
                onChange={field.onChange}
                error={errors.address?.message}
              />
            )}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <DescriptionField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.description?.message}
              />
            )}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Photos (optional)</label>
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ImageUploadField files={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>

        {errors.root?.message ? (
          <p className="text-sm text-red-500">{errors.root.message}</p>
        ) : null}

        <Button type="submit" loading={submitting} icon={<Sparkles className="h-4 w-4" />} className="w-full">
          Generate Script
        </Button>
      </form>
    </GlassCard>
  );
}
