import { CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";

import { Card } from "@/components/card";
import type { CandidateResult } from "@/types/api";

export function ExplanationPanel({ candidate }: { candidate?: CandidateResult }) {
  if (!candidate) {
    return (
      <Card className="p-7" hudCorners glow="cyan">
        <h2 className="font-mono text-base font-bold text-white">AI Diagnostic Summary</h2>
        <p className="mt-4 font-sans text-sm leading-relaxed text-slate-400">
          No transit candidate was detected or selected for ML feature classification.
        </p>
      </Card>
    );
  }

  const positive = candidate.explanation.positive_factors ?? [];
  const negative = candidate.explanation.negative_factors ?? [];

  return (
    <Card className="p-7" hudCorners glow="cyan">
      <div className="flex items-center gap-2.5 border-b border-cyan-900/40 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-mono text-base font-bold text-white">AI Explainable Assessment</h2>
          <p className="font-mono text-[10px] text-cyan-400 uppercase">RANDOM FOREST EVIDENCE SUMMARY</p>
        </div>
      </div>

      <p className="mt-5 font-sans text-sm leading-relaxed text-slate-200">
        {candidate.explanation.summary || "No automated narrative summary was generated for this target."}
      </p>

      <div className="mt-7 grid gap-6 md:grid-cols-2">
        {/* Positive Factors */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 font-mono text-xs">
          <h3 className="flex items-center gap-2 font-bold uppercase text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            SUPPORTING EVIDENCE ({positive.length})
          </h3>
          <ul className="mt-3 space-y-2 font-sans text-xs text-slate-300">
            {positive.length ? (
              positive.map((factor) => (
                <li className="flex items-start gap-2 leading-relaxed" key={factor}>
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400">No supporting factors recorded.</li>
            )}
          </ul>
        </div>

        {/* Cautionary Factors */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 font-mono text-xs">
          <h3 className="flex items-center gap-2 font-bold uppercase text-amber-300">
            <TriangleAlert className="h-4 w-4 text-amber-400" />
            CAUTIONARY / RISK FACTORS ({negative.length})
          </h3>
          <ul className="mt-3 space-y-2 font-sans text-xs text-slate-300">
            {negative.length ? (
              negative.map((factor) => (
                <li className="flex items-start gap-2 leading-relaxed" key={factor}>
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400">No cautionary factors recorded.</li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
}
