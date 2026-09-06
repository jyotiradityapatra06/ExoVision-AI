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
    subtitle: "Validating photometry and normalizing flux baseline",
  },
  {
    stage: "analyzing_lightcurve",
    title: "Analyzing light curve",
    subtitle: "Scanning trial orbital periods via Box Least Squares (BLS)",
  },
  {
    stage: "classifying_candidate",
    title: "Classifying candidate",
    subtitle: "Extracting transit features and running Random Forest screening",
  },
  {
    stage: "preparing_results",
    title: "Preparing results",
    subtitle: "Assembling candidate metrics and explainability evidence",
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
        setError(caught instanceof ApiError && caught.status === 404 ? "This analysis could not be found or is not available to your account." : caught instanceof ApiError && caught.status === 0 ? "The ExoVision API could not be reached. Check the service and try again." : "Analysis status could not be retrieved safely. Please try again.");
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
          : null
      );
      setRetrying(false);
      setPollTrigger((prev) => prev + 1);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Analysis could not be started.");
      setRetrying(false);
    }
  }

  // 1. Initial Loading State
  if (loading) {
    return (
      <div className="results-state-wrapper" role="status" aria-live="polite">
        <div className="results-state-card text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-cyan-400/20 bg-cyan-400/5 text-cyan-300">
            <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
          </div>
          <p className="results-kicker mt-5">SYNCHRONIZING TELEMETRY</p>
          <h1 className="mt-2 text-xl font-semibold text-white">Loading analysis results</h1>
          <p className="mt-2 text-xs text-slate-400 font-mono">
            Retrieving observation status and photometric data for {id}...
          </p>
        </div>
      </div>
    );
  }

  // 2. Failed State
  if (workflow?.status === "failed" || error) {
    const unavailable = errorStatus === 404;
    const safeError =
      error || workflow?.error || workflow?.message || "Analysis sequence could not be completed.";
    return (
      <div className="results-state-wrapper">
        <div className="results-state-card" role="alert">
          <div className="results-state-header">
            <div className="results-state-icon is-error">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="results-kicker">{unavailable ? "ANALYSIS UNAVAILABLE" : "ANALYSIS FAILED"}</p>
              <h1 className="mt-1">{unavailable ? "Analysis is not available" : "Analysis could not be completed"}</h1>
              <p className="results-state-meta">
                Observation ID: <code>{workflow?.analysis_id || id}</code>
              </p>
            </div>
          </div>

          <div className="mt-6 border-l-2 border-rose-500/60 bg-rose-500/5 p-4 text-xs font-mono text-rose-300 leading-relaxed">
            <p>{safeError}</p>
          </div>

          <p className="mt-4 text-xs text-slate-500 leading-relaxed">{unavailable ? "Return to your dashboard to open an analysis owned by the current account." : "The photometric pipeline encountered an unrecoverable condition while processing this observation. You may retry the analysis if the pipeline was temporarily interrupted, or inspect the file format."}</p>

          <div className="results-state-actions">
            {!unavailable && workflow?.retryable !== false && (
              <button
                className="dashboard-primary-action min-h-[42px] px-4"
                disabled={retrying}
                onClick={() => void requestStart(true)}
                type="button"
              >
                {retrying ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{retrying ? "Retrying analysis…" : "Retry analysis"}</span>
              </button>
            )}
            {!unavailable && <Link className="dashboard-secondary-action min-h-[42px] px-4" href="/upload">
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              <span>Choose another observation</span>
            </Link>}
            <Link className="dashboard-secondary-action min-h-[42px] px-4" href="/dashboard">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Return to dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Uploaded / Ready State
  if (workflow?.status === "uploaded") {
    return (
      <div className="results-state-wrapper">
        <div className="results-state-card">
          <div className="results-state-header">
            <div className="results-state-icon is-ready">
              <Database className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="results-kicker">OBSERVATION INGESTED</p>
              <h1 className="mt-1">Observation ready for analysis</h1>
              <p className="results-state-meta">
                Observation ID: <code>{id}</code>
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-slate-400">
            This observation has been validated and staged. Starting analysis will initiate flux baseline normalization, the Box Least Squares (BLS) transit periodogram search, and candidate machine-learning screening.
          </p>

          <div className="results-state-actions">
            <button
              className="dashboard-primary-action min-h-[42px] px-4"
              disabled={retrying}
              onClick={() => void requestStart(false)}
              type="button"
            >
              {retrying ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{retrying ? "Initiating pipeline…" : "Start analysis"}</span>
            </button>
            <Link className="dashboard-secondary-action min-h-[42px] px-4" href="/dashboard">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Return to dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Processing State
  if (workflow?.status === "processing") {
    const stageOrder: AnalysisStage[] = [
      "preparing_observation",
      "analyzing_lightcurve",
      "classifying_candidate",
      "preparing_results",
    ];
    const currentIndex = stageOrder.indexOf(workflow.stage);

    return (
      <main className="results-state-wrapper" aria-live="polite">
        <section className="results-state-card" role="status">
          <div className="results-state-header">
            <div className="results-state-icon is-spinning">
              <LoaderCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="results-kicker">PIPELINE EXECUTION IN PROGRESS</p>
              <h1 className="mt-1">Analyzing observation</h1>
              <p className="results-state-meta">
                Observation target: <code>{id}</code>
              </p>
            </div>
          </div>

          <div className="mt-6 border border-cyan-400/20 bg-cyan-400/5 p-3.5 text-xs font-mono text-cyan-200">
            <p className="font-semibold">{workflow.message || "Executing photometric screening pipeline…"}</p>
          </div>

          <ol className="results-stages-flow" aria-label="Pipeline stages">
            {STAGES.map((s) => {
              const stageIndex = stageOrder.indexOf(s.stage);
              const isDone = stageIndex < currentIndex;
              const isActive = stageIndex === currentIndex;

              return (
                <li
                  className={`results-stage-item ${isDone ? "is-completed" : isActive ? "is-active" : ""}`}
                  key={s.stage}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" aria-hidden="true" />
                  ) : isActive ? (
                    <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300 shrink-0" aria-hidden="true" />
                  ) : (
                    <span className="results-stage-dot" aria-hidden="true" />
                  )}
                  <div>
                    <p className="font-semibold leading-tight">{s.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.subtitle}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <footer className="results-state-footer">
            <p>
              This workspace reflects persisted backend state. You can safely refresh the page or return later without interrupting the analysis or creating a duplicate job.
            </p>
          </footer>
        </section>
      </main>
    );
  }

  // 5. Completed State
  if (!analysis) return null;

  return <ResultsDashboard analysis={analysis} filename={id} />;
}
