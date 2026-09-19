"use client";

import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Database,
  FileArchive,
  FileCheck,
  FileSearch,
  FileUp,
  FlaskConical,
  Layers,
  LoaderCircle,
  Play,
  ScanSearch,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PrecisionButton, SegmentedControl } from "@/components/ui";
import { IntakeStage, intakeError, startObservation } from "@/lib/analysis-intake";
import { api } from "@/lib/api";

const workflowSteps = [
  {
    num: "01",
    title: "Observation",
    desc: "Retrieve the bundled FITS light-curve sample from the repository archive.",
    icon: Database,
  },
  {
    num: "02",
    title: "Validation",
    desc: "Apply standard server format, size bounds, and ownership checks.",
    icon: FileCheck,
  },
  {
    num: "03",
    title: "Transit Search",
    desc: "Evaluate periodic transit-like dips via Box Least Squares (BLS).",
    icon: ScanSearch,
  },
  {
    num: "04",
    title: "Classification",
    desc: "Screen extracted signal features using the Random Forest classifier.",
    icon: BrainCircuit,
  },
  {
    num: "05",
    title: "Evidence",
    desc: "Review candidate metrics, folded curves, and diagnostic plots in Results.",
    icon: FileSearch,
  },
];

const explanationPoints = [
  {
    title: "Identical Ingestion Pathway",
    desc: "The demo does not bypass backend systems. It sends a real FITS binary through the standard /api/v1/upload/lightcurve ingestion pipeline.",
    icon: Layers,
  },
  {
    title: "Authoritative Analysis Pipeline",
    desc: "Executes the live Python pipeline: LTTB downsampling, Box Least Squares period grid search, and Random Forest feature scoring.",
    icon: BrainCircuit,
  },
  {
    title: "Full Scientific Dossier",
    desc: "Generates the complete scientific analysis dossier: interactive phase-folded light curves, candidate ranking, SNR metrics, and PDF export.",
    icon: Telescope,
  },
];

export default function DemoPage() {
  return (
    <ProtectedRoute>
      <DemoContent />
    </ProtectedRoute>
  );
}

function DemoContent() {
  const router = useRouter();
  const [stage, setStage] = useState<IntakeStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const busy = stage !== "idle";

  async function runDemo() {
    if (busy) return;
    setError(null);
    setStage("downloading");
    try {
      const file = await api.downloadDemoDataset();
      const analysisId = await startObservation(file, setStage);
      router.push(`/results/${analysisId}`);
    } catch (caught) {
      setError(intakeError(caught));
      setStage("idle");
    }
  }

  const label =
    stage === "downloading"
      ? "Retrieving bundled observation…"
      : stage === "uploading"
        ? "Uploading observation…"
        : stage === "starting"
          ? "Starting analysis pipeline…"
          : "Run Demo Analysis";

  return (
    <main className="app-workspace max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] text-cyan-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
            Demonstration · Curated Workflow
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
            Explore the Screening Workflow
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans max-w-2xl">
            Run a curated transit-like observation through the same ingestion and candidate-screening pipeline used for uploaded observations.
          </p>
        </div>

        {/* Ingestion Source Switcher */}
        <div className="flex items-center shrink-0">
          <SegmentedControl<string>
            value="demo"
            onChange={(val) => {
              if (val === "upload") router.push("/upload");
              if (val === "datasets") router.push("/datasets");
            }}
            items={[
              { id: "upload", label: "File Upload", icon: FileUp },
              { id: "datasets", label: "NASA MAST", icon: Database },
              { id: "demo", label: "Synthetic Demo", icon: FlaskConical },
            ]}
          />
        </div>
      </header>

      {/* Primary Observation & Action Panel */}
      <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 sm:p-6 shadow-sm" aria-labelledby="demo-observation-heading">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="rounded border border-purple-500/30 bg-purple-950/40 px-2 py-0.5 font-mono text-[10px] font-medium text-purple-300 uppercase">
                Curated Sample
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Repository Demo File</span>
            </div>

            <h2 id="demo-observation-heading" className="text-lg font-semibold text-white tracking-tight">
              Curated Light-Curve Observation
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed">
              The repository’s deterministic demonstration observation (<code className="text-zinc-200 font-mono text-[11px]">exoplanet_demo_transit.fits</code>) is retrieved from the server, validated, and handed to the live processing lifecycle. Results provide candidate-screening evidence, not planet confirmation.
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <PrecisionButton
              type="button"
              variant="primary"
              size="lg"
              onClick={() => void runDemo()}
              disabled={busy}
              loading={busy}
              className="font-semibold text-xs h-11 px-6 justify-center"
            >
              {busy ? (
                <span>{label}</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>Run Demo Analysis</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </PrecisionButton>
          </div>
        </div>

        {/* Observation Metadata Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-md border border-white/[0.06] bg-[#090b0e] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Filename</span>
            <span className="font-mono text-xs text-zinc-200 block truncate mt-1" title="exoplanet_demo_transit.fits">
              exoplanet_demo_transit.fits
            </span>
          </div>

          <div className="rounded-md border border-white/[0.06] bg-[#090b0e] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Format</span>
            <span className="font-mono text-xs text-zinc-200 block mt-1">FITS Binary Table</span>
          </div>

          <div className="rounded-md border border-white/[0.06] bg-[#090b0e] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">File Size</span>
            <span className="font-mono text-xs text-zinc-200 block mt-1">123.8 KiB (126,720 B)</span>
          </div>

          <div className="rounded-md border border-white/[0.06] bg-[#090b0e] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Source</span>
            <span className="font-mono text-xs text-zinc-200 block mt-1">Repository Sample</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-md border border-rose-500/30 bg-rose-500/[0.08] p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Workflow Sequence (Horizontal on Desktop, Vertical on Mobile) */}
      <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 sm:p-6 shadow-sm" aria-labelledby="workflow-heading">
        <header className="pb-4 border-b border-white/[0.06] mb-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Pipeline Lifecycle</p>
          <h2 id="workflow-heading" className="text-sm font-semibold text-white tracking-tight">
            Conceptual Screening Workflow
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Every observation passes through five disciplined analysis stages
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex flex-col justify-between rounded-md border border-white/[0.06] bg-[#090b0e] p-4 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded border border-white/[0.10] bg-[#11151b] font-mono text-[10px] font-semibold text-cyan-400">
                      {step.num}
                    </span>
                    <Icon className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-xs font-semibold text-white tracking-tight">{step.title}</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-1.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* What this Demonstration Shows */}
      <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#0d1015] p-5 sm:p-6 shadow-sm" aria-labelledby="demonstration-notes-heading">
        <header className="pb-4 border-b border-white/[0.06] mb-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Methodology</p>
          <h2 id="demonstration-notes-heading" className="text-sm font-semibold text-white tracking-tight">
            What This Demonstration Shows
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Understanding the difference between interactive demonstration and production research screening
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {explanationPoints.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-md border border-white/[0.06] bg-[#090b0e] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Icon className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Crosslink */}
      <p className="mt-8 text-center text-xs font-mono text-zinc-500">
        Ready to analyze your own data?{" "}
        <Link href="/upload" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
          Upload an observation
        </Link>
        , or{" "}
        <Link href="/datasets" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
          search NASA MAST
        </Link>
        .
      </p>
    </main>
  );
}
