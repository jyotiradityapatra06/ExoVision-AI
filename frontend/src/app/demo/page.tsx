"use client";

import { CircleCheck, FlaskConical, LoaderCircle, Play, Telescope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/button";
import { api, ApiError } from "@/lib/api";

type Step = "ready" | "loading" | "uploading" | "analyzing" | "complete";

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
  const label = { ready: "Run sample analysis", loading: "Loading sample FITS…", uploading: "Preparing analysis…", analyzing: "Running BLS and ML…", complete: "Opening results…" }[step];
  return (
    <main className="mx-auto min-h-[80vh] max-w-5xl px-5 pb-24 pt-28 sm:px-8">
      <section className="overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.08] via-slate-950/80 to-violet-400/[0.06] p-8 sm:p-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10"><FlaskConical className="h-6 w-6 text-cyan-200" /></div>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">Guided scientific demo</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">Discover a transit without finding a file first.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">ExoVision will load the bundled FITS light curve, pass it through the same upload, BLS detection, feature extraction, Random Forest classification, explainability, and reporting workflow used for your own observations.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {["Real FITS light curve", "Known 5-day transit", "Full explainable result"].map((item) => <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200" key={item}><CircleCheck className="h-4 w-4 text-emerald-300" />{item}</div>)}
        </div>
        {error && <p className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-4 text-sm text-rose-200">{error}</p>}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button onClick={runDemo} disabled={working} size="lg">{working ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}{label}</Button>
          <span className="flex items-center gap-2 text-sm text-slate-400"><Telescope className="h-4 w-4" /> Usually completes in under a minute</span>
        </div>
      </section>
    </main>
  );
}
