"use client";

import { AlertCircle, ArrowLeft, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { FoldedCurveChart } from "@/components/charts/FoldedCurveChart";
import { LightCurveChart } from "@/components/charts/LightCurveChart";
import { PageHeader } from "@/components/page-header";
import { ReportButton } from "@/components/reports/ReportButton";
import { AnalysisSummary } from "@/components/results/AnalysisSummary";
import { CandidateCard } from "@/components/results/CandidateCard";
import { ExplanationPanel } from "@/components/results/ExplanationPanel";
import { api, ApiError } from "@/lib/api";
import type { AnalysisResult } from "@/types/api";

export function ResultsDashboard({ analysisId }: { analysisId: string }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api.getAnalysisResult(analysisId).then(setResult).catch((caught) => {
      if (!controller.signal.aborted) setError(caught instanceof ApiError ? caught.message : "The analysis result could not be loaded.");
    });
    return () => controller.abort();
  }, [analysisId]);

  if (error) return <div className="mx-auto max-w-4xl px-6 py-20"><Card className="p-10 text-center"><AlertCircle className="mx-auto h-8 w-8 text-rose-300" /><h1 className="mt-5 text-xl font-semibold text-white">Result unavailable</h1><p className="mt-3 text-slate-400">{error}</p><Button className="mt-7" href="/dashboard" variant="secondary"><ArrowLeft className="h-4 w-4" />Dashboard</Button></Card></div>;
  if (!result) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><LoaderCircle className="mx-auto h-7 w-7 animate-spin text-sky-300" /><p className="mt-4 text-sm text-slate-400">Loading scientific result…</p></div></div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <PageHeader eyebrow={`Analysis ${analysisId}`} title="Transit analysis result" description="Review the detected signal, folded transit, ranked candidates, and explainable AI assessment." action={<div className="flex flex-wrap gap-3"><Button href="/dashboard" variant="secondary"><ArrowLeft className="h-4 w-4" />Dashboard</Button><ReportButton analysisId={analysisId} /></div>} />
      <div className="mt-8"><AnalysisSummary result={result} /></div>
      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card className="p-6"><div className="mb-5"><h2 className="font-semibold text-white">Raw light curve</h2><p className="mt-1 text-sm text-slate-500">Observed stellar flux over time · scroll to zoom</p></div><LightCurveChart flux={result.lightcurve.flux} time={result.lightcurve.time} /></Card>
        <Card className="p-6"><div className="mb-5"><h2 className="font-semibold text-white">Phase-folded transit</h2><p className="mt-1 text-sm text-slate-500">Signal aligned to the detected orbital period</p></div><FoldedCurveChart flux={result.transit.flux} phase={result.transit.phase} /></Card>
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-[380px_1fr]">
        <div><div className="mb-4"><p className="section-label">Candidate ranking</p><h2 className="mt-2 text-xl font-semibold text-white">Detected candidates</h2></div><div className="space-y-4">{result.candidates.length ? result.candidates.map((candidate) => <CandidateCard candidate={candidate} key={candidate.candidate_id} />) : <Card className="p-6 text-sm text-slate-500">No transit candidates were detected.</Card>}</div></div>
        <div className="xl:pt-14"><ExplanationPanel candidate={result.candidates[0]} /></div>
      </section>
    </div>
  );
}
