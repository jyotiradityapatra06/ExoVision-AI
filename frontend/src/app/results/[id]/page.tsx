"use client";

import { ArrowLeft, LoaderCircle } from "lucide-react";
import { use, useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/button";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { api, ApiError } from "@/lib/api";
import type { AnalysisResult } from "@/types/api";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    api
      .getAnalysisResult(id)
      .then((data) => {
        if (isSubscribed) {
          setAnalysis(data);
          setLoading(false);
        }
      })
      .catch((caught) => {
        if (isSubscribed) {
          setError(caught instanceof ApiError ? caught.message : "Candidate report not found.");
          setLoading(false);
        }
      });
    return () => {
      isSubscribed = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-slate-400">Loading analysis results…</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-6">
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] p-8">
          <h2 className="mb-2 text-xl font-semibold text-white">Analysis results unavailable</h2>
          <p className="mb-6 text-sm text-slate-400">{error || "The requested analysis could not be found."}</p>
          <Button href="/dashboard" variant="secondary" size="md">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Return to dashboard</span>
          </Button>
        </div>
      </div>
    );
  }

  return <ResultsDashboard analysis={analysis} />;
}
