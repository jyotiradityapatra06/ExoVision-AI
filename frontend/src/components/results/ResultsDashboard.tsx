"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  Database,
  FileText,
  HelpCircle,
  Orbit,
  RotateCcw,
  Share2,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FoldedCurveChart } from "@/components/charts/FoldedCurveChart";
import { LightCurveChart } from "@/components/charts/LightCurveChart";
import { PeriodogramChart } from "@/components/charts/PeriodogramChart";
import { ReportButton } from "@/components/reports/ReportButton";
import { ExplanationPanel } from "@/components/results/ExplanationPanel";
import { FeatureImportanceChart } from "@/components/results/FeatureImportanceChart";
import { StatusBadge } from "@/components/ui";
import type { AnalysisResult } from "@/types/api";

function formatNumber(value: number | null | undefined, digits = 4, suffix = ""): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}${suffix ? ` ${suffix}` : ""}`;
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

  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  function copyBibtex() {
    const year = new Date().getFullYear();
    const bib = `@article{exovision_${analysis.analysis_id.slice(0, 8)},\n  title={Candidate Screening Report for ${displayTarget}},\n  author={{ExoVision AI Astrophysical Pipeline}},\n  journal={ExoVision Candidate Screening Engine},\n  year={${year}},\n  url={${typeof window !== "undefined" ? window.location.href : ""}}\n}`;
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

  // Calculate baseline metrics for lightcurve safely without spread operator stack overflow risks
  const timeArray = analysis.lightcurve.time;
  const timeMin = timeArray.length > 0 ? timeArray[0] : 0;
  const timeMax = timeArray.length > 0 ? timeArray[timeArray.length - 1] : 0;
  const observationDuration = timeMax > timeMin ? (timeMax - timeMin).toFixed(2) : "—";

  return (
    <div className="results-workspace">
      {/* Top back navigation */}
      <div className="mb-4">
        <Link
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-cyan-300 font-mono"
          href="/dashboard"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Research Dashboard</span>
        </Link>
      </div>

      {/* 1. Observation Identity & Header */}
      <header className="results-header" aria-labelledby="result-title">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
          <div>
            <div className="results-header-top flex flex-wrap items-center gap-2">
              <p className="results-kicker">SCIENTIFIC EVIDENCE DOSSIER / OBSERVATION ANALYSIS</p>
              <div className="results-status-badges flex items-center gap-1.5">
                <StatusBadge status="completed" />
                {hasCandidate ? (
                  <StatusBadge status="candidate" />
                ) : (
                  <StatusBadge status="non-detection" />
                )}
              </div>
            </div>

            <h1 className="results-title" id="result-title">
              {hasCandidate ? "Candidate screening dossier" : "Observation screening dossier"}
            </h1>

            <div className="results-meta">
              <span>
                Target / observation: <code>{displayTarget}</code>
              </span>
              <span>
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{sampleCount.toLocaleString()} photometric samples</span>
              </span>
              <span>
                <Telescope className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Observation baseline: {observationDuration} days</span>
              </span>
              <span>
                Analysis ID: <code>{analysis.analysis_id}</code>
              </span>
            </div>
          </div>

          {/* Quick Actions Header Strip */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyBibtex}
              className="inline-flex items-center gap-1.5 rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-white/[0.18] hover:bg-white/[0.05]"
              title="Copy BibTeX Citation"
            >
              {copiedBibtex ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <BookOpen className="h-3.5 w-3.5 text-zinc-400" />}
              <span>{copiedBibtex ? "Copied BibTeX!" : "BibTeX"}</span>
            </button>
            <button
              type="button"
              onClick={shareLink}
              className="inline-flex items-center gap-1.5 rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-white/[0.18] hover:bg-white/[0.05]"
              title="Share Dossier Link"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-zinc-400" />}
              <span>{copiedLink ? "Link Copied!" : "Share"}</span>
            </button>
            <ReportButton analysisId={analysis.analysis_id} />
          </div>
        </div>
      </header>

      {/* Dossier Reference Tabs */}
      <nav className="results-reference-tabs" aria-label="Analysis result sections">
        <a href="#classification-summary">Classification</a>
        <a href="#signal-parameters">Parameters</a>
        <a href="#light-curve">Light Curve</a>
        <a href="#phase-folded">Phase Folded</a>
        <a href="#periodogram">Period Search</a>
        {hasCandidate && <a href="#model-evidence">Model Evidence</a>}
        <a href="#param-registry">Registry</a>
        <a href="#publication-export">Export</a>
      </nav>

      {/* 2. Classification Summary */}
      {hasCandidate ? (
        <section className="results-section" id="classification-summary" aria-labelledby="class-summary-title">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 p-5 border border-white/[0.08] bg-gradient-to-br from-[#081018]/90 to-[#040a10]/95">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="results-kicker">CLASSIFICATION SUMMARY</span>
                <span className="results-badge results-badge-candidate">Screening Candidate</span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight" id="class-summary-title">
                {candidate.classification}
              </h2>
              {candidate.explanation.summary && (
                <p className="mt-1 text-xs md:text-sm leading-relaxed text-slate-300 max-w-2xl">
                  {candidate.explanation.summary}
                </p>
              )}
            </div>

            <div className="flex flex-col justify-between border border-white/[0.08] bg-[#060a0f]/80 p-4">
              <div className="flex items-center justify-between">
                <span className="results-kicker">MODEL SCORE</span>
                <span className="font-mono text-[11px] text-slate-400">Random Forest</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono text-2xl font-bold text-cyan-300">
                  {(candidate.confidence * 100).toFixed(1)}%
                </span>
                <span className="font-mono text-xs text-slate-400">
                  ({candidate.confidence.toFixed(4)})
                </span>
              </div>
              <div
                className="results-score-track mt-2"
                role="progressbar"
                aria-label="Model screening score"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(candidate.confidence * 100)}
              >
                <div
                  className="results-score-fill"
                  style={{ width: `${Math.max(0, Math.min(100, candidate.confidence * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-500 leading-snug">
                Supervised classification score from bundled Random Forest estimator. Diagnostic vetting metric; does not represent empirical exoplanetary confirmation.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="results-negative-banner" id="classification-summary" aria-label="Negative detection outcome">
          <div className="results-negative-banner-main">
            <div className="results-negative-banner-icon">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="results-kicker text-amber-400/80">DETECTION SEARCH OUTCOME</span>
                <span className="results-badge results-badge-nocandidate">Non-Detection</span>
              </div>
              <h2 className="mt-1">No periodic transit candidate identified</h2>
              <p>
                The Box Least Squares (BLS) periodogram search completed across all trial orbital frequencies for this observation, but did not detect periodic dips meeting the detection criteria for transit extraction. Consequently, no candidate was submitted for machine-learning feature classification.
              </p>
              <p className="mt-2 text-slate-500 font-mono text-xs">
                A non-detection is a valid scientific outcome. Stellar variability, photometric noise, or lack of transits along the line of sight are common in unvetted stellar curves.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. Signal Parameters Strip (Compact Scientific Strip) */}
      <section className="mt-6 border border-white/[0.08] bg-[#080d13]" id="signal-parameters" aria-label="Signal parameters">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.015]">
          <p className="results-kicker">MEASURED SIGNAL PARAMETERS</p>
          <span className="text-[11px] font-mono text-slate-500">BLS Transit Fit</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/[0.07]">
          {/* 1. Period */}
          <div className="bg-[#080d13] p-3.5 flex flex-col justify-between min-h-[90px]">
            <span className="font-mono text-[10px] uppercase text-[#647682] tracking-wider font-semibold">Orbital Period (P)</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-lg md:text-xl font-semibold text-[#f1f6f8] tracking-tight">
                {formatNumber(analysis.transit.period, 4)}
              </span>
              <span className="font-mono text-xs text-cyan-400">days</span>
            </div>
            <span className="font-mono text-[11px] text-[#71828d] mt-1">
              {analysis.transit.period != null
                ? `${(analysis.transit.period * 24).toFixed(2)} hrs`
                : "Unavailable"}
            </span>
          </div>

          {/* 2. Transit Depth */}
          <div className="bg-[#080d13] p-3.5 flex flex-col justify-between min-h-[90px]">
            <span className="font-mono text-[10px] uppercase text-[#647682] tracking-wider font-semibold">Transit Depth (δ)</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-lg md:text-xl font-semibold text-[#f1f6f8] tracking-tight">
                {analysis.transit.depth != null
                  ? (analysis.transit.depth * 100).toFixed(4)
                  : "—"}
              </span>
              <span className="font-mono text-xs text-cyan-400">%</span>
            </div>
            <span className="font-mono text-[11px] text-[#71828d] mt-1">
              {analysis.transit.depth != null
                ? `${Math.round(analysis.transit.depth * 1_000_000).toLocaleString()} ppm`
                : "Unavailable"}
            </span>
          </div>

          {/* 3. Duration */}
          <div className="bg-[#080d13] p-3.5 flex flex-col justify-between min-h-[90px]">
            <span className="font-mono text-[10px] uppercase text-[#647682] tracking-wider font-semibold">Transit Duration (T₁₄)</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-lg md:text-xl font-semibold text-[#f1f6f8] tracking-tight">
                {formatNumber(analysis.transit.duration, 4)}
              </span>
              <span className="font-mono text-xs text-cyan-400">days</span>
            </div>
            <span className="font-mono text-[11px] text-[#71828d] mt-1">
              {analysis.transit.duration != null
                ? `${(analysis.transit.duration * 24).toFixed(2)} hrs`
                : "Unavailable"}
            </span>
          </div>

          {/* 4. Center Epoch */}
          <div className="bg-[#080d13] p-3.5 flex flex-col justify-between min-h-[90px]">
            <span className="font-mono text-[10px] uppercase text-[#647682] tracking-wider font-semibold">Center Epoch (t₀)</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-lg md:text-xl font-semibold text-[#f1f6f8] tracking-tight">
                {formatNumber(analysis.transit.epoch, 4)}
              </span>
              <span className="font-mono text-xs text-cyan-400">days</span>
            </div>
          </div>

          {/* 5. Transit SNR */}
          <div className="bg-[#080d13] p-3.5 flex flex-col justify-between min-h-[90px]">
            <span className="font-mono text-[10px] uppercase text-[#647682] tracking-wider font-semibold">Transit SNR</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-lg md:text-xl font-semibold text-[#f1f6f8] tracking-tight">
                {formatNumber(analysis.transit.snr, 2)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Diagnostic Evidence (Figures 01–03) */}
      <section className="results-section" aria-labelledby="figures-heading">
        <div className="results-section-header">
          <p className="results-kicker">FIGURE SERIES 01–03</p>
          <h2 id="figures-heading">Observation visualizations</h2>
          <p>Interactive photometric measurements, periodic phase alignment, and Box Least Squares (BLS) period search diagnostic</p>
        </div>

        <div className="results-charts-grid">
          {/* Figure 01: Observed Light Curve */}
          <article className="results-chart-panel" id="light-curve" aria-labelledby="fig-01-title">
            <header className="results-chart-header">
              <div>
                <p className="results-kicker">FIGURE 01 / SOURCE PHOTOMETRY</p>
                <h3 id="fig-01-title">Observed light curve</h3>
                <p>Normalized relative flux plotted across observation baseline</p>
              </div>
              <span className="results-chart-badge">
                <Database className="h-3 w-3" aria-hidden="true" />
                <span>{sampleCount.toLocaleString()} samples</span>
              </span>
            </header>
            <div className="results-chart-body">
              <LightCurveChart
                flux={analysis.lightcurve.flux}
                time={analysis.lightcurve.time}
              />
            </div>
            <dl className="results-chart-footer">
              <div>
                <dt>Baseline Duration</dt>
                <dd>{observationDuration} days</dd>
              </div>
              <div>
                <dt>Sample Density</dt>
                <dd>{sampleCount.toLocaleString()} points</dd>
              </div>
              <div>
                <dt>Flux Normalization</dt>
                <dd>Relative Median</dd>
              </div>
            </dl>
          </article>

          {/* Figure 02: Phase-Folded Curve */}
          <article className="results-chart-panel" id="phase-folded" aria-labelledby="fig-02-title">
            <header className="results-chart-header">
              <div>
                <p className="results-kicker">FIGURE 02 / PERIODIC SIGNAL</p>
                <h3 id="fig-02-title">Phase-folded curve</h3>
                <p>
                  {hasCandidate
                    ? `Measurements folded at detected period (${formatNumber(analysis.transit.period, 4, "d")}), with theoretical transit fit overlay`
                    : "Measurements folded across candidate period (if detected)"}
                </p>
              </div>
              <span className="results-chart-badge">
                <Orbit className="h-3 w-3" aria-hidden="true" />
                <span>{hasCandidate ? "Periodic dip aligned" : "No period detected"}</span>
              </span>
            </header>
            <div className="results-chart-body">
              {hasCandidate && analysis.transit.phase.length > 0 ? (
                <FoldedCurveChart
                  flux={analysis.transit.flux}
                  phase={analysis.transit.phase}
                  depth={analysis.transit.depth}
                  duration={analysis.transit.duration}
                  period={analysis.transit.period}
                />
              ) : (
                <div className="flex h-[320px] flex-col items-center justify-center p-6 text-center text-slate-500 font-mono text-xs">
                  <Orbit className="h-8 w-8 text-slate-600 mb-2" aria-hidden="true" />
                  <p>Phase folding requires a periodic transit candidate.</p>
                  <p className="mt-1 text-slate-600 text-[11px]">
                    BLS periodogram did not identify a periodic transit signal.
                  </p>
                </div>
              )}
            </div>
            <dl className="results-chart-footer">
              <div>
                <dt>Detected Period</dt>
                <dd>{formatNumber(analysis.transit.period, 4, "d")}</dd>
              </div>
              <div>
                <dt>Transit Duration</dt>
                <dd>{formatNumber(analysis.transit.duration, 4, "d")}</dd>
              </div>
              <div>
                <dt>Signal-to-Noise</dt>
                <dd>{formatNumber(analysis.transit.snr, 2)}</dd>
              </div>
            </dl>
          </article>

          {/* Figure 03: BLS Period Search Diagnostic */}
          <article className="results-chart-panel col-span-full" id="periodogram" aria-labelledby="fig-03-title">
            <header className="results-chart-header">
              <div>
                <p className="results-kicker">FIGURE 03 / PERIOD SEARCH DIAGNOSTIC</p>
                <h3 id="fig-03-title">Period Search Diagnostic</h3>
                <p>Diagnostic visualization derived from the detected BLS peak period and SNR. Raw periodogram samples are not returned by the current analysis API.</p>
              </div>
              <span className="results-chart-badge">
                <Orbit className="h-3 w-3" aria-hidden="true" />
                <span>BLS SNR {formatNumber(analysis.transit.snr, 2)}</span>
              </span>
            </header>
            <div className="results-chart-body">
              <PeriodogramChart
                peakPeriod={analysis.transit.period}
                peakSnr={analysis.transit.snr}
                height={260}
              />
            </div>
            <dl className="results-chart-footer grid-cols-2">
              <div>
                <dt>Peak Period</dt>
                <dd>{formatNumber(analysis.transit.period, 4, "d")}</dd>
              </div>
              <div>
                <dt>Peak SNR</dt>
                <dd>{formatNumber(analysis.transit.snr, 2)}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      {/* 5. Model Screening & Evidence Grid */}
      {hasCandidate ? (
        <section className="results-section" id="model-evidence" aria-labelledby="interpret-heading">
          <div className="results-section-header">
            <p className="results-kicker">MODEL SCREENING & EVIDENCE</p>
            <h2 id="interpret-heading">Candidate interpretation</h2>
            <p>Observable properties and feature weights evaluated by the Random Forest screening pipeline</p>
          </div>

          <div className="results-interpret-grid">
            <ExplanationPanel candidate={candidate} />
            <FeatureImportanceChart attributions={candidate?.explanation.feature_importance} />
          </div>
        </section>
      ) : null}

      {/* 6. Technical Parameters Table & Provenance */}
      <section className="results-section" id="param-registry" aria-labelledby="param-heading">
        <div className="results-parameters-panel">
          <div className="results-panel-title">
            <div>
              <p className="results-kicker">TABLE 01 / MEASUREMENT REGISTRY</p>
              <h3 id="param-heading">Transit & screening parameters</h3>
            </div>
          </div>

          <table className="results-param-table">
            <tbody>
              <tr>
                <td>Target / Observation Source</td>
                <td>{displayTarget}</td>
              </tr>
              <tr>
                <td>Pipeline Execution Status</td>
                <td>{analysis.summary.status ?? "completed"}</td>
              </tr>
              <tr>
                <td>Detection Method</td>
                <td>Box Least Squares (BLS)</td>
              </tr>
              <tr>
                <td>Detected Orbital Period</td>
                <td>{formatNumber(analysis.transit.period, 5, "days")}</td>
              </tr>
              <tr>
                <td>Transit Center Epoch (t₀)</td>
                <td>{formatNumber(analysis.transit.epoch, 4, "days")}</td>
              </tr>
              <tr>
                <td>Transit Duration</td>
                <td>
                  {analysis.transit.duration != null
                    ? `${analysis.transit.duration.toFixed(4)} days (${(analysis.transit.duration * 24).toFixed(2)} hrs)`
                    : "—"}
                </td>
              </tr>
              <tr>
                <td>Fractional Transit Depth (δ)</td>
                <td>
                  {analysis.transit.depth != null
                    ? `${analysis.transit.depth.toFixed(6)} (${(analysis.transit.depth * 100).toFixed(4)}% / ${Math.round(analysis.transit.depth * 1_000_000).toLocaleString()} ppm)`
                    : "—"}
                </td>
              </tr>
              <tr>
                <td>Transit Signal-to-Noise (SNR)</td>
                <td>{formatNumber(analysis.transit.snr, 2)}</td>
              </tr>
              <tr>
                <td>Screening Classifier</td>
                <td>Random Forest (100 Estimators, Bundled Artifact)</td>
              </tr>
              <tr>
                <td>Classifier Screening Label</td>
                <td>{candidate?.classification ?? "No Candidate Classified"}</td>
              </tr>
              <tr>
                <td>Screening Model Score</td>
                <td>
                  {candidate ? `${(candidate.confidence * 100).toFixed(1)}% (${candidate.confidence.toFixed(4)})` : "—"}
                </td>
              </tr>
              <tr>
                <td>Analysis Identifier</td>
                <td><code>{analysis.analysis_id}</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Scientific Notice */}
      <aside className="results-disclaimer" aria-label="Scientific transparency notice">
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        <div>
          <p>
            <strong>Scientific Notice:</strong> ExoVision performs automated candidate screening. Results are analytical evidence for further review and do not constitute independent astronomical confirmation.
          </p>
        </div>
      </aside>

      {/* 7. Publication Export & Action Strip */}
      <section className="results-export-strip" id="publication-export" aria-labelledby="export-heading">
        <div className="results-export-strip-main">
          <div className="results-export-strip-icon">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="results-kicker">PUBLICATION EXPORT</p>
            <h2 id="export-heading">Generate Scientific Report</h2>
            <p>
              Export full candidate measurements, transit parameters, photometric visualizations, and Random Forest feature evidence into an immutable, publication-ready PDF.
            </p>
          </div>
        </div>

        <div className="results-export-actions">
          <ReportButton analysisId={analysis.analysis_id} />
          <Link
            className="dashboard-secondary-action min-h-[42px] px-4"
            href="/upload"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Analyze another observation</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
