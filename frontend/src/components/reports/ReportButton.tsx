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

  if (status === "generated") {
    return (
      <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" download href={api.reportDownloadUrl(analysisId)}>
        <Download className="h-4 w-4" aria-hidden="true" />
        Download report
      </a>
    );
  }

  return (
    <div className="relative">
      <Button disabled={status === "generating"} onClick={generate}>
        {status === "generating" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : status === "error" ? <FileText className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
        {status === "generating" ? "Generating PDF…" : status === "error" ? "Retry report" : "Generate report"}
      </Button>
      {error && <p className="absolute right-0 top-12 w-64 rounded-lg border border-rose-400/20 bg-slate-950 p-3 text-xs leading-5 text-rose-200 shadow-xl" role="alert">{error}</p>}
    </div>
  );
}
