import { ArrowRight, BrainCircuit, Orbit, ScanSearch, Sparkles } from "lucide-react";

import { Button } from "@/components/button";
import { Card } from "@/components/card";

const capabilities = [
  {
    icon: ScanSearch,
    eyebrow: "Detect",
    title: "Find the signal in the noise",
    description:
      "A research-grade transit pipeline surfaces repeating dips in stellar brightness.",
  },
  {
    icon: BrainCircuit,
    eyebrow: "Classify",
    title: "Separate candidates from mimics",
    description:
      "Machine learning distinguishes planetary transits, binaries, stellar activity, and noise.",
  },
  {
    icon: Sparkles,
    eyebrow: "Explain",
    title: "Understand every prediction",
    description:
      "Plain-language evidence keeps the science reviewable for students and researchers.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero-grid relative overflow-hidden border-b border-white/8">
        <div className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="relative z-10 max-w-3xl">
            <div className="eyebrow mb-7">
              <span className="status-dot" />
              AI classification engine online
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Turn starlight into
              <span className="block text-sky-300">planetary evidence.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              ExoVision AI transforms astronomical light curves into classified,
              explainable exoplanet candidates—without hiding the science.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="/upload" size="lg">
                Start an analysis
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
              <Button href="/dashboard" size="lg" variant="secondary">
                Explore dashboard
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
              <span>Kepler &amp; TESS ready</span>
              <span>Explainable predictions</span>
              <span>Open science foundation</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
            <div className="orbital-stage">
              <div className="star" />
              <div className="orbit orbit-one"><span /></div>
              <div className="orbit orbit-two"><span /></div>
              <div className="signal-panel">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Candidate</p>
                    <p className="mt-1 font-medium text-white">EXO-4821</p>
                  </div>
                  <Orbit className="h-5 w-5 text-sky-300" />
                </div>
                <div className="light-curve"><span /></div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="metric"><span>Period</span><strong>3.52 d</strong></div>
                  <div className="metric"><span>Confidence</span><strong>96.4%</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="section-label">One scientific workflow</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            From raw observation to a reasoned result.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {capabilities.map((capability) => (
            <Card key={capability.title} className="group p-7">
              <capability.icon className="h-6 w-6 text-sky-300" aria-hidden="true" />
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/80">
                {capability.eyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">{capability.title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{capability.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
