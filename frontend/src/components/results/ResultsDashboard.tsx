"use client";

import {
  ArrowLeft,
  BookOpen,
  Check,
  Compass,
  Database,
  Layers,
  Orbit,
  RotateCcw,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FoldedCurveChart } from "@/components/charts/FoldedCurveChart";
import { LightCurveChart } from "@/components/charts/LightCurveChart";
import { PeriodogramChart } from "@/components/charts/PeriodogramChart";
import { ReportButton } from "@/components/reports/ReportButton";
import { ExplanationPanel } from "@/components/results/ExplanationPanel";
import { FeatureImportanceChart } from "@/components/results/FeatureImportanceChart";
import type { AnalysisResult } from "@/types/api";

function formatNumber(value: number | null | undefined, digits = 4, suffix = ""): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}${suffix ? ` ${suffix}` : ""}`;
}

function formatDepthPpm(depth: number | null | undefined): string {
  if (depth === null || depth === undefined || !Number.isFinite(depth)) return "—";
  return `${Math.round(depth * 1_000_000).toLocaleString()} ppm`;
}

function missionCategory(filename: string): string {
  const norm = filename.toLowerCase();
  if (norm.includes("tess") || norm.includes("tic")) return "TESS / OBSERVATION";
  if (norm.includes("k2")) return "K2 / OBSERVATION";
  if (norm.includes("kepler") || norm.includes("kic")) return "KEPLER / OBSERVATION";
  return "PHOTOMETRY / OBSERVATION";
}

export function ResultsDashboard({
  analysis,
  filename,
}: {
  analysis: AnalysisResult;
  filename?: string | null;
}) {
  const candidate = analysis.candidates[0];
  const hasCandidate = Boolean(candidate && analysis.transit.detected);

  const displayTarget = filename || analysis.analysis_id;
  const sampleCount = analysis.lightcurve.sample_count;
  const missionKicker = missionCategory(displayTarget);

  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  function copyBibtex() {
    const year = new Date().getFullYear();
    const bib = `@article{exovision_${analysis.analysis_id.slice(0, 8)},\n  title={Candidate Screening Report for ${displayTarget}},\n  author={{ExoVision AI Astrophysical Pipeline}},\n  journal={ExoVision Candidate Screening Engine v2.4},\n  year={${year}},\n  url={${typeof window !== "undefined" ? window.location.href : ""}}\n}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(bib);
      setCopiedBibtex(true);
      setTimeout(() => setCopiedBibtex(false), 2000);
    }
  }

  function shareLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  // Calculate baseline duration safely without spread operator issues
  const timeArray = analysis.lightcurve.time;
  const timeMin = timeArray.length > 0 ? timeArray[0] : 0;
  const timeMax = timeArray.length > 0 ? timeArray[timeArray.length - 1] : 0;
  const observationDuration = timeMax > timeMin ? (timeMax - timeMin).toFixed(2) : "—";

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 text-[#090D0F] space-y-14">
      {/* Top Back Navigation Link */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-[#090D0F] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Research Workspace</span>
        </Link>
      </div>

      {/* 1. EDITORIAL OBSERVATION HEADER */}
      <header className="border-b border-[#090D0F]/10 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-signal font-semibold block mb-2">
            {missionKicker}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#090D0F] tracking-tight">
            {displayTarget}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-600">
            <span>Analysis EV-{analysis.analysis_id.slice(0, 8).toUpperCase()}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-emerald-700 font-semibold">Completed</span>
            <span className="text-zinc-300">·</span>
            <span>{sampleCount.toLocaleString()} Samples</span>
            <span className="text-zinc-300">·</span>
            <span>{observationDuration} d Baseline</span>
          </div>
        </div>

        {/* Editorial Action Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={copyBibtex}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[#090D0F]/20 text-[#090D0F] hover:bg-black/[0.03] transition-colors"
            title="Copy BibTeX citation"
          >
            {copiedBibtex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <BookOpen className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{copiedBibtex ? "Copied BibTeX" : "BibTeX Citation"}</span>
          </button>
          <button
            type="button"
            onClick={shareLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[#090D0F]/20 text-[#090D0F] hover:bg-black/[0.03] transition-colors"
            title="Share dossier link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{copiedLink ? "Link Copied" : "Share Dossier"}</span>
          </button>
          <ReportButton analysisId={analysis.analysis_id} />
        </div>
      </header>

      {/* 2. CANDIDATE SUMMARY BLOCK */}
      <section
        className="bg-white border border-[#090D0F]/10 rounded p-6 sm:p-8"
        aria-labelledby="candidate-outcome-heading"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-signal font-semibold block mb-1">
          Screening Verdict
        </span>
        <h2
          id="candidate-outcome-heading"
          className="font-serif text-2xl sm:text-3xl font-medium text-[#090D0F] tracking-tight"
        >
          {hasCandidate ? "TRANSIT CANDIDATE" : "NO TRANSIT CANDIDATE DETECTED"}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 font-sans max-w-2xl leading-relaxed">
          {hasCandidate
            ? "Evidence suggests a periodic transit-like signal consistent with an exoplanetary companion."
            : "The Box Least Squares (BLS) periodogram search did not detect periodic dips exceeding the detection threshold (SNR ≥ 7.0)."}
        </p>

        {/* Key Values Row (Editorial Typography - NO Individual Cards) */}
        <div className="mt-8 pt-6 border-t border-[#090D0F]/10 grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Classification
            </span>
            <strong className="text-base sm:text-lg font-medium text-[#090D0F] mt-1 block">
              {candidate?.classification ?? (hasCandidate ? "Planet Candidate" : "Non-Detection")}
            </strong>
          </div>
          <div className="sm:border-l sm:border-[#090D0F]/10 sm:pl-6">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Candidate Count
            </span>
            <strong className="text-base sm:text-lg font-medium text-[#090D0F] mt-1 block">
              {analysis.candidates.length}
            </strong>
          </div>
          <div className="sm:border-l sm:border-[#090D0F]/10 sm:pl-6">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Model Score
            </span>
            <strong className="text-base sm:text-lg font-medium text-signal mt-1 block">
              {candidate ? candidate.confidence.toFixed(2) : "—"}
            </strong>
          </div>
        </div>
      </section>

      {/* 3. STELLAR LIGHT CURVE (Largest Analytical Element on the Page) */}
      <section aria-labelledby="lightcurve-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-signal font-semibold block">
              Figure 01 · Full Photometric Continuum
            </span>
            <h2 id="lightcurve-heading" className="font-serif text-2xl sm:text-3xl font-medium text-[#090D0F]">
              Stellar Light Curve
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-sans">
              Normalized relative flux across full observation baseline. Precise coordinate axes with LTTB downsampling.
            </p>
          </div>
          <div className="text-xs font-mono text-zinc-500">
            <span>{sampleCount.toLocaleString()} Photometric Points</span>
          </div>
        </div>

        {/* Large Horizontal Chart Container */}
        <div className="border border-[#090D0F]/10 rounded bg-white p-4 sm:p-6 shadow-sm">
          <LightCurveChart
            flux={analysis.lightcurve.flux}
            time={analysis.lightcurve.time}
          />
        </div>

        {/* Measurement Strip (NO Individual Metric Cards) */}
        <div
          className="border border-[#090D0F]/10 bg-white rounded py-4 px-6 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#090D0F]/10 text-xs font-mono"
          aria-label="Key transit measurements"
        >
          <div className="py-2 sm:py-0 sm:pr-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">PERIOD (P)</span>
            <strong className="text-sm font-medium text-[#090D0F] mt-1 block">
              {formatNumber(analysis.transit.period, 4, "d")}
            </strong>
          </div>
          <div className="py-2 sm:py-0 sm:px-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">TRANSIT DEPTH (δ)</span>
            <strong className="text-sm font-medium text-[#090D0F] mt-1 block">
              {formatDepthPpm(analysis.transit.depth)}
            </strong>
          </div>
          <div className="py-2 sm:py-0 sm:px-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">DURATION (q)</span>
            <strong className="text-sm font-medium text-[#090D0F] mt-1 block">
              {analysis.transit.duration != null ? `${(analysis.transit.duration * 24).toFixed(2)} h` : "—"}
            </strong>
          </div>
          <div className="py-2 sm:py-0 sm:px-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">SIGNAL-TO-NOISE (S/N)</span>
            <strong className="text-sm font-medium text-signal mt-1 block">
              {formatNumber(analysis.transit.snr, 2)}
            </strong>
          </div>
          <div className="py-2 sm:py-0 sm:pl-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">EPOCH (t₀)</span>
            <strong className="text-sm font-medium text-[#090D0F] mt-1 block">
              {formatNumber(analysis.transit.epoch, 3, "BJD")}
            </strong>
          </div>
        </div>
      </section>

      {/* 4. PHASE-FOLDED TRANSIT & PERIODOGRAM */}
      <section aria-labelledby="phase-heading" className="space-y-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-signal font-semibold block">
            Figure 02 & 03 · Signal Alignment & Spectrum
          </span>
          <h2 id="phase-heading" className="font-serif text-2xl sm:text-3xl font-medium text-[#090D0F]">
            Phase-Folded Transit & BLS Periodogram
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-sans">
            Photometry folded onto the detected orbital period with limb-darkened model overlay, alongside Box Least Squares spectral power.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Phase-Folded Curve */}
          <div className="lg:col-span-7 bg-white border border-[#090D0F]/10 rounded p-6">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#090D0F]/05 text-xs font-mono">
              <span className="font-semibold text-[#090D0F]">Figure 02 / Phase-Folded Transit</span>
              <span className="text-zinc-500">P = {formatNumber(analysis.transit.period, 4, "d")}</span>
            </div>
            {hasCandidate && analysis.transit.phase.length > 0 ? (
              <FoldedCurveChart
                flux={analysis.transit.flux}
                phase={analysis.transit.phase}
                depth={analysis.transit.depth}
                duration={analysis.transit.duration}
                period={analysis.transit.period}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-xs font-mono text-zinc-400">
                <Orbit className="w-8 h-8 text-zinc-300 mb-2" />
                <p>Phase-folded transit requires a detected orbital period.</p>
              </div>
            )}
          </div>

          {/* BLS Periodogram */}
          <div className="lg:col-span-5 bg-white border border-[#090D0F]/10 rounded p-6">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#090D0F]/05 text-xs font-mono">
              <span className="font-semibold text-[#090D0F]">Figure 03 / BLS Power Spectrum</span>
              <span className="text-signal">Peak SNR {formatNumber(analysis.transit.snr, 2)}</span>
            </div>
            <PeriodogramChart
              peakPeriod={analysis.transit.period}
              peakSnr={analysis.transit.snr}
              height={260}
            />
          </div>
        </div>
      </section>

      {/* 5. EVIDENCE: Supporting vs Cautionary Evidence */}
      {hasCandidate && (
        <section aria-labelledby="evidence-heading">
          <ExplanationPanel candidate={candidate} />
        </section>
      )}

      {/* 6. MODEL INTERPRETATION: Feature Importance Attributions */}
      {hasCandidate && candidate?.explanation.feature_importance && (
        <section aria-labelledby="model-interpret-heading">
          <FeatureImportanceChart attributions={candidate.explanation.feature_importance} />
        </section>
      )}

      {/* 7. SCIENTIFIC PROVENANCE: Observed Data vs Derived Measurements vs Model Output */}
      <section aria-labelledby="provenance-heading" className="bg-white border border-[#090D0F]/10 rounded p-6 sm:p-8">
        <div className="pb-4 border-b border-[#090D0F]/10 mb-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold block">
            Provenance Architecture
          </span>
          <h2 id="provenance-heading" className="font-serif text-2xl font-medium text-[#090D0F] mt-0.5">
            Scientific Provenance Ledger
          </h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Clear delineation of observed telemetry, derived physical measurements, and model inference
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Layer 1: Observed Data */}
          <div className="space-y-3">
            <div className="pb-2 border-b border-[#090D0F]/10 flex items-center justify-between">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-700">
                01 · Observed Data
              </h3>
              <Database className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <dl className="space-y-2.5 text-xs font-mono">
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Target / File</dt>
                <dd className="font-medium text-[#090D0F] break-all">{displayTarget}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Photometric Samples</dt>
                <dd className="font-medium text-[#090D0F]">{sampleCount.toLocaleString()} points</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Baseline Duration</dt>
                <dd className="font-medium text-[#090D0F]">{observationDuration} days</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Calibration Pipeline</dt>
                <dd className="font-medium text-[#090D0F]">Normalized Flux F/F₀</dd>
              </div>
            </dl>
          </div>

          {/* Layer 2: Derived Measurements */}
          <div className="space-y-3">
            <div className="pb-2 border-b border-[#090D0F]/10 flex items-center justify-between">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-700">
                02 · Derived Measurements
              </h3>
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <dl className="space-y-2.5 text-xs font-mono">
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Detection Algorithm</dt>
                <dd className="font-medium text-[#090D0F]">Box Least Squares (BLS)</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Orbital Period (P)</dt>
                <dd className="font-medium text-[#090D0F]">{formatNumber(analysis.transit.period, 5, "days")}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Transit Depth (δ)</dt>
                <dd className="font-medium text-[#090D0F]">{formatDepthPpm(analysis.transit.depth)}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Epoch (t₀)</dt>
                <dd className="font-medium text-[#090D0F]">{formatNumber(analysis.transit.epoch, 4, "BJD")}</dd>
              </div>
            </dl>
          </div>

          {/* Layer 3: Model Output */}
          <div className="space-y-3">
            <div className="pb-2 border-b border-[#090D0F]/10 flex items-center justify-between">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-700">
                03 · Model Output
              </h3>
              <Compass className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <dl className="space-y-2.5 text-xs font-mono">
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Classifier Engine</dt>
                <dd className="font-medium text-[#090D0F]">Random Forest (100 Trees)</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Screening Classification</dt>
                <dd className="font-medium text-emerald-800">{candidate?.classification ?? "Non-Detection"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Model Score</dt>
                <dd className="font-medium text-signal">{candidate ? candidate.confidence.toFixed(4) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-zinc-400 uppercase">Analysis UUID</dt>
                <dd className="text-[11px] text-zinc-500 truncate">{analysis.analysis_id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Scientific Transparency Notice & Publication CTA */}
      <footer className="border-t border-[#090D0F]/10 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <p className="text-xs text-zinc-500 font-sans max-w-xl leading-relaxed">
          <strong>Scientific Notice:</strong> This analysis evaluates photometric transit morphology algorithmically.
          Independent validation through radial velocity spectrography or high-contrast imaging is required for planetary confirmation.
        </p>
        <div className="flex items-center gap-3">
          <ReportButton analysisId={analysis.analysis_id} />
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded border border-[#090D0F]/20 text-xs font-medium hover:border-[#090D0F]/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Analyze Another Observation</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
