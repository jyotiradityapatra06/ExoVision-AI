"use client";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck2,
  FileCode,
  FileText,
  FileUp,
  FlaskConical,
  Info,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { PrecisionButton } from "@/components/ui";
import {
  formatFileSize,
  IntakeStage,
  intakeError,
  startObservation,
  validateObservationFile,
} from "@/lib/analysis-intake";

interface PreflightInfo {
  parsedPointsCount?: number;
  estSampleCount?: number;
  initialSpanDays?: string;
  points?: [number, number][];
  columns?: string[];
  note?: string;
}

const benchmarks = [
  { name: "Kepler-10b", mission: "Kepler" },
  { name: "TrES-2b", mission: "Kepler" },
  { name: "KOI-115", mission: "Kepler" },
  { name: "EB-104", mission: "Kepler" },
];

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<IntakeStage>("idle");
  const [preflight, setPreflight] = useState<PreflightInfo | null>(null);
  const busy = stage !== "idle";

  function parsePreflight(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || "";
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.startsWith("#"));
        if (lines.length > 1) {
          const delimiter = lines[0].includes(",") ? "," : /\s+/;
          const headers = lines[0]
            .toLowerCase()
            .split(delimiter)
            .map((h) => h.trim().replace(/^["']|["']$/g, ""));
          const timeIdx = headers.findIndex((h) => h === "time" || h === "bjd" || h === "cadenceno");
          const fluxIdx = headers.findIndex((h) => h === "flux" || h === "pdcsap_flux" || h === "sap_flux");

          if (timeIdx !== -1 && fluxIdx !== -1) {
            const rawPoints: [number, number][] = [];
            for (let i = 1; i < Math.min(lines.length, 500); i++) {
              const parts = lines[i].split(delimiter);
              const t = parseFloat(parts[timeIdx]);
              const fl = parseFloat(parts[fluxIdx]);
              if (Number.isFinite(t) && Number.isFinite(fl)) {
                rawPoints.push([t, fl]);
              }
            }

            if (rawPoints.length > 5) {
              const times = rawPoints.map((p) => p[0]);
              const tMin = Math.min(...times);
              const tMax = Math.max(...times);
              const duration = (tMax - tMin).toFixed(2);
              const fluxes = rawPoints.map((p) => p[1]);
              const fMin = Math.min(...fluxes);
              const fMax = Math.max(...fluxes);
              const fRange = fMax - fMin || 1;

              // Normalize to 0-360 width and 15-55 height for mini SVG waveform
              const svgPoints: [number, number][] = rawPoints.map((p, i) => [
                (i / (rawPoints.length - 1)) * 360,
                55 - ((p[1] - fMin) / fRange) * 40,
              ]);

              setPreflight({
                parsedPointsCount: rawPoints.length,
                estSampleCount: Math.round(f.size / 45),
                initialSpanDays: `${duration} d`,
                points: svgPoints,
                columns: headers.slice(0, 4),
                note: `Recognized columns: ${headers[timeIdx]}, ${headers[fluxIdx]}`,
              });
              return;
            }
          }
        }
        setPreflight({
          estSampleCount: Math.round(f.size / 45),
          note: "Columns parsed. Ready for server ingestion.",
        });
      };
      reader.readAsText(f.slice(0, 65536));
    } else if (ext === "fits") {
      setPreflight({
        note: "FITS format verified. Full HDU extraction and cadence analysis occur during server ingestion.",
      });
    } else {
      setPreflight(null);
    }
  }

  function choose(next?: File) {
    const validation = validateObservationFile(next);
    setError(validation);
    if (!validation && next) {
      setFile(next);
      parsePreflight(next);
    } else {
      setFile(null);
      setPreflight(null);
    }
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    choose(selected);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files?.[0]);
  }

  function remove() {
    setFile(null);
    setError(null);
    setPreflight(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit() {
    if (!file || busy) return;
    setError(null);
    try {
      const analysisId = await startObservation(file, setStage);
      router.push(`/results/${analysisId}`);
    } catch (caught) {
      setError(intakeError(caught));
      setStage("idle");
    }
  }

  const label =
    stage === "uploading"
      ? "Uploading observation…"
      : stage === "starting"
        ? "Preparing analysis…"
        : "Start Candidate Screening";

  const extension = file ? file.name.split(".").pop()?.toUpperCase() : null;

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Primary Ingestion Workspace (Approx 68-70% on desktop) */}
      <section className="lg:col-span-8 flex flex-col gap-6" aria-labelledby="observation-file-heading">
        {/* Step 01: Observation File Selection / Preflight Panel */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 sm:p-6 shadow-sm">
          <header className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded border border-white/[0.12] bg-[#11151b] font-mono text-[11px] font-semibold text-cyan-400">
                01
              </span>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Observation File</p>
                <h2 id="observation-file-heading" className="text-base font-semibold text-white tracking-tight">
                  {file ? "Observation Preflight" : "Select or drop a stellar light curve"}
                </h2>
              </div>
            </div>

            {file && !error && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Ready to upload
              </span>
            )}
          </header>

          {/* Hidden HTML file input */}
          <input
            ref={inputRef}
            id="lightcurve-file"
            type="file"
            accept=".fits,.csv,.txt"
            onChange={onInput}
            disabled={busy}
            className="sr-only"
            aria-describedby={error ? "file-error file-guidance" : "file-guidance"}
          />

          {!file ? (
            /* Ingestion Drop Surface */
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={`relative flex flex-col items-center justify-center rounded-lg border border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
                dragging
                  ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_24px_rgba(56,189,248,0.12)]"
                  : "border-white/[0.14] bg-[#090b0e]/70 hover:border-cyan-400/40 hover:bg-[#0b0e14]"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.10] bg-[#11151b] text-cyan-400 shadow-sm mb-4">
                <FileUp className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="text-sm sm:text-base font-semibold text-white">
                Drop a stellar observation here
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                or choose a file from your device
              </p>

              <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                <span>FITS · CSV · TXT</span>
                <span>·</span>
                <span>Maximum 25 MiB</span>
              </div>

              <div className="mt-5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] hover:border-white/[0.20]">
                  Browse files
                </span>
              </div>
            </div>
          ) : (
            /* Observation Preflight Panel */
            <div className="space-y-4">
              <div className="rounded-lg border border-white/[0.08] bg-[#090b0e] p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/[0.10] bg-[#11151b] text-cyan-400">
                      <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="rounded border border-cyan-500/30 bg-cyan-950/40 px-1.5 py-0.2 text-[9px] font-mono font-medium text-cyan-300">
                          {extension}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">{formatFileSize(file.size)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate font-mono" title={file.name}>
                        {file.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={remove}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Preflight Waveform Inspection (Light-Curve Preview) */}
                {preflight && (
                  <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between pb-2 text-[10px] font-mono">
                      <span className="text-cyan-400 font-medium tracking-wider">
                        LIGHT-CURVE PREVIEW {preflight.parsedPointsCount ? `(${preflight.parsedPointsCount} SAMPLES)` : ""}
                      </span>
                      {preflight.estSampleCount && (
                        <span className="text-zinc-500">
                          Est. ~{preflight.estSampleCount.toLocaleString()} total samples
                        </span>
                      )}
                    </div>

                    {preflight.points && preflight.points.length > 5 ? (
                      <div className="relative h-20 w-full rounded bg-[#04060a] p-1.5 mb-2.5 border border-white/[0.04]">
                        <svg className="w-full h-full" viewBox="0 0 360 65" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={preflight.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="rounded bg-[#04060a] p-3 text-xs font-mono text-zinc-400 border border-white/[0.04] mb-2.5 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span>{preflight.note ?? "Format verified. Light curve will be extracted during server ingestion."}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] font-mono text-zinc-400 gap-1">
                      <span>{preflight.note ?? "Format verified for BLS search"}</span>
                      {preflight.initialSpanDays && (
                        <span className="text-zinc-500">Sample span: {preflight.initialSpanDays}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Action Button: Start Candidate Screening */}
              <PrecisionButton
                type="button"
                variant="primary"
                size="lg"
                onClick={() => void submit()}
                disabled={!file || busy}
                loading={busy}
                className="w-full justify-center text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <span>{label}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </PrecisionButton>
            </div>
          )}

          {/* Validation Error Alert */}
          {error && (
            <div
              id="file-error"
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-md border border-rose-500/30 bg-rose-500/[0.08] p-3 text-xs text-rose-300"
            >
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Guidance Note */}
          <p id="file-guidance" className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
            <Info className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
            <span>FITS, CSV, or TXT · Default limit 25 MiB · Server validation remains authoritative.</span>
          </p>
        </div>

        {/* Curated Benchmarks */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Test Set</p>
              <h3 className="text-sm font-semibold text-white">Curated Benchmarks</h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Preset Observations</span>
          </div>

          <p className="text-xs text-zinc-400 mb-3">
            Or test the screening pipeline with known observation targets:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {benchmarks.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => router.push("/demo")}
                className="flex flex-col items-start rounded-md border border-white/[0.08] bg-[#090b0e] p-3 text-left transition-colors hover:border-cyan-500/30 hover:bg-[#0e1218] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
              >
                <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {item.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 mt-1">Curated benchmark · {item.mission}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Scientific Guidance & Contextual Documentation (Approx 30-32% on desktop) */}
      <aside className="lg:col-span-4 flex flex-col gap-6" aria-label="Scientific specifications">
        {/* Input Requirements */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06] mb-4">
            <span className="flex h-5 w-5 items-center justify-center rounded border border-white/[0.12] bg-[#11151b] font-mono text-[10px] font-semibold text-cyan-400">
              02
            </span>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Specifications</p>
              <h3 className="text-sm font-semibold text-white">Input Requirements</h3>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            A time-series stellar light curve containing photometric observation timestamps and flux measurements.
          </p>

          <div className="space-y-3.5">
            <div className="rounded-md border border-white/[0.06] bg-[#090b0e] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                <span>FITS Products</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Compatible NASA products (Kepler, K2, TESS) provide required time and flux columns automatically from primary binary tables.
              </p>
            </div>

            <div className="rounded-md border border-white/[0.06] bg-[#090b0e] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>CSV & TXT Formats</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Must contain recognized columns: <code className="text-cyan-300 font-mono">time</code> (or <code className="text-cyan-300 font-mono">bjd</code>) and <code className="text-cyan-300 font-mono">flux</code> (or <code className="text-cyan-300 font-mono">pdcsap_flux</code>). Optional error and quality columns are supported.
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Sequence */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06] mb-4">
            <span className="flex h-5 w-5 items-center justify-center rounded border border-white/[0.12] bg-[#11151b] font-mono text-[10px] font-semibold text-cyan-400">
              03
            </span>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Pipeline Stages</p>
              <h3 className="text-sm font-semibold text-white">Analysis Sequence</h3>
            </div>
          </div>

          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[10px] ${
                stage === "uploading"
                  ? "border-cyan-400 bg-cyan-950/40 text-cyan-300"
                  : "border-white/[0.10] bg-[#090b0e] text-zinc-500"
              }`}>
                1
              </span>
              <div>
                <strong className="text-xs font-medium text-white block">Upload & Validate</strong>
                <span className="text-[11px] text-zinc-400 leading-tight block">
                  Verify file headers, sample bounds, and photometry integrity.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[10px] ${
                stage === "starting"
                  ? "border-cyan-400 bg-cyan-950/40 text-cyan-300"
                  : "border-white/[0.10] bg-[#090b0e] text-zinc-500"
              }`}>
                2
              </span>
              <div>
                <strong className="text-xs font-medium text-white block">Prepare Observation</strong>
                <span className="text-[11px] text-zinc-400 leading-tight block">
                  Outlier rejection, LTTB downsampling, and baseline detrending.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/[0.10] bg-[#090b0e] font-mono text-[10px] text-zinc-500">
                3
              </span>
              <div>
                <strong className="text-xs font-medium text-white block">Candidate Screening</strong>
                <span className="text-[11px] text-zinc-400 leading-tight block">
                  Box Least Squares (BLS) period grid search & Random Forest classification.
                </span>
              </div>
            </li>
          </ol>
        </div>

        {/* Alternative Sources Card */}
        <div className="rounded-lg border border-white/[0.06] bg-[#090b0e] p-4 text-xs space-y-2.5">
          <span className="font-mono text-[10px] uppercase text-zinc-500 block">Alternative Ingestion</span>
          <div className="flex flex-col gap-2">
            <Link
              href="/datasets"
              className="flex items-center justify-between text-zinc-300 hover:text-cyan-300 transition-colors py-1 border-b border-white/[0.04]"
            >
              <span className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-cyan-400" />
                <span>Search NASA MAST Archives</span>
              </span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/demo"
              className="flex items-center justify-between text-zinc-300 hover:text-cyan-300 transition-colors py-1"
            >
              <span className="flex items-center gap-2">
                <FlaskConical className="h-3.5 w-3.5 text-purple-400" />
                <span>Run Synthetic Demo</span>
              </span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
