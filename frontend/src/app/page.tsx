import { FileText, Orbit, Telescope } from "lucide-react";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingNav } from "@/components/landing/LandingNav";

const workflowSteps = [
  {
    step: "01",
    icon: Telescope,
    title: "Observation Ingestion",
    subtitle: "Public archives or local time-series",
    copy: "Ingest normalized stellar light curves directly from NASA MAST (Kepler, K2, TESS) or upload bespoke FITS, CSV, and TXT photometry.",
  },
  {
    step: "02",
    icon: Orbit,
    title: "Signal Detection",
    subtitle: "Box Least Squares (BLS) spectral search",
    copy: "Scan thousands of trial orbital frequencies to detect periodic transit dips, calculating orbital period, fractional depth, duration, and SNR.",
  },
  {
    step: "03",
    icon: FileText,
    title: "Candidate Evidence",
    subtitle: "Machine learning screening & dossier",
    copy: "Evaluate features with Random Forest classification, inspect SHAP attributions, verify harmonic tests, and generate immutable PDF reports.",
  },
];

const archives = [
  { name: "NASA MAST", desc: "Mikulski Archive for Space Telescopes" },
  { name: "Kepler Mission", desc: "Primary 4-Year Staring Photometry" },
  { name: "K2 Mission", desc: "Ecliptic Plane Transit Survey" },
  { name: "TESS Mission", desc: "Transiting Exoplanet Survey Satellite" },
];

export default function HomePage() {
  return (
    <main className="landing-page reference-landing">
      <LandingNav />
      <HeroSection />

      {/* Mission Archive Compatibility Strip */}
      <section className="border-y border-white/[0.08] bg-[#07090e]/80 py-6">
        <div className="landing-shell flex flex-wrap items-center justify-between gap-6">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Compatible Astronomical Data Archives
          </p>
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            {archives.map((item) => (
              <div key={item.name} className="flex flex-col">
                <span className="text-xs font-semibold tracking-tight text-zinc-300">
                  {item.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3-Step Scientific Workflow */}
      <section className="reference-workflow py-20" id="workflow">
        <div className="landing-shell">
          <div className="max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
              Observation to Evidence
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              From starlight to exoplanet evidence.
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              A unified astrophysical pipeline designed for reproducibility, from raw photometric time-series to inspectable candidate-screening dossiers.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.step}
                  className="rounded-lg border border-white/[0.08] bg-zinc-950/60 p-6 transition hover:border-white/[0.16] hover:bg-zinc-900/40"
                >
                  <div className="flex items-center justify-between text-zinc-500 mb-4 font-mono text-xs">
                    <span>STEP {step.step}</span>
                    <Icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <p className="text-xs font-mono text-zinc-400 mt-1">{step.subtitle}</p>
                  <p className="mt-3 text-xs text-zinc-400 leading-relaxed">{step.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modern Scientific Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-xs text-zinc-500">
        <div className="landing-shell flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">ExoVision AI</span>
            <span className="font-mono text-[11px] text-zinc-500">v2.4 Online</span>
          </div>
          <p className="text-center md:text-right font-mono text-[11px] text-zinc-500">
            Scientific candidate-screening software. Independent validation via radial velocity or imaging is required.
          </p>
        </div>
      </footer>
    </main>
  );
}
