import { CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";

import { Card } from "@/components/card";
import type { CandidateResult } from "@/types/api";

export function ExplanationPanel({ candidate }: { candidate?: CandidateResult }) {
  if (!candidate) return <Card className="p-7"><h2 className="font-semibold text-white">AI explanation</h2><p className="mt-4 text-sm leading-6 text-slate-500">No transit candidate was available for ML classification.</p></Card>;
  const positive = candidate.explanation.positive_factors ?? [];
  const negative = candidate.explanation.negative_factors ?? [];
  return (
    <Card className="p-7">
      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-sky-300" /><h2 className="font-semibold text-white">AI explanation</h2></div>
      <p className="mt-4 leading-7 text-slate-300">{candidate.explanation.summary || "No narrative summary was generated."}</p>
      <div className="mt-7 grid gap-6 md:grid-cols-2">
        <div><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Positive factors</h3><ul className="mt-3 space-y-3">{positive.length ? positive.map((factor) => <li className="flex gap-2 text-sm leading-6 text-slate-400" key={factor}><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />{factor}</li>) : <li className="text-sm text-slate-600">No supporting factors recorded.</li>}</ul></div>
        <div><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Cautionary factors</h3><ul className="mt-3 space-y-3">{negative.length ? negative.map((factor) => <li className="flex gap-2 text-sm leading-6 text-slate-400" key={factor}><TriangleAlert className="mt-1 h-4 w-4 shrink-0 text-amber-300" />{factor}</li>) : <li className="text-sm text-slate-600">No cautionary factors recorded.</li>}</ul></div>
      </div>
    </Card>
  );
}
