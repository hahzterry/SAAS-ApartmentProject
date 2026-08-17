"use client";

import { PropertyForm } from "@/components/form/PropertyForm";
import { ScriptResultPanel } from "@/components/results/ScriptResultPanel";
import { Spinner } from "@/components/ui/Spinner";
import type { GenerateTourResponse } from "@/types/property";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<GenerateTourResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-full bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Property Narration Script Generator
          </h1>
          <p className="mt-2 text-slate-500">
            Enter an address and a short description — we&apos;ll research the neighborhood and write a
            30-second voiceover script.
          </p>
        </header>

        <PropertyForm
          onResult={setResult}
          submitting={submitting}
          onSubmittingChange={setSubmitting}
        />

        {submitting && !result ? (
          <div className="mt-10">
            <Spinner label="Researching the neighborhood and writing your script..." />
          </div>
        ) : null}

        {result ? (
          <div className="mt-10">
            <ScriptResultPanel result={result} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
