"use client";

import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleCheck,
  Database,
  FileText,
  FlaskConical,
  LoaderCircle,
  Orbit,
  Play,
  RadioTower,
  Sparkles,
  Telescope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/button";
import { api, ApiError } from "@/lib/api";

type Step = "ready" | "loading" | "uploading" | "analyzing" | "complete";

const workflow = [
  { title: "Stellar observation loaded", detail: "A calibrated FITS light curve enters the pipeline.", icon: Database, states: ["loading", "uploading", "analyzing", "complete"] },
  { title: "Transit signal detected", detail: "Box Least Squares searches for repeating flux dips.", icon: Activity, states: ["analyzing", "complete"] },
  { title: "AI classifier analyzes candidate", detail: "The model scores the signal and explains its evidence.", icon: BrainCircuit, states: ["analyzing", "complete"] },
  { title: "Scientific report generated", detail: "Charts, parameters, and evidence are assembled for review.", icon: FileText, states: ["complete"] },
] as const;

export default function DemoPage() {
  return <ProtectedRoute><DemoContent /></ProtectedRoute>;
}

function DemoContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("ready");
  const [error, setError] = useState<string | null>(null);

  async function runDemo() {
    setError(null);
    try {
      setStep("loading");
      const file = await api.downloadDemoDataset();
      setStep("uploading");
      const uploaded = await api.uploadLightcurve(file);
      setStep("analyzing");
      await api.startAnalysis(uploaded.analysis_id);
      setStep("complete");
      router.push(`/results/${uploaded.analysis_id}`);
    } catch (caught) {
      setStep("ready");
      setError(caught instanceof ApiError ? caught.message : "The demo analysis could not be completed.");
    }
  }

  const working = step !== "ready" && step !== "complete";
  const labels: Record<Step, string> = { ready: "Launch discovery simulation", loading: "Loading stellar observation…", uploading: "Preparing observation…", analyzing: "Detecting and classifying…", complete: "Opening discovery report…" };
  const progress: Record<Step, number> = { ready: 0, loading: 20, uploading: 38, analyzing: 78, complete: 100 };
  const stageOrder: Step[] = ["ready", "loading", "uploading", "analyzing", "complete"];
  const currentIndex = stageOrder.indexOf(step);

  return (
    <main className="app-workspace max-w-[1320px]">
      <section className="mission-panel data-grid relative overflow-hidden bg-gradient-to-br from-cyan-400/[0.09] via-slate-950/90 to-violet-400/[0.08] p-7 sm:p-10 lg:p-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full border border-cyan-300/[0.07]"><span className="absolute inset-16 rounded-full border border-dashed border-cyan-300/[0.08]" /><span className="absolute inset-36 rounded-full border border-cyan-300/[0.09]" /></div>
        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:items-center">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_28px_rgba(103,232,249,.1)]"><FlaskConical className="h-6 w-6 text-cyan-200" /></div>
            <p className="workspace-kicker mt-8">Interactive AI discovery demonstration</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">Launch an Exoplanet Discovery Simulation</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">Follow a real sample observation through transit detection, AI classification, explainable evidence, and a reproducible scientific result.</p>
            <div className="mt-7 flex flex-wrap gap-3">{["Calibrated FITS data", "Known transit signal", "Explainable AI output"].map((item) => <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-xs text-slate-300" key={item}><CircleCheck className="h-3.5 w-3.5 text-emerald-300" />{item}</span>)}</div>
            {error && <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-4 text-sm text-rose-200" role="alert"><p className="font-medium">Simulation interrupted</p><p className="mt-1 text-rose-200/70">{error}</p></div>}
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><Button onClick={runDemo} disabled={working} size="lg">{working ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}{labels[step]}</Button><span className="flex items-center gap-2 text-xs text-slate-500"><RadioTower className="h-4 w-4 text-cyan-300" /> Uses the production analysis pipeline</span></div>
          </div>

          <div className="relative mx-auto flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
            <div className={`absolute inset-0 rounded-full border border-dashed border-cyan-300/20 ${working ? "animate-spin [animation-duration:18s]" : ""}`} />
            <div className={`absolute inset-8 rounded-full border border-violet-300/15 ${working ? "animate-spin [animation-direction:reverse] [animation-duration:12s]" : ""}`} />
            <div className="absolute inset-16 rounded-full border border-cyan-300/10 bg-[#040a16]/80 shadow-[inset_0_0_40px_rgba(103,232,249,.05),0_0_50px_rgba(103,232,249,.06)]" />
            <div className="relative z-10 text-center"><Telescope className={`mx-auto h-10 w-10 text-cyan-200 ${working ? "animate-pulse" : ""}`} /><p className="mt-4 font-mono text-4xl font-semibold text-white">{progress[step]}%</p><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Discovery sequence</p></div>
            <span className="absolute left-2 top-1/2 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" /><span className="absolute right-12 top-9 h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,.7)]" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="mission-panel">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="telemetry-label">Animated pipeline</p><h2 className="mt-1 font-semibold text-white">Discovery workflow</h2></div><div className="flex items-center gap-3"><div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-200 shadow-[0_0_10px_rgba(103,232,249,.5)] transition-all duration-700" style={{ width: `${progress[step]}%` }} /></div><span className="font-mono text-[10px] text-cyan-200">{progress[step]}%</span></div></div>
          <ol className="grid p-5 sm:grid-cols-2 sm:p-6">
            {workflow.map((stage, index) => {
              const active = stage.states.includes(step as never);
              const complete = step === "complete" || (index === 0 && currentIndex >= 2) || (index < 3 && step === "analyzing");
              return <li className={`group relative flex gap-4 rounded-xl border p-4 transition duration-500 ${active ? "border-cyan-300/20 bg-cyan-300/[0.055]" : "border-transparent bg-transparent"}`} key={stage.title}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${complete ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200" : active ? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-200" : "border-white/[0.07] bg-black/20 text-slate-600"}`}>{complete ? <CheckCircle2 className="h-4 w-4" /> : active && working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <stage.icon className="h-4 w-4" />}</span>
                <div><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">Stage {String(index + 1).padStart(2, "0")}</span><h3 className={`mt-1 text-sm font-medium ${active || complete ? "text-white" : "text-slate-500"}`}>{stage.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-600">{stage.detail}</p></div>
              </li>;
            })}
          </ol>
        </article>

        <aside className="mission-panel flex flex-col">
          <div className="border-b border-white/[0.08] px-5 py-4"><p className="telemetry-label">Simulation telemetry</p><h2 className="mt-1 font-semibold text-white">Current operation</h2></div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${working ? "border-cyan-300/25 bg-cyan-300/[0.08]" : "border-white/[0.07] bg-black/20"}`}>{working ? <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" /> : step === "complete" ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Orbit className="h-4 w-4 text-slate-500" />}</span><div><p className="telemetry-label">Sequence status</p><p className="mt-1 text-sm font-medium text-white">{labels[step]}</p></div></div>
            <dl className="mt-6 divide-y divide-white/[0.06] text-xs">{[{ label: "Sample", value: "Kepler transit FITS" }, { label: "Detector", value: "Box Least Squares" }, { label: "Classifier", value: "Random Forest" }, { label: "Output", value: "Evidence workspace" }].map((item) => <div className="flex items-center justify-between gap-4 py-3" key={item.label}><dt className="text-slate-600">{item.label}</dt><dd className="text-right font-mono text-[10px] text-slate-300">{item.value}</dd></div>)}</dl>
            <div className="mt-auto pt-6"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Result presentation</span><span className={step === "complete" ? "text-emerald-200" : "text-slate-600"}>{step === "complete" ? "Ready" : "Pending"}</span></div><div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 p-3 text-xs text-slate-500"><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-violet-300" /> Candidate evidence</span><ArrowRight className="h-3.5 w-3.5" /></div></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
