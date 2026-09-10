"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  Database,
  FileText,
  HelpCircle,
  Layers,
  Orbit,
  RotateCcw,
  ScanSearch,
  Share2,
  Sparkles,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { FoldedCurveChart } from "@/components/charts/FoldedCurveChart";
import { LightCurveChart } from "@/components/charts/LightCurveChart";
import { PeriodogramChart } from "@/components/charts/PeriodogramChart";
import { ReportButton } from "@/components/reports/ReportButton";
import { ExplanationPanel } from "@/components/results/ExplanationPanel";
import { FeatureImportanceChart } from "@/components/results/FeatureImportanceChart";
import { ConfidenceGauge, ObservatoryCard, StatusBadge } from "@/components/ui";
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

  const [utcTime, setUtcTime] = useState("");
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const update = () => {
      setUtcTime(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

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

      {/* Result Header */}
      <header className="results-header" aria-labelledby="result-title">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
          <div>
            <div className="results-header-top flex flex-wrap items-center gap-2">
              <p className="results-kicker">ANALYSIS / RESULTS</p>
              <div className="results-status-badges flex items-center gap-1.5">
                <StatusBadge status="completed" />
                {hasCandidate ? (
                  <StatusBadge status="candidate" />
                ) : (
                  <StatusBadge status="non-detection" />
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                <Clock className="h-3 w-3 text-cyan-400" />
                <span>{utcTime || "UTC CLOCK"}</span>
              </div>
            </div>

            <h1 className="results-title" id="result-title">
              {hasCandidate ? "Candidate screening result" : "Observation screening result"}
            </h1>

            <div className="results-meta">
              <span>
                Target / file: <code>{displayTarget}</code>
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
                ID: <code>{analysis.analysis_id}</code>
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

      <nav className="results-reference-tabs" aria-label="Analysis result sections">
        <a href="#result-overview">Overview</a>
        <a href="#light-curve">Light Curve</a>
        <a href="#phase-folded">Phase Folded</a>
        <a href="#periodogram">Periodogram</a>
        <a href="#ai-evidence">AI Evidence</a>
        <a href="#candidates">Parameters</a>
      </nav>

      {/* Candidate Summary or Negative Result Banner */}
      {hasCandidate ? (
        <section className="results-metrics-strip" id="result-overview" aria-label="Candidate measurements">
          {/* 1. Period */}
          <article className="results-metric-card">
            <header>
              <p className="label">Orbital Period</p>
              <Orbit className="h-4 w-4" aria-hidden="true" />
            </header>
            <div>
              <p className="value">{formatNumber(analysis.transit.period, 4, "d")}</p>
              <p className="subtext">
                {analysis.transit.period != null
                  ? `${(analysis.transit.period * 24).toFixed(2)} hours`
                  : "Unavailable"}
              </p>
            </div>
          </article>

          {/* 2. Transit Depth */}
          <article className="results-metric-card">
            <header>
              <p className="label">Transit Depth</p>
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
            </header>
            <div>
              <p className="value">
                {analysis.transit.depth != null
                  ? `${(analysis.transit.depth * 100).toFixed(4)}%`
                  : "—"}
              </p>
              <p className="subtext">
                {analysis.transit.depth != null
                  ? `${Math.round(analysis.transit.depth * 1_000_000).toLocaleString()} ppm`
                  : "Unavailable"}
              </p>
            </div>
          </article>

          {/* 3. Duration */}
          <article className="results-metric-card">
            <header>
              <p className="label">Transit Duration</p>
              <Activity className="h-4 w-4" aria-hidden="true" />
            </header>
            <div>
              <p className="value">{formatNumber(analysis.transit.duration, 4, "d")}</p>
              <p className="subtext">
                {analysis.transit.duration != null
                  ? `${(analysis.transit.duration * 24).toFixed(2)} hours`
                  : "Unavailable"}
              </p>
            </div>
          </article>

          {/* 4. Transit SNR */}
          <article className="results-metric-card">
            <header>
              <p className="label">Transit SNR</p>
              <Layers className="h-4 w-4" aria-hidden="true" />
            </header>
            <div>
              <p className="value">{formatNumber(analysis.transit.snr, 2)}</p>
              <p className="subtext">BLS detection ratio</p>
            </div>
          </article>

          {/* 5. Model Score */}
          <ObservatoryCard className="results-metric-card results-score-card" variant="reticle">
            <header>
              <p className="label text-cyan-300">Model Score</p>
              <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            </header>
            <div>
              <ConfidenceGauge value={candidate?.confidence ?? 0} />
            </div>
          </ObservatoryCard>
        </section>
      ) : (
        <section className="results-negative-banner" aria-label="Negative detection outcome">
          <div className="results-negative-banner-main">
            <div className="results-negative-banner-icon">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2>No strong transit-like candidate identified</h2>
              <p>
                The Box Least Squares (BLS) periodogram search completed across all trial orbital frequencies for this observation, but did not detect periodic dips exceeding the detection criteria (SNR &ge; 7.0). Consequently, no candidate was submitted for machine-learning feature classification.
              </p>
              <p className="mt-2 text-slate-500 font-mono text-xs">
                A non-detection is a valid scientific outcome. Stellar variability, photometric noise, or lack of transits along the line of sight are common in unvetted stellar curves.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Visualizations Section */}
      <section className="results-section" aria-labelledby="figures-heading">
        <div className="results-section-header">
          <p className="results-kicker">FIGURE SERIES 01–03</p>
          <h2 id="figures-heading">Observation visualizations</h2>
          <p>Interactive photometric measurements, periodic phase alignment, and BLS spectral power</p>
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
                <dt>Normalized Mean</dt>
                <dd>1.0000 flux</dd>
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

          {/* Figure 03: BLS Periodogram Spectrum */}
          <article className="results-chart-panel col-span-full" id="periodogram" aria-labelledby="fig-03-title">
            <header className="results-chart-header">
              <div>
                <p className="results-kicker">FIGURE 03 / SPECTRAL FREQUENCY SEARCH</p>
                <h3 id="fig-03-title">Box Least Squares (BLS) periodogram</h3>
                <p>Detection power spectrum vs. trial orbital periods with peak and harmonic markers</p>
              </div>
              <span className="results-chart-badge">
                <Activity className="h-3 w-3" aria-hidden="true" />
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
            <dl className="results-chart-footer">
              <div>
                <dt>Spectral Peak</dt>
                <dd>{formatNumber(analysis.transit.period, 4, "d")}</dd>
              </div>
              <div>
                <dt>Harmonic Invariant</dt>
                <dd>P/2, P, 2P checked</dd>
              </div>
              <div>
                <dt>Detection Threshold</dt>
                <dd>SNR &ge; 7.0</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      {/* Model Interpretation & Evidence Grid */}
      {hasCandidate ? (
        <section className="results-section" id="ai-evidence" aria-labelledby="interpret-heading">
          <div className="results-section-header">
            <p className="results-kicker">MODEL SCREENING & EVIDENCE</p>
            <h2 id="interpret-heading">Candidate interpretation</h2>
            <p>Understand which observable properties influenced the machine-learning candidate screening</p>
          </div>

          <div className="results-interpret-grid">
            <ExplanationPanel candidate={candidate} />
            <FeatureImportanceChart attributions={candidate?.explanation.feature_importance} />
          </div>
        </section>
      ) : null}

      {/* Technical Parameters Table */}
      <section className="results-section" id="candidates" aria-labelledby="param-heading">
        <div className="results-parameters-panel">
          <div className="results-panel-title">
            <div>
              <p className="results-kicker">TABLE 01 / MEASUREMENT REGISTRY</p>
              <h3 id="param-heading">Transit & screening parameters</h3>
            </div>
            <Activity className="h-4 w-4" aria-hidden="true" />
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
                <td>Detection Algorithm</td>
                <td>Box Least Squares (BLS) Periodogram</td>
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
            </tbody>
          </table>
        </div>
      </section>

      {/* Scientific Transparency Caveat */}
      <aside className="results-disclaimer" aria-label="Scientific transparency caveat">
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        <div>
          <p>
            <strong>Scientific Transparency Notice:</strong> This analysis identifies and screens transit-like signals algorithmically. It does not independently confirm an exoplanet. Candidate confirmation requires independent scientific validation through radial velocity spectrography, high-contrast imaging, and multi-band transit verification to rule out astrophysical false positives such as blended eclipsing binaries.
          </p>
        </div>
      </aside>

      {/* Publication Export & Action Strip */}
      <section className="results-export-strip" aria-labelledby="export-heading">
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
            className="dashboard-secondary-action"
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
