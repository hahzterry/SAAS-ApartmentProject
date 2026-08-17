"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { CopyButton } from "@/components/results/CopyButton";
import { DownloadButton } from "@/components/results/DownloadButton";
import { LocationHighlightsPreview } from "@/components/results/LocationHighlightsPreview";
import type { GenerateTourResponse } from "@/types/property";
import { motion } from "framer-motion";

export function ScriptResultPanel({ result }: { result: GenerateTourResponse }) {
  const { script, wordCount, estimatedSeconds } = result.scriptResult;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Narration Script</h2>
          <span className="text-xs text-slate-400">
            {wordCount} words · ~{estimatedSeconds}s
          </span>
        </div>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">{script}</p>
        <div className="mt-5 flex gap-3">
          <CopyButton text={script} />
          <DownloadButton text={script} />
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Neighborhood Highlights Used</h3>
        <LocationHighlightsPreview highlights={result.locationHighlights} />
      </GlassCard>
    </motion.div>
  );
}
