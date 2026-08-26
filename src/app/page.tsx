"use client";

import { PropertyForm } from "@/components/form/PropertyForm";
import { RoomVideoTourForm } from "@/components/form/RoomVideoTourForm";
import { ScriptResultPanel } from "@/components/results/ScriptResultPanel";
import { Spinner } from "@/components/ui/Spinner";
import type { GenerateTourResponse } from "@/types/property";
import { MapPinned, Mic, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<GenerateTourResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-full bg-foreground  bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.09)_1px,transparent_0)] bg-[length:28px_28px]">
      <section className="isolate relative overflow-hidden  px-4 pb-32 pt-16 sm:pt-20 ">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden  ">
          <div className="absolute bottom-[-8rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-berry/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-berry text-white shadow-xl shadow-berry/40">
            <Sparkles className="h-8 w-8" />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Property Narration Script Generator
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-base text-white/70 sm:text-lg">
            Drop in an address and a short description — we&apos;ll research the neighborhood and write a
            polished (35-45) second voiceover script, ready to record.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <MapPinned className="h-3.5 w-3.5 text-berry" />
              Google Maps grounding
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-berry" />
              Gemini-powered research
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <Mic className="h-3.5 w-3.5 text-berry" />
              30-second script
            </span>
          </div>
        </div>
      </section>

      {/*
        relative z-10: the hero above uses `isolate`, which pulls it into the
        "stack level 0" paint bucket ahead of plain static siblings — without its
        own stacking context here, this card would paint *behind* the hero
        wherever the negative margin makes them overlap, hiding the card entirely.
      */}
      <div className="relative z-10 mx-auto -mt-20 w-[92%] max-w-6xl pb-20 sm:-mt-24">
        <PropertyForm
          onResult={setResult}
          submitting={submitting}
          onSubmittingChange={setSubmitting}
        />

        {submitting && !result ? (
          <div className="mt-8 rounded-2xl border border-berry/15 bg-white p-6 shadow-sm">
            <Spinner label="Researching the neighborhood and writing your script..." />
          </div>
        ) : null}

        {result ? (
          <div className="mt-8">
            <ScriptResultPanel result={result} />
          </div>
        ) : null}

        <div className="mt-8">
          <RoomVideoTourForm />
        </div>

        <footer className="mt-16 text-center text-xs text-slate-400">
          Powered by Google Gemini with Maps &amp; Search grounding.
        </footer>
      </div>
    </div>
  );
}
