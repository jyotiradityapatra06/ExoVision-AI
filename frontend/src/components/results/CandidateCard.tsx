import { BadgeCheck, Orbit } from "lucide-react";

import { Card } from "@/components/card";
import type { CandidateResult } from "@/types/api";

function value(number: number | null, digits = 3) { return number === null ? "—" : number.toFixed(digits); }

export function CandidateCard({ candidate }: { candidate: CandidateResult }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Rank #{candidate.rank}</p><h3 className="mt-2 break-all font-mono text-sm text-slate-300">{candidate.candidate_id}</h3></div>
        <Orbit className="h-5 w-5 text-slate-500" />
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-white"><BadgeCheck className="h-4 w-4 text-emerald-300" />{candidate.classification}</div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-300" style={{ width: `${candidate.confidence * 100}%` }} /></div>
      <p className="mt-2 text-xs text-slate-500">{(candidate.confidence * 100).toFixed(1)}% confidence</p>
      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-5 text-center">
        <div><dt className="text-xs text-slate-500">Period</dt><dd className="mt-1 text-sm font-medium text-slate-200">{value(candidate.period)} d</dd></div>
        <div><dt className="text-xs text-slate-500">Depth</dt><dd className="mt-1 text-sm font-medium text-slate-200">{value(candidate.depth, 5)}</dd></div>
        <div><dt className="text-xs text-slate-500">SNR</dt><dd className="mt-1 text-sm font-medium text-slate-200">{value(candidate.snr, 1)}</dd></div>
      </dl>
    </Card>
  );
}
