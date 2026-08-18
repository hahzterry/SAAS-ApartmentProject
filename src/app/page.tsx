"use client";

import { PropertyForm } from "@/components/form/PropertyForm";
import { ScriptResultPanel } from "@/components/results/ScriptResultPanel";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { GenerateTourResponse } from "@/types/property";
import { MapPinned, Mic, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<GenerateTourResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="isolate relative min-h-full overflow-hidden bg-background px-4 py-12 sm:py-16">
      {/*
        `isolate` makes this div its own stacking context so its opaque bg-background
        paints as the context's base layer, below the -z-10 decorative blobs. Without
        it, a plain `position: relative` div doesn't form a stacking context, so its
        own background paints as a normal in-flow layer *above* negative-z-index
        children, hiding them entirely.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-berry/20 blur-3xl" />
        <div className="absolute -right-28 top-10 h-96 w-96 rounded-full bg-sky blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-berry/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] bg-[length:24px_24px]" />
      </div>

      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-berry text-white shadow-xl shadow-berry/20">
            <Sparkles className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Property Narration Script Generator
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-balance text-slate-600">
            Drop in an address and a short description — we&apos;ll research the neighborhood and write a
            polished 30-second voiceover script, ready to record.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Badge>
              <MapPinned className="h-3 w-3" />
              Google Maps grounding
            </Badge>
            <Badge>
              <Sparkles className="h-3 w-3" />
              Gemini-powered research
            </Badge>
            <Badge>
              <Mic className="h-3 w-3" />
              30-second script
            </Badge>
          </div>
        </header>

        <PropertyForm
          onResult={setResult}
          submitting={submitting}
          onSubmittingChange={setSubmitting}
        />

        {submitting && !result ? (
          <div className="mt-10 rounded-2xl border border-white/40 bg-white/50 p-6 backdrop-blur-sm">
            <Spinner label="Researching the neighborhood and writing your script..." />
          </div>
        ) : null}

        {result ? (
          <div className="mt-10">
            <ScriptResultPanel result={result} />
          </div>
        ) : null}

        <footer className="mt-16 text-center text-xs text-slate-400">
          Powered by Google Gemini with Maps &amp; Search grounding.
        </footer>
      </div>
    </div>
  );
}
