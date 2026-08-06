"use client";

import { CheckCircle2, Download, FileText, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/button";
import { api, ApiError } from "@/lib/api";

export function ReportButton({ analysisId }: { analysisId: string }) {
  const [status, setStatus] = useState<"idle" | "generating" | "generated" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setStatus("generating");
    setError(null);
    try {
      await api.generateReport(analysisId);
      setStatus("generated");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof ApiError ? caught.message : "The report could not be generated.");
    }
  }

  async function download() {
    try {
      const blob = await api.downloadReport(analysisId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${analysisId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof ApiError ? caught.message : "The report could not be downloaded.");
    }
  }

  if (status === "generated") {
    return (
      <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(110,231,183,.15)] transition hover:-translate-y-0.5 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" onClick={download} type="button">
        <Download className="h-4 w-4" aria-hidden="true" />
        Download report
      </button>
    );
  }

  return (
    <div className="relative">
      <Button className="min-h-12 px-6 shadow-[0_0_30px_rgba(103,232,249,.18)]" disabled={status === "generating"} onClick={generate} size="lg">
        {status === "generating" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : status === "error" ? <FileText className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
        {status === "generating" ? "Generating Scientific Report…" : status === "error" ? "Retry Scientific Report" : "Generate Scientific Report"}
      </Button>
      {error && <p className="absolute right-0 top-12 w-64 rounded-lg border border-rose-400/20 bg-slate-950 p-3 text-xs leading-5 text-rose-200 shadow-xl" role="alert">{error}</p>}
    </div>
  );
}
