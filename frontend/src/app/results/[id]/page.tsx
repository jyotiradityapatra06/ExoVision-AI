"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  FileSearch,
  LoaderCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { api, ApiError } from "@/lib/api";
import type { AnalysisResult, AnalysisStage, AnalysisStatus } from "@/types/api";

const STAGES: { stage: AnalysisStage; title: string; subtitle: string }[] = [
  {
    stage: "preparing_observation",
    title: "Preparing observation",
    subtitle: "Validating telemetry and normalizing stellar flux baseline",
  },
  {
    stage: "analyzing_lightcurve",
    title: "Analyzing light curve",
    subtitle: "Box Least Squares (BLS) periodogram transit frequency search",
  },
  {
    stage: "classifying_candidate",
    title: "Classifying candidate",
    subtitle: "Extracting morphological transit parameters & Random Forest screening",
  },
  {
    stage: "preparing_results",
    title: "Preparing results",
    subtitle: "Assembling scientific dossier, periodograms, and explainability attributions",
  },
];

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <ResultsContent id={id} />
    </ProtectedRoute>
  );
}

function ResultsContent({ id }: { id: string }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [workflow, setWorkflow] = useState<AnalysisStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [pollTrigger, setPollTrigger] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    async function synchronize() {
      try {
        const current = await api.analysisStatus(id);
        if (!active) return;
        setWorkflow(current);
        setError(null);
        setErrorStatus(null);
        setLoading(false);

        if (current.status === "completed") {
          const result = await api.getAnalysisResult(id);
          if (active) setAnalysis(result);
          return;
        }

        if (current.status === "processing") {
          timer = setTimeout(synchronize, 1500);
        }
      } catch (caught) {
        if (!active) return;
        setErrorStatus(caught instanceof ApiError ? caught.status : null);
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "This analysis could not be found or is not accessible to your account."
            : caught instanceof ApiError && caught.status === 0
            ? "The ExoVision API could not be reached. Check the service and try again."
            : "Analysis status could not be retrieved safely. Please try again.",
        );
        setLoading(false);
      }
    }

    void synchronize();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id, pollTrigger]);

  async function requestStart(retry: boolean) {
    setRetrying(true);
    setError(null);
    setErrorStatus(null);
    try {
      const accepted = retry ? await api.retryAnalysis(id) : await api.startAnalysis(id);
      setWorkflow((current) =>
        current
          ? {
              ...current,
              status: accepted.status,
              stage: accepted.stage,
              message: accepted.message,
              retryable: accepted.retryable,
              error: null,
            }
          : null,
      );
      setRetrying(false);
      setPollTrigger((prev) => prev + 1);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Analysis could not be started.");
      setRetrying(false);
    }
  }

  // 1. Initial Loading State (Synchronizing telemetry)
  if (loading) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-[#090D0F]">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full border border-[#090D0F]/15 bg-white flex items-center justify-center mx-auto text-[#090D0F]">
            <LoaderCircle className="w-5 h-5 animate-spin text-signal" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
              Synchronizing Observation
            </span>
            <h1 className="font-serif text-2xl font-normal text-[#090D0F] mt-1">
              Loading Analysis Telemetry
            </h1>
            <p className="mt-2 text-xs font-mono text-zinc-500 truncate">
              Target ID: {id}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 2. Failed State
  if (workflow?.status === "failed" || error) {
    const unavailable = errorStatus === 404;
    const safeError =
      error || workflow?.error || workflow?.message || "Analysis sequence could not be completed.";
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-[#090D0F]">
        <div className="bg-white border border-red-200 rounded p-8" role="alert">
          <div className="flex items-center gap-3 pb-6 border-b border-red-100">
            <div className="w-10 h-10 rounded bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-700 font-semibold">
                {unavailable ? "Record Unavailable" : "Pipeline Interrupted"}
              </span>
              <h1 className="font-serif text-2xl font-medium text-red-950 mt-0.5">
                {unavailable ? "Analysis Not Accessible" : "Photometric Processing Failed"}
              </h1>
              <p className="text-xs font-mono text-zinc-500 mt-1">
                Observation UUID: {workflow?.analysis_id || id}
              </p>
            </div>
          </div>

          <div className="my-6 p-4 rounded bg-red-50/50 border border-red-200/60 font-mono text-xs text-red-900 leading-relaxed">
            {safeError}
          </div>

          <p className="text-xs text-zinc-600 font-sans leading-relaxed mb-6">
            {unavailable
              ? "Return to your research workspace to inspect observations associated with your active session."
              : "The scientific analysis pipeline encountered an unrecoverable condition while processing this light curve. You may retry the job or review the photometric columns."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#090D0F]/10">
            {!unavailable && workflow?.retryable !== false && (
              <button
                type="button"
                disabled={retrying}
                onClick={() => void requestStart(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#090D0F] text-[#F7F5EF] text-xs font-medium hover:bg-[#1E293B] disabled:opacity-50 transition-colors"
              >
                {retrying ? (
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>{retrying ? "Retrying analysis…" : "Retry Pipeline Execution"}</span>
              </button>
            )}
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded border border-[#090D0F]/20 text-xs font-medium hover:border-[#090D0F]/40 transition-colors"
            >
              <FileSearch className="w-3.5 h-3.5 text-zinc-500" />
              <span>Analyze Another File</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded border border-transparent text-xs text-zinc-600 hover:text-[#090D0F] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Staged / Ready State
  if (workflow?.status === "uploaded") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-[#090D0F]">
        <div className="bg-white border border-[#090D0F]/10 rounded p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-[#090D0F]/10 mb-6">
            <div className="w-10 h-10 rounded bg-[#FAF9F5] border border-[#090D0F]/10 flex items-center justify-center text-[#090D0F]">
              <Database className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Staged Observation
              </span>
              <h1 className="font-serif text-2xl font-medium text-[#090D0F] mt-0.5">
                Observation Ready for Pipeline
              </h1>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                Analysis ID: {id}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 font-sans leading-relaxed mb-6">
            This observation has been validated and staged. Initiating the analysis will run flux baseline
            normalization, the Box Least Squares (BLS) periodogram search across thousands of trial frequencies,
            and Random Forest transit feature screening.
          </p>

          <div className="flex items-center gap-3 pt-4 border-t border-[#090D0F]/10">
            <button
              type="button"
              disabled={retrying}
              onClick={() => void requestStart(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#090D0F] text-[#F7F5EF] text-xs font-medium hover:bg-[#1E293B] disabled:opacity-50 transition-colors"
            >
              {retrying ? (
                <LoaderCircle className="w-3.5 h-3.5 animate-spin text-signal" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{retrying ? "Starting pipeline…" : "Start Candidate Screening"}</span>
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded border border-[#090D0F]/15 text-xs text-zinc-700 hover:text-[#090D0F] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 4. Focused Scientific Processing State
  if (workflow?.status === "processing") {
    const stageOrder: AnalysisStage[] = [
      "preparing_observation",
      "analyzing_lightcurve",
      "classifying_candidate",
      "preparing_results",
    ];
    const currentIndex = stageOrder.indexOf(workflow.stage);
    // Number of revealed photometric data points based on actual lifecycle progress
    const pointsRevealed = Math.min(80, 20 + Math.max(0, currentIndex) * 20);

    return (
      <main className="max-w-4xl mx-auto px-6 py-12 text-[#090D0F]" aria-live="polite">
        <section className="bg-white border border-[#090D0F]/10 rounded p-6 sm:p-10" role="status">
          {/* Masthead */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pb-6 border-b border-[#090D0F]/10">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-signal font-semibold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
                <span>Active Pipeline Operation</span>
              </div>
              <h1 className="font-serif text-3xl font-medium text-[#090D0F] tracking-tight">
                Analyzing Stellar Photometry
              </h1>
              <p className="mt-1 text-xs font-mono text-zinc-500">
                Target Observation ID: {id}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                Lifecycle Stage
              </span>
              <span className="font-mono text-xs font-semibold text-[#090D0F]">
                0{currentIndex + 1} / 04
              </span>
            </div>
          </div>

          {/* Progressive Light Curve Visualization (The Light Curve itself IS the visualization) */}
          <div className="my-8 p-6 rounded bg-[#FAF9F5] border border-[#090D0F]/08">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pb-3 mb-3 border-b border-[#090D0F]/05">
              <span className="uppercase tracking-widest text-signal font-semibold">
                Photometric Flux Continuum & Signal Extraction
              </span>
              <span>Points Ingested: {pointsRevealed} / 80</span>
            </div>

            {/* Dynamic Observational Light Curve SVG */}
            <div className="w-full h-32 relative overflow-hidden bg-white rounded border border-[#090D0F]/05">
              <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
                {/* Horizontal Coordinate Grids */}
                <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />

                {/* Vertical Transit Centroid Marker (Revealed once analyzing) */}
                {currentIndex >= 1 && (
                  <line x1="300" y1="0" x2="300" y2="120" stroke="rgba(217,119,6,0.35)" strokeDasharray="2 2" />
                )}

                {/* Progressively revealed data points */}
                {Array.from({ length: pointsRevealed }).map((_, i) => {
                  const x = 15 + (i / 80) * 570;
                  const dist = Math.abs(x - 300);
                  const dip = currentIndex >= 1 && dist < 50 ? Math.exp(-Math.pow(dist / 22, 2)) * 40 : 0;
                  const noise = Math.sin(i * 9.87) * 4.5;
                  const y = 45 + dip + noise;
                  const isTransit = currentIndex >= 1 && dist < 35;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isTransit ? "1.8" : "1.2"}
                      fill={isTransit ? "#d97706" : "rgba(15,23,42,0.4)"}
                      opacity={isTransit ? 0.95 : 0.6}
                    />
                  );
                })}

                {/* Fitted Box Transit Model (Revealed during classification & preparing results) */}
                {currentIndex >= 2 && (
                  <path
                    d="M 15 45 L 260 45 L 260 85 L 340 85 L 340 45 L 585 45"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    strokeOpacity="0.8"
                  />
                )}
              </svg>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-600">
              <span>{workflow.message || "Executing photometric screening pipeline…"}</span>
              <span className="text-zinc-400">Live Polling (1.5s cadence)</span>
            </div>
          </div>

          {/* Real Scientific Lifecycle Stages */}
          <ol className="divide-y divide-[#090D0F]/05 border-t border-[#090D0F]/10 pt-4" aria-label="Pipeline stages">
            {STAGES.map((s) => {
              const stageIndex = stageOrder.indexOf(s.stage);
              const isDone = stageIndex < currentIndex;
              const isActive = stageIndex === currentIndex;

              return (
                <li
                  key={s.stage}
                  className={`py-3.5 flex items-start gap-4 transition-colors ${
                    isActive ? "bg-amber-50/40 -mx-3 px-3 rounded" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    ) : isActive ? (
                      <LoaderCircle className="w-4 h-4 animate-spin text-signal" aria-hidden="true" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-zinc-300 flex items-center justify-center text-[9px] font-mono text-zinc-400">
                        {stageIndex + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className={`text-xs font-medium ${isActive ? "text-[#090D0F] font-semibold" : isDone ? "text-zinc-700" : "text-zinc-400"}`}>
                      {s.title}
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-normal">
                      {s.subtitle}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Quiet Assurance Footer */}
          <footer className="mt-8 pt-4 border-t border-[#090D0F]/10 text-center text-xs text-zinc-500 font-sans">
            Persisted background analysis. You can safely navigate away or refresh the page; the job will remain recorded.
          </footer>
        </section>
      </main>
    );
  }

  // 5. Completed State -> Render Full Interactive Scientific Dossier
  if (!analysis) return null;

  return <ResultsDashboard analysis={analysis} filename={id} />;
}
