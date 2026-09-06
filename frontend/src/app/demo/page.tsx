"use client";

import { ArrowRight, Check, Database, FlaskConical, LoaderCircle, Play, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ObservationSources } from "@/components/observation-sources";
import { IntakeStage, intakeError, startObservation } from "@/lib/analysis-intake";
import { api } from "@/lib/api";

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
      ? "Loading bundled observation…"
      : stage === "uploading"
        ? "Uploading observation…"
        : stage === "starting"
          ? "Preparing analysis…"
          : "Run Demo Analysis";

  return (
    <main className="app-workspace intake-workspace">
      <header className="intake-header">
        <div>
          <p className="workspace-kicker">Analysis / Bundled demonstration</p>
          <h1>Explore the screening workflow</h1>
          <p>Run a bundled demonstration light curve through the same candidate-screening pipeline used for uploaded observations.</p>
        </div>
        <ObservationSources current="/demo" />
      </header>

      <section className="demo-intake">
        <div className="demo-intake-main">
          <span className="demo-icon">
            <FlaskConical aria-hidden="true" />
          </span>
          <p className="dashboard-section-label">Bundled FITS observation</p>
          <h2>See ExoVision analyze a transit-like signal</h2>
          <p>
            The repository’s deterministic demonstration file is uploaded, validated, and handed to the real processing lifecycle. Results remain candidate-screening evidence, not planet confirmation.
          </p>
          {error && (
            <div className="intake-error" role="alert">
              {error}
            </div>
          )}
          <button type="button" onClick={() => void runDemo()} disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
            {label}
            <ArrowRight aria-hidden="true" />
          </button>
        </div>

        <aside>
          <h2>What happens</h2>
          <ol>
            <li>
              <span>
                <Database aria-hidden="true" />
              </span>
              <div>
                <strong>Load the bundled observation</strong>
                <p>A local FITS light curve enters the standard upload endpoint.</p>
              </div>
            </li>
            <li>
              <span>
                <Check aria-hidden="true" />
              </span>
              <div>
                <strong>Validate the input</strong>
                <p>The same server format, size, quota, and ownership checks apply.</p>
              </div>
            </li>
            <li>
              <span>
                <ScanSearch aria-hidden="true" />
              </span>
              <div>
                <strong>Screen the signal</strong>
                <p>The normal backend stages continue on the processing page.</p>
              </div>
            </li>
          </ol>
        </aside>
      </section>

      <p className="intake-crosslink">
        Ready to analyze your own data? <Link href="/upload">Upload an observation</Link>, or <Link href="/datasets">search NASA MAST</Link>.
      </p>
    </main>
  );
}
