"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { propertyFormSchema, type PropertyFormValues } from "@/lib/services/validationService";
import { fileToPropertyImage } from "@/lib/utils/fileHelpers";
import { AddressAutocompleteInput } from "@/components/form/AddressAutocompleteInput";
import { DescriptionField } from "@/components/form/DescriptionField";
import { ImageUploadField } from "@/components/form/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { ImagePlus, MapPin, NotebookPen, Sparkles } from "lucide-react";
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
    <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-ink/20">
      {/*
        Opaque, not glass: this card overlaps the dark hero band above it, and a
        translucent bg-white/70 + backdrop-blur surface doesn't have enough contrast
        against that dark backdrop for the ink-colored heading text to stay legible.
      */}
      <div className="h-2 w-full bg-gradient-to-r from-berry via-berry to-indigo" />

      <div className="flex items-start gap-4 border-b border-ink/10 px-6 py-7 sm:px-10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo text-white">
          <NotebookPen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-ink">Tell us about the property</h2>
          <p className="text-sm text-slate-500">Three quick inputs — we&apos;ll handle the research and writing.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 sm:px-10">
        <FormSection number={1} icon={<MapPin className="h-4 w-4" />} label="Property address">
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
        </FormSection>

        <FormSection
          number={2}
          icon={<NotebookPen className="h-4 w-4" />}
          label="Description"
          hint="Up to 50 words — room count, standout features, anything worth mentioning."
        >
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
        </FormSection>

        <FormSection
          number={3}
          icon={<ImagePlus className="h-4 w-4" />}
          label="Photos"
          optional
          hint="Helps ground the script in what the apartment actually looks like."
        >
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ImageUploadField files={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </FormSection>

        {errors.root?.message ? (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {errors.root.message}
          </p>
        ) : null}

        <div className="border-t border-ink/10 py-7">
          <Button
            type="submit"
            loading={submitting}
            icon={<Sparkles className="h-4 w-4" />}
            className="w-full bg-gradient-to-r from-berry to-indigo sm:w-auto sm:px-10"
          >
            Generate Script
          </Button>
          <p className="mt-2.5 text-xs text-slate-400">Usually takes about 20 seconds.</p>
        </div>
      </form>
    </div>
  );
}

interface FormSectionProps {
  number: number;
  icon: ReactNode;
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

function FormSection({ number, icon, label, hint, optional, children }: FormSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-ink/10 py-7 first:border-t-0 sm:grid-cols-[260px_1fr] sm:gap-8">
      <label className="flex items-start gap-3 text-sm font-medium text-ink sm:pt-1">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-berry text-[11px] font-semibold text-white">
          {number}
        </span>
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <span className="text-berry">{icon}</span>
            {label}
            {optional ? <span className="font-normal text-slate-400">(optional)</span> : null}
          </span>
          {hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
        </span>
      </label>
      <div>{children}</div>
    </div>
  );
}
