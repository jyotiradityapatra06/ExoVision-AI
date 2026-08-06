"use client";

import {
  Activity,
  Aperture,
  Database,
  FileArchive,
  FileText,
  LoaderCircle,
  Orbit,
  RadioTower,
  Satellite,
  Sparkles,
  Telescope,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { Button } from "@/components/button";
import { PipelineStage, PipelineVisualization } from "@/components/PipelineVisualization";
import { api, ApiError } from "@/lib/api";

const SUPPORTED_EXTENSIONS = [".csv", ".fits", ".txt"];

const missions = [
  { name: "Kepler", code: "KPLR", description: "Long-baseline photometry from NASA’s pioneering exoplanet survey.", availability: "FITS archive + demo", icon: Aperture, accent: "text-cyan-200", action: "demo" },
  { name: "TESS", code: "TESS", description: "All-sky sector observations focused on bright, nearby stellar targets.", availability: "FITS / CSV import", icon: Satellite, accent: "text-violet-200", action: "browse" },
  { name: "K2", code: "K2", description: "Precision ecliptic-plane observations from Kepler’s extended mission.", availability: "FITS / CSV import", icon: Orbit, accent: "text-amber-200", action: "browse" },
] as const;

function validateFile(file: File): string | null {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!SUPPORTED_EXTENSIONS.includes(extension)) return "Choose a CSV, FITS, or TXT light-curve file.";
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > 25 * 1024 * 1024) return "The selected file exceeds 25 MB.";
  return null;
}

function missionFromFilename(filename?: string) {
  if (!filename) return "Awaiting target";
  const normalized = filename.toLowerCase();
  if (normalized.includes("tess") || normalized.includes("tic")) return "TESS";
  if (normalized.includes("k2")) return "K2";
  if (normalized.includes("kepler") || normalized.includes("kic")) return "Kepler";
  return "User observation";
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

  function handleInput(event: ChangeEvent<HTMLInputElement>) { selectFile(event.target.files?.[0]); }
  function handleDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files[0]); }

  async function loadDemoLightCurve() {
    setError(null);
    setPipelineStage("uploading");
    try { selectFile(await api.downloadDemoDataset()); }
    catch (caught) { setError(caught instanceof ApiError ? caught.message : "The demo dataset could not be loaded."); }
    finally { setPipelineStage("idle"); }
  }

  async function submit() {
    if (!file || pipelineStage !== "idle") return;
    setError(null);
    try {
      setPipelineStage("uploading");
      const upload = await api.uploadLightcurve(file);
      setPipelineStage("detecting");
      await api.startAnalysis(upload.analysis_id);
      setPipelineStage("finalizing");
      router.push(`/results/${upload.analysis_id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Analysis could not be started.");
      setPipelineStage("idle");
    }
  }

  const busy = pipelineStage !== "idle";
  const telemetry = [
    { label: "Target name", value: file?.name ?? "No target selected" },
    { label: "Mission", value: missionFromFilename(file?.name) },
    { label: "Observation period", value: file ? "Resolved by BLS" : "—" },
    { label: "Data availability", value: file ? `${(file.size / 1024).toFixed(1)} KB ready` : "Awaiting telemetry" },
    { label: "Signal status", value: busy ? "Scanning signal" : file ? "Ready for analysis" : "Standby" },
  ];

  return (
    <div className="w-full space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.65fr)]">
        <div className="space-y-6">
          <article className="mission-panel">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6"><div><p className="telemetry-label">Telescope control panel</p><h2 className="mt-1 font-semibold text-white">Observation telemetry</h2></div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.8)]" /> Array online</div></div>
            <dl className="grid sm:grid-cols-2 lg:grid-cols-5">
              {telemetry.map((item, index) => <div className={`min-w-0 p-5 ${index < telemetry.length - 1 ? "border-b border-white/[0.06] sm:border-b-0 sm:border-r" : ""}`} key={item.label}><dt className="telemetry-label">{item.label}</dt><dd className={`mt-2 truncate text-sm font-medium ${item.label === "Signal status" && file ? "text-cyan-200" : "text-slate-200"}`}>{item.value}</dd></div>)}
            </dl>
          </article>

          <article
            className={`mission-panel data-grid group relative flex min-h-[430px] flex-col items-center justify-center overflow-hidden p-6 text-center transition duration-500 ${isDragging ? "border-cyan-200/50 bg-cyan-300/[0.06] shadow-[0_0_50px_rgba(103,232,249,.12)]" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}
          >
            <input ref={inputRef} accept=".csv,.fits,.txt" className="sr-only" disabled={busy} id="lightcurve-file" onChange={handleInput} type="file" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-5 border border-cyan-300/[0.08]"><span className="absolute -left-px -top-px h-5 w-5 border-l border-t border-cyan-200/60" /><span className="absolute -right-px -top-px h-5 w-5 border-r border-t border-cyan-200/60" /><span className="absolute -bottom-px -left-px h-5 w-5 border-b border-l border-cyan-200/60" /><span className="absolute -bottom-px -right-px h-5 w-5 border-b border-r border-cyan-200/60" /></div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0"><span className="absolute left-[12%] top-[18%] h-1 w-1 rounded-full bg-white/60 shadow-[120px_70px_0_rgba(103,232,249,.5),310px_-20px_0_rgba(255,255,255,.3),480px_120px_0_rgba(103,232,249,.35),670px_10px_0_rgba(255,255,255,.3),800px_180px_0_rgba(103,232,249,.3)]" /><span className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/[0.07]" /><span className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-300/[0.09]" /><span className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-cyan-300/[0.05]" /><span className="absolute left-1/2 top-1/2 h-full w-px -translate-y-1/2 bg-cyan-300/[0.05]" /></div>
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/25 bg-[#06101d]/90 shadow-[0_0_35px_rgba(103,232,249,.14)]"><Telescope className="h-9 w-9 text-cyan-200" /></div>
            <p className="workspace-kicker relative z-10 mt-7 justify-center">Observation visualization</p>
            <h3 className="relative z-10 mt-3 text-xl font-semibold text-white">{file ? "Target acquisition complete" : "Acquire a stellar target"}</h3>
            <p className="relative z-10 mt-2 max-w-md text-sm leading-6 text-slate-500">{file ? `${file.name} is locked and ready for the transit-detection sequence.` : "Drop a FITS, CSV, or TXT light curve into the telescope frame, or select an observation source below."}</p>
            <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-3"><Button disabled={busy} onClick={() => inputRef.current?.click()}><FileArchive className="h-4 w-4" /> Browse observations</Button><Button disabled={busy} onClick={loadDemoLightCurve} variant="secondary"><Sparkles className="h-4 w-4" /> Load Kepler demo</Button></div>
            <div className="absolute bottom-4 left-5 right-5 flex justify-between font-mono text-[8px] uppercase tracking-[0.18em] text-slate-700"><span>RA 00h 00m 00s</span><span>Optical link / standby</span><span>DEC +00° 00′</span></div>
          </article>

          {file && <div className="mission-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06]"><FileText className="h-4 w-4 text-cyan-200" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{file.name}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-600">{(file.size / 1024).toFixed(1)} KB · Ready for BLS pipeline</p></div></div><button aria-label="Remove selected file" className="rounded-lg border border-white/[0.07] p-2 text-slate-500 transition hover:border-rose-300/20 hover:text-rose-300" disabled={busy} onClick={() => setFile(null)} type="button"><X className="h-4 w-4" /></button></div>}
          {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-4 py-3 font-mono text-xs text-rose-200" role="alert">{error}</p>}
          <Button className="w-full py-3 text-xs font-bold shadow-[0_0_30px_rgba(103,232,249,.14)]" disabled={!file || busy} onClick={submit} size="lg">{busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}{pipelineStage === "uploading" ? "1/5 Uploading Dataset..." : pipelineStage === "preprocessing" ? "2/5 Preprocessing Light Curve..." : pipelineStage === "detecting" ? "3/5 Detecting Transit Signal..." : pipelineStage === "classifying" ? "4/5 Classifying AI Model..." : pipelineStage === "finalizing" ? "5/5 Finalizing Results..." : "Initialize Analysis Sequence"}</Button>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start"><PipelineVisualization currentStage={pipelineStage} /></div>
      </section>

      <section aria-labelledby="mission-catalog" className="pt-2">
        <div className="mb-4 flex items-end justify-between"><div><p className="telemetry-label">Mission catalog</p><h2 className="mt-1 text-lg font-semibold text-white" id="mission-catalog">Observation sources</h2></div><span className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-slate-600 sm:flex"><RadioTower className="h-3.5 w-3.5" /> Three mission profiles</span></div>
        <div className="grid gap-4 md:grid-cols-3">{missions.map((mission) => <article className="telemetry-card group flex min-h-56 flex-col" key={mission.name}><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20"><mission.icon className={`h-5 w-5 ${mission.accent}`} /></span><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">{mission.code}</span></div><h3 className="mt-5 text-lg font-semibold text-white">{mission.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{mission.description}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4"><span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-slate-600"><Database className="h-3.5 w-3.5" /> {mission.availability}</span><button className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 transition hover:text-white disabled:opacity-50" disabled={busy} onClick={mission.action === "demo" ? loadDemoLightCurve : () => inputRef.current?.click()} type="button">Analyze <Activity className="h-3.5 w-3.5" /></button></div></article>)}</div>
      </section>
    </div>
  );
}
