import { CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import type { CandidateResult } from "@/types/api";

export function ExplanationPanel({ candidate }: { candidate?: CandidateResult }) {
  if (!candidate) {
    return (
      <div className="bg-white border border-[#090D0F]/10 rounded p-6 sm:p-8">
        <h3 className="font-serif text-xl font-medium text-[#090D0F]">
          Candidate Evidence & Factors
        </h3>
        <p className="mt-2 text-xs text-zinc-500 font-mono">
          No periodic transit candidate was evaluated by the Random Forest classifier.
        </p>
      </div>
    );
  }

  const positive = candidate.explanation.positive_factors ?? [];
  const negative = candidate.explanation.negative_factors ?? [];

  return (
    <div className="bg-white border border-[#090D0F]/10 rounded p-6 sm:p-8" aria-labelledby="evidence-heading">
      <div className="flex items-center justify-between pb-4 border-b border-[#090D0F]/10 mb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-signal font-semibold block">
            Multivariate Evaluation
          </span>
          <h3 id="evidence-heading" className="font-serif text-2xl font-medium text-[#090D0F] mt-0.5">
            Candidate Evidence & Screening Factors
          </h3>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Astrophysical criteria evaluated by the Random Forest screening model
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-signal shrink-0" />
      </div>

      {candidate.explanation.summary && (
        <p className="text-xs sm:text-sm text-zinc-700 font-sans leading-relaxed mb-6 italic border-l-2 border-signal/60 pl-3">
          &ldquo;{candidate.explanation.summary}&rdquo;
        </p>
      )}

      {/* Two-Column Editorial Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Supporting Evidence Column */}
        <div className="border border-emerald-200 bg-emerald-50/40 rounded p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-emerald-200/60 text-emerald-900 font-mono text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            <span className="uppercase tracking-wider">Supporting Evidence ({positive.length})</span>
          </div>
          <ul className="space-y-2.5 text-xs text-emerald-950 font-sans">
            {positive.length > 0 ? (
              positive.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-mono text-[10px] mt-0.5">•</span>
                  <span>{factor}</span>
                </li>
              ))
            ) : (
              <li className="text-zinc-500 font-mono text-xs">No primary supporting factors recorded.</li>
            )}
          </ul>
        </div>

        {/* Cautionary Evidence Column */}
        <div className="border border-amber-200 bg-amber-50/40 rounded p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-amber-200/60 text-amber-900 font-mono text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-700" aria-hidden="true" />
            <span className="uppercase tracking-wider">Cautionary Evidence ({negative.length})</span>
          </div>
          <ul className="space-y-2.5 text-xs text-amber-950 font-sans">
            {negative.length > 0 ? (
              negative.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-mono text-[10px] mt-0.5">•</span>
                  <span>{factor}</span>
                </li>
              ))
            ) : (
              <li className="text-zinc-500 font-mono text-xs">No cautionary factors flagged for this transit.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
