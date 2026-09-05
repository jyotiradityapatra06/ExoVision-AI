import { BadgeCheck, Orbit } from "lucide-react";

import { Card } from "@/components/card";
import type { CandidateResult } from "@/types/api";

function value(number: number | null, digits = 3) {
  return number === null ? "—" : number.toFixed(digits);
}

export function CandidateCard({ candidate }: { candidate: CandidateResult }) {
  const confidencePercent = (candidate.confidence * 100).toFixed(1);
  const isHighConfidence = candidate.confidence >= 0.8;

  return (
    <Card className="p-6" hudCorners glow={isHighConfidence ? "cyan" : "orange"}>
      {/* Top Rank Badge */}
      <div className="flex items-start justify-between gap-4 border-b border-cyan-900/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow py-0.5 text-[10px]">
              RANK #{candidate.rank}
            </span>
            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {candidate.candidate_id}
            </span>
          </div>
          <h3 className="mt-3 font-mono text-base font-bold text-white flex items-center gap-2">
            <BadgeCheck className={`h-5 w-5 ${isHighConfidence ? "text-cyan-400" : "text-orange-400"}`} />
            <span>{candidate.classification}</span>
          </h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
          <Orbit className="h-5 w-5 animate-spin-slow" />
        </div>
      </div>

      {/* Model score gauge */}
      <div className="mt-5">
        <div className="flex items-center justify-between font-mono text-xs mb-1.5">
          <span className="text-slate-400">MODEL SCORE</span>
          <span className={`font-bold ${isHighConfidence ? "text-cyan-300" : "text-orange-400"}`}>
            {confidencePercent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHighConfidence
                ? "bg-gradient-to-r from-cyan-500 to-sky-300 shadow-[0_0_10px_#00f0ff]"
                : "bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_10px_#ff6b00]"
            }`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Orbital Telemetry Grid */}
      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-cyan-900/30 pt-5 text-center font-mono text-xs">
        <div className="rounded-xl border border-cyan-900/30 bg-[#04091a] p-2.5">
          <dt className="text-[10px] text-slate-400 uppercase">PERIOD</dt>
          <dd className="mt-1 text-xs font-bold text-cyan-300">{value(candidate.period)} d</dd>
        </div>
        <div className="rounded-xl border border-cyan-900/30 bg-[#04091a] p-2.5">
          <dt className="text-[10px] text-slate-400 uppercase">DEPTH</dt>
          <dd className="mt-1 text-xs font-bold text-orange-400">{value(candidate.depth, 5)}</dd>
        </div>
        <div className="rounded-xl border border-cyan-900/30 bg-[#04091a] p-2.5">
          <dt className="text-[10px] text-slate-400 uppercase">SNR</dt>
          <dd className="mt-1 text-xs font-bold text-emerald-300">{value(candidate.snr, 1)}</dd>
        </div>
      </dl>
    </Card>
  );
}
