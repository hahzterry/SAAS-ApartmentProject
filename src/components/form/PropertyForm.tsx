"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { propertyFormSchema, type PropertyFormValues } from "@/lib/services/validationService";
import { fileToPropertyImage } from "@/lib/utils/fileHelpers";
import { AddressAutocompleteInput } from "@/components/form/AddressAutocompleteInput";
import { DescriptionField } from "@/components/form/DescriptionField";
import { ImageUploadField } from "@/components/form/ImageUploadField";
import { GlassCard } from "@/components/ui/GlassCard";
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
    <GlassCard className="p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-3 border-b border-slate-900/10 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky text-berry">
          <NotebookPen className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tell us about the property</h2>
          <p className="text-sm text-slate-500">Three quick inputs — we&apos;ll handle the research and writing.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {errors.root.message}
          </p>
        ) : null}

        <Button type="submit" loading={submitting} icon={<Sparkles className="h-4 w-4" />} className="w-full">
          Generate Script
        </Button>
        <p className="-mt-3 text-center text-xs text-slate-400">Usually takes about 20 seconds.</p>
      </form>
    </GlassCard>
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
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/5 text-[11px] font-semibold text-slate-500">
          {number}
        </span>
        <span className="text-slate-400">{icon}</span>
        {label}
        {optional ? <span className="font-normal text-slate-400">(optional)</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
