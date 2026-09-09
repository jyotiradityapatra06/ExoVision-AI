"use client";

import { Activity, Binary, Search, ShieldCheck } from "lucide-react";

export function ObservationSignalEvidence() {
  return (
    <section className="ose-section" id="transition-story" aria-labelledby="ose-heading">
      <div className="landing-shell">
        <div className="max-w-3xl">
          <p className="landing-kicker">Analytical progression</p>
          <h2 id="ose-heading" className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Observation <span className="text-cyan-400">→</span> Signal <span className="text-cyan-400">→</span> Evidence
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            ExoVision AI structures candidate screening into an inspectable, three-phase scientific workflow. Continuous stellar flux is prepared, screened for periodic transit dips, and contextualized for human review.
          </p>
        </div>

        <div className="ose-grid">
          {/* Stage 1: Observation */}
          <article className="ose-card">
            <div className="flex items-center justify-between">
              <span className="ose-step-num">STAGE 01</span>
              <Activity className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            </div>
            <h3 className="ose-title">Stellar Observation</h3>
            <p className="ose-desc">
              Raw time-series photometry measuring stellar relative flux. Real observations contain instrumental noise, stellar flares, and data gaps that obscure candidate dips.
            </p>

            <div className="ose-visual">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span>Raw Light Curve</span>
                <span>Time (BJD)</span>
              </div>
              <svg aria-label="Conceptual illustration of a raw time-series light curve with noise and dips" className="mt-2 h-20 w-full" role="img" viewBox="0 0 300 70">
                {/* Horizontal guide lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.06)" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.06)" />
                {/* Raw scatter points */}
                <path d="M0 24 Q 15 22, 30 25 T 60 23 T 80 48 T 95 50 T 110 24 T 140 23 T 170 25 T 195 49 T 210 51 T 225 24 T 260 23 T 300 25" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
                {/* Highlighted dip regions */}
                <rect x="75" y="10" width="40" height="50" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.3)" strokeDasharray="2 2" rx="2" />
                <rect x="190" y="10" width="40" height="50" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.3)" strokeDasharray="2 2" rx="2" />
              </svg>
              <div className="mt-1 flex justify-between text-[9px] font-mono text-slate-400">
                <span>Explanatory model</span>
                <span className="text-cyan-400">Periodic dips isolated</span>
              </div>
            </div>
          </article>

          {/* Stage 2: Signal */}
          <article className="ose-card">
            <div className="flex items-center justify-between">
              <span className="ose-step-num">STAGE 02</span>
              <Search className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            </div>
            <h3 className="ose-title">Periodic Signal Search</h3>
            <p className="ose-desc">
              Box Least Squares (BLS) tests trial orbital periods, folding recurring events onto a single phase axis to test whether dips exhibit consistent periodic geometry.
            </p>

            <div className="ose-visual">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span>Phase-Folded Transit</span>
                <span>Phase [-0.5, 0.5]</span>
              </div>
              <svg aria-label="Conceptual illustration of a phase-folded transit curve" className="mt-2 h-20 w-full" role="img" viewBox="0 0 300 70">
                <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.08)" />
                {/* Clean folded transit dip */}
                <path d="M0 22 L110 22 C118 22 122 54 135 55 L165 55 C178 54 182 22 190 22 L300 22" fill="none" stroke="#38bdf8" strokeWidth="2" />
                {/* Measurement dimension indicators */}
                <line x1="150" y1="22" x2="150" y2="55" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="150" cy="55" r="2.5" fill="#f59e0b" />
              </svg>
              <div className="mt-1 flex justify-between text-[9px] font-mono text-slate-400">
                <span>Extracted: Period · Depth · Duration</span>
                <span className="text-amber-400">ΔF/F Measurement</span>
              </div>
            </div>
          </article>

          {/* Stage 3: Evidence */}
          <article className="ose-card">
            <div className="flex items-center justify-between">
              <span className="ose-step-num">STAGE 03</span>
              <Binary className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            </div>
            <h3 className="ose-title">Candidate Evidence Review</h3>
            <p className="ose-desc">
              Extracted physical parameters are screened by a Random Forest model. Measurements, feature importances, and astrophysical caveats are combined for scientific inspection.
            </p>

            <div className="ose-visual">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span>Screening Output</span>
                <span className="text-emerald-400">Flagged For Review</span>
              </div>
              <div className="mt-2 space-y-1.5 rounded bg-slate-950/70 p-2 text-[11px] font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Period / Duration:</span>
                  <span className="text-cyan-300">3.52 d / 0.15 d</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Transit SNR / Depth:</span>
                  <span className="text-cyan-300">18.2 / 1.2%</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-300">
                  <span>Classifier Score:</span>
                  <span className="font-semibold text-emerald-400">0.84 (Candidate Flag)</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                <ShieldCheck className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                <span>Screening flag only — not planet confirmation</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
