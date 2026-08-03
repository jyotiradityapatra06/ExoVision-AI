"use client";

import { FileArchive, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { Button } from "@/components/button";
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
  const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");

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

  async function submit() {
    if (!file || stage !== "idle") return;
    setError(null);
    try {
      setStage("uploading");
      const upload = await api.uploadLightcurve(file);
      setStage("analyzing");
      await api.startAnalysis(upload.analysis_id);
      router.push(`/results/${upload.analysis_id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Analysis could not be started.");
      setStage("idle");
    }
  }

  const busy = stage !== "idle";
  return (
    <div>
      <div
        className={`rounded-2xl border border-dashed px-6 py-14 text-center transition ${isDragging ? "border-sky-300 bg-sky-300/10" : "border-sky-300/25 bg-sky-300/[0.035]"}`}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input ref={inputRef} accept=".csv,.fits,.txt" className="sr-only" disabled={busy} id="lightcurve-file" onChange={handleInput} type="file" />
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-300">
          <UploadCloud className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-xl font-semibold text-white">Drop a light-curve file here</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">CSV, FITS, or TXT · maximum 25 MB</p>
        <Button className="mt-7" disabled={busy} onClick={() => inputRef.current?.click()} variant="secondary">
          <FileArchive className="h-4 w-4" aria-hidden="true" />
          Choose a file
        </Button>
      </div>

      {file && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-slate-900/60 p-4">
          <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{file.name}</p><p className="mt-1 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p></div>
          <button aria-label="Remove selected file" className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white" disabled={busy} onClick={() => setFile(null)} type="button"><X className="h-4 w-4" /></button>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">{error}</p>}

      <Button className="mt-5 w-full" disabled={!file || busy} onClick={submit} size="lg">
        {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {stage === "uploading" ? "Uploading light curve…" : stage === "analyzing" ? "Running analysis…" : "Upload and analyze"}
      </Button>
    </div>
  );
}
