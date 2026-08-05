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
        <p className="font-mono text-xs text-outline tracking-wider uppercase">Loading Candidate Report {id}...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-6">
        <div className="hud-border p-8 rounded-xl bg-surface-container/60">
          <h2 className="text-xl font-bold text-rose-400 font-mono mb-2">TELEMETRY FETCH ERROR</h2>
          <p className="text-sm text-outline font-mono mb-6">{error || "Observation dataset record not found."}</p>
          <Button href="/dashboard" variant="secondary" size="md">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Return to Mission Dashboard</span>
          </Button>
        </div>
      </div>
    );
  }

  return <ResultsDashboard analysis={analysis} />;
}
