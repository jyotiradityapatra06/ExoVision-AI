"use client";

import { ArrowLeft, CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { use, useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/button";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { api, ApiError } from "@/lib/api";
import type { AnalysisResult, AnalysisStage, AnalysisStatus } from "@/types/api";

const stageLabels: Record<AnalysisStage, string> = {
  ready: "Ready to start",
  preparing_observation: "Preparing observation",
  analyzing_lightcurve: "Analyzing light curve",
  classifying_candidate: "Classifying candidate",
  preparing_results: "Preparing results",
  completed: "Analysis complete",
  failed: "Analysis failed",
};

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
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    async function synchronize() {
      try {
        const current = await api.analysisStatus(id, { signal: controller.signal });
        if (!active) return;
        setWorkflow(current);
        setError(null);
        setLoading(false);
        if (current.status === "completed") {
          const result = await api.getAnalysisResult(id, { signal: controller.signal });
          if (active) setAnalysis(result);
          return;
        }
        if (current.status === "processing") {
          timer = setTimeout(synchronize, 1_500);
        }
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        setError(caught instanceof ApiError ? caught.message : "Analysis status could not be retrieved.");
        setLoading(false);
      }
    }

    void synchronize();
    return () => {
      active = false;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  async function requestStart(retry: boolean) {
    setRetrying(true);
    setError(null);
    try {
      const accepted = retry ? await api.retryAnalysis(id) : await api.startAnalysis(id);
      setWorkflow((current) => current ? { ...current, status: accepted.status, stage: accepted.stage, message: accepted.message, retryable: accepted.retryable, error: null } : current);
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Analysis could not be started.");
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="app-workspace flex min-h-[70vh] flex-col items-center justify-center">
        <div className="mission-panel w-full max-w-lg p-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.06]"><LoaderCircle className="h-6 w-6 animate-spin text-cyan-300" /></span><p className="workspace-kicker mt-6 justify-center">Synchronizing evidence</p><h1 className="mt-3 text-xl font-semibold text-white">Loading analysis results</h1><p className="mt-2 text-sm text-slate-500">Retrieving photometry, candidate metrics, and model explanations.</p><div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-300" /></div></div>
      </div>
    );
  }

  if (error || workflow?.status === "failed" || workflow?.status === "uploaded") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-6">
        <div className={`rounded-2xl border p-8 ${workflow?.status === "uploaded" ? "border-cyan-300/20 bg-cyan-300/[0.05]" : "border-rose-300/20 bg-rose-300/[0.05]"}`}>
          <h2 className="mb-2 text-xl font-semibold text-white">{workflow?.status === "uploaded" ? "Observation ready" : "Analysis interrupted"}</h2>
          <p className="mb-6 text-sm text-slate-400">{error || workflow?.error || workflow?.message || "The requested analysis could not be found."}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {workflow?.status === "uploaded" && <Button disabled={retrying} onClick={() => void requestStart(false)}><RotateCcw className="h-4 w-4" /> Start analysis</Button>}
            {workflow?.status === "failed" && workflow.retryable && <Button disabled={retrying} onClick={() => void requestStart(true)}><RotateCcw className="h-4 w-4" /> Retry analysis</Button>}
            <Button href="/dashboard" variant="secondary" size="md"><ArrowLeft className="h-4 w-4" /> Return to dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (workflow?.status === "processing") {
    return (
      <main className="app-workspace flex min-h-[72vh] items-center justify-center" aria-live="polite">
        <section className="mission-panel data-grid w-full max-w-2xl p-7 sm:p-10" role="status">
          <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07]"><LoaderCircle className="h-5 w-5 animate-spin text-cyan-200" /></span><div><p className="workspace-kicker">Analysis in progress</p><h1 className="mt-2 text-2xl font-semibold text-white">{stageLabels[workflow.stage]}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{workflow.message}</p></div></div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2">{(["preparing_observation", "analyzing_lightcurve", "classifying_candidate", "preparing_results"] as AnalysisStage[]).map((stage) => { const stages = ["preparing_observation", "analyzing_lightcurve", "classifying_candidate", "preparing_results"]; const current = stages.indexOf(workflow.stage); const index = stages.indexOf(stage); return <li className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${index < current ? "border-emerald-300/15 text-emerald-200" : index === current ? "border-cyan-300/25 bg-cyan-300/[0.06] text-white" : "border-white/[0.06] text-slate-600"}`} key={stage}>{index < current ? <CheckCircle2 className="h-4 w-4" /> : index === current ? <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" /> : <span className="h-2 w-2 rounded-full bg-slate-700" />}{stageLabels[stage]}</li>; })}</ol>
          <p className="mt-7 text-xs leading-5 text-slate-600">This page reads persisted backend state. You can refresh or return later without starting a duplicate analysis.</p>
        </section>
      </main>
    );
  }

  if (!analysis) return null;

  return <ResultsDashboard analysis={analysis} />;
}
