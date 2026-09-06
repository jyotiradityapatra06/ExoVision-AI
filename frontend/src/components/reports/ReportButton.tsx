"use client";

import { AlertCircle, Download, FileText, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { api, ApiError } from "@/lib/api";

export function ReportButton({ analysisId }: { analysisId: string }) {
  const [status, setStatus] = useState<"idle" | "generating" | "generated" | "downloading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setStatus("generating");
    setError(null);
    try {
      await api.generateReport(analysisId);
      setStatus("generated");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof ApiError ? caught.message : "The scientific report could not be generated.");
    }
  }

  async function handleDownload() {
    setStatus("downloading");
    setError(null);
    try {
      const blob = await api.downloadReport(analysisId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `exovision_${analysisId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("generated");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof ApiError ? caught.message : "The scientific report could not be downloaded.");
    }
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-2">
      {status === "idle" && (
        <button
          className="dashboard-primary-action min-h-[42px] px-4 shadow-[0_0_24px_rgba(128,215,229,.12)]"
          onClick={handleGenerate}
          type="button"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>Generate Scientific Report (PDF)</span>
        </button>
      )}

      {status === "generating" && (
        <button
          className="dashboard-primary-action min-h-[42px] px-4 opacity-80 cursor-wait"
          disabled
          type="button"
        >
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Compiling Scientific Report…</span>
        </button>
      )}

      {status === "generated" && (
        <button
          className="inline-flex min-h-[42px] items-center gap-2 border border-emerald-400/40 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 transition"
          onClick={handleDownload}
          type="button"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Download Report (PDF)</span>
        </button>
      )}

      {status === "downloading" && (
        <button
          className="inline-flex min-h-[42px] items-center gap-2 border border-emerald-400/40 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-300 opacity-80 cursor-wait"
          disabled
          type="button"
        >
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Downloading PDF…</span>
        </button>
      )}

      {status === "error" && (
        <div className="flex flex-col sm:items-end gap-1.5">
          <button
            className="dashboard-secondary-action min-h-[42px] px-4 border-rose-400/30 text-rose-300 hover:border-rose-400/50"
            onClick={handleGenerate}
            type="button"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>Retry Report Generation</span>
          </button>
          {error && (
            <p className="text-[11px] text-rose-400 font-mono text-left sm:text-right max-w-xs" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
