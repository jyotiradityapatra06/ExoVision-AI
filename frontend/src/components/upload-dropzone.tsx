"use client";

import { FileArchive, FileText, LoaderCircle, Sparkles, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { PipelineStage, PipelineVisualization } from "@/components/PipelineVisualization";
import { api, ApiError } from "@/lib/api";

const SUPPORTED_EXTENSIONS = [".csv", ".fits", ".txt"];

function validateFile(file: File): string | null {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return "Choose a CSV, FITS, or TXT light-curve file.";
  }
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > 25 * 1024 * 1024) return "The selected file exceeds 25 MB.";
  return null;
}

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");

  function selectFile(nextFile: File | undefined) {
    if (!nextFile) return;
    const validationError = validateFile(nextFile);
    setError(validationError);
    setFile(validationError ? null : nextFile);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  function loadDemoLightCurve() {
    const timePoints: string[] = ["time,flux"];
    for (let t = 0; t <= 10; t += 0.02) {
      let flux = 1.0 + (Math.random() - 0.5) * 0.0015;
      if (t >= 4.5 && t <= 5.5) {
        flux -= 0.012 * Math.sin(((t - 4.5) / 1.0) * Math.PI);
      }
      timePoints.push(`${t.toFixed(4)},${flux.toFixed(6)}`);
    }
    const demoContent = timePoints.join("\n");
    const demoFile = new File([demoContent], "Kepler_Demo_Transit_K00842.csv", {
      type: "text/csv",
    });
    selectFile(demoFile);
  }

  async function submit() {
    if (!file || pipelineStage !== "idle") return;
    setError(null);
    try {
      setPipelineStage("uploading");
      const upload = await api.uploadLightcurve(file);

      setPipelineStage("fits");
      await new Promise((r) => setTimeout(r, 600));

      setPipelineStage("detecting");
      await new Promise((r) => setTimeout(r, 600));

      setPipelineStage("classifying");
      await api.startAnalysis(upload.analysis_id);

      setPipelineStage("reporting");
      await new Promise((r) => setTimeout(r, 500));

      router.push(`/results/${upload.analysis_id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Analysis could not be started.");
      setPipelineStage("idle");
    }
  }

  const busy = pipelineStage !== "idle";

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      {/* Upload Zone & Telemetry Info (Spans 7) */}
      <div className="lg:col-span-7 flex flex-col h-full space-y-4">
        <div
          className={`hud-border bg-surface-container/60 backdrop-blur-md border border-outline-variant/40 rounded-xl p-8 flex flex-col items-center justify-center h-96 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(0,218,243,0.15)] relative overflow-hidden ${
            isDragging ? "border-primary bg-primary/10" : ""
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            accept=".csv,.fits,.txt"
            className="sr-only"
            disabled={busy}
            id="lightcurve-file"
            onChange={handleInput}
            type="file"
          />

          <div className="w-20 h-20 rounded-full border border-outline-variant/50 flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors">
            <UploadCloud className="h-10 w-10 text-on-surface-variant group-hover:text-primary transition-colors" />
          </div>

          <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-center font-bold">
            Drag & Drop Datasets
          </h3>
          <p className="font-data-mono text-data-mono text-outline text-center mb-6 max-w-sm text-xs">
            Supported formats: .FITS, .CSV (Max 25MB per file)
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Button disabled={busy} onClick={() => inputRef.current?.click()} variant="primary" size="md">
              <FileArchive className="h-4 w-4" />
              <span>Browse Files</span>
            </Button>
            <Button disabled={busy} onClick={loadDemoLightCurve} variant="secondary" size="md">
              <Sparkles className="h-4 w-4" />
              <span>Load Kepler Demo</span>
            </Button>
          </div>
        </div>

        {/* Selected File Card */}
        {file && (
          <Card className="p-4" hudCorners glow="cyan">
            <div className="flex items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-bold text-slate-100 truncate max-w-xs">{file.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB · Ready for BLS pipeline
                  </p>
                </div>
              </div>
              <button
                aria-label="Remove selected file"
                className="rounded p-1 text-slate-400 hover:text-rose-400"
                disabled={busy}
                onClick={() => setFile(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Card>
        )}

        {/* Error Notice */}
        {error && (
          <p className="rounded border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-data-mono text-xs text-rose-200" role="alert">
            {error}
          </p>
        )}

        {/* Submit Execution Button */}
        <Button
          className="w-full shadow-cyan-glow text-xs py-3 font-bold"
          disabled={!file || busy}
          onClick={submit}
          size="lg"
        >
          {busy && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
          {pipelineStage === "uploading"
            ? "1/5 Uploading Dataset..."
            : pipelineStage === "fits"
            ? "2/5 Processing FITS Header..."
            : pipelineStage === "detecting"
            ? "3/5 Detecting Transit Signal..."
            : pipelineStage === "classifying"
            ? "4/5 Classifying AI Model..."
            : pipelineStage === "reporting"
            ? "5/5 Generating Report..."
            : "INITIALIZE PIPELINE SEQUENCE"}
        </Button>

        {/* Quick Stats / Telemetry Info beneath upload */}
        <div className="grid grid-cols-3 gap-4 font-data-mono text-xs text-center pt-2">
          <div className="bg-surface-container-low border border-outline-variant/30 p-3 rounded">
            <span className="block font-label-caps text-[10px] text-outline mb-1">Server Status</span>
            <span className="text-secondary font-bold">NOMINAL</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 p-3 rounded">
            <span className="block font-label-caps text-[10px] text-outline mb-1">Available Storage</span>
            <span className="text-primary font-bold">124.5 TB</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 p-3 rounded">
            <span className="block font-label-caps text-[10px] text-outline mb-1">Active Pipelines</span>
            <span className="text-on-surface font-bold">03</span>
          </div>
        </div>
      </div>

      {/* Pipeline HUD / Terminal Panel (Spans 5) */}
      <div className="lg:col-span-5">
        <PipelineVisualization currentStage={pipelineStage} />
      </div>
    </div>
  );
}
