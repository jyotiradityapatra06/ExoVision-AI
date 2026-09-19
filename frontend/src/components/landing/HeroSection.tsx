"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  FlaskConical,
  Orbit,
  Satellite,
  Telescope,
} from "lucide-react";
import { PrecisionButton } from "@/components/ui";

const proof = [
  { icon: Telescope, title: "NASA Archives", text: "Kepler, K2, and TESS photometry" },
  { icon: Orbit, title: "BLS Detection", text: "Box Least Squares period search" },
  { icon: Satellite, title: "Random Forest", text: "Candidate feature screening" },
  { icon: FileText, title: "PDF Reports", text: "Publication-grade evidence dossier" },
];

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoAvailable, setVideoAvailable] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (!videoRef.current) return;
      if (media.matches) videoRef.current.pause();
      else void videoRef.current.play().catch(() => setVideoAvailable(false));
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <section className="reference-hero" aria-labelledby="hero-title">
      {videoAvailable && (
        <video
          ref={videoRef}
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => setVideoAvailable(false)}
        >
          <source src="/EXOVISION_AI_AI_Assisted_Expo.mp4" type="video/mp4" />
        </video>
      )}
      <div className="reference-hero-shade" aria-hidden="true" />

      <div className="landing-shell reference-hero-inner">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          {/* Left Column: Hero Copy */}
          <div className="reference-hero-copy lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-zinc-300 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              ExoVision AI · Candidate Screening Engine v2.4
            </div>

            <h1 id="hero-title">
              Algorithmic<br />
              Exoplanet Transit<br />
              <em>Analysis</em>
            </h1>

            <span className="text-zinc-300 font-normal">
              Analyze stellar light curves, screen candidate transits with Box Least Squares (BLS), and review Random Forest classification evidence through one unified astrophysical workbench.
            </span>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <PrecisionButton href="/upload" variant="primary" size="lg">
                <span className="flex items-center gap-2">
                  <span>Analyze Light Curve</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </PrecisionButton>
              <PrecisionButton href="/demo" variant="secondary" size="lg">
                <span className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-zinc-400" />
                  <span>Explore Demo</span>
                </span>
              </PrecisionButton>
            </div>
          </div>

          {/* Right Column: Cartesian Light Curve Workbench Preview Card */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="rounded-lg border border-white/[0.12] bg-[#0c0e16]/90 p-4 shadow-2xl backdrop-blur-md">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                    Figure 01 / Live Screening Preview
                  </p>
                  <h3 className="text-xs font-semibold text-white">
                    Kepler-10b Transit Detection
                  </h3>
                </div>
                <span className="rounded border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  BLS SNR 18.42
                </span>
              </div>

              {/* Cartesian Curve Visualization Preview */}
              <div className="relative h-44 w-full rounded border border-white/[0.06] bg-[#07080d] p-2 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="30" y1="60" x2="390" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="30" y1="100" x2="390" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="30" y1="140" x2="390" y2="140" stroke="rgba(255,255,255,0.06)" />

                  <line x1="120" y1="10" x2="120" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="210" y1="10" x2="210" y2="140" stroke="rgba(56,189,248,0.25)" strokeDasharray="2 2" />
                  <line x1="300" y1="10" x2="300" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  {/* Scatter Measurements (Noise Floor + Transit Dip) */}
                  {[
                    [35, 38], [45, 41], [55, 36], [65, 42], [75, 39], [85, 43], [95, 37],
                    [105, 40], [115, 39], [125, 42], [135, 41], [145, 38], [155, 43],
                    [165, 42], [175, 45], [185, 62], [195, 88], [202, 108], [210, 114],
                    [218, 107], [225, 85], [235, 58], [245, 44], [255, 39], [265, 42],
                    [275, 40], [285, 44], [295, 37], [305, 41], [315, 38], [325, 43],
                    [335, 40], [345, 42], [355, 39], [365, 41], [375, 38], [385, 42],
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="1.5" fill="#38bdf8" opacity="0.6" />
                  ))}

                  {/* Theoretical Transit Curve Line */}
                  <path
                    d="M 30 40 L 175 40 Q 190 40 198 80 L 202 110 Q 210 115 218 110 L 222 80 Q 230 40 245 40 L 390 40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.8"
                  />

                  {/* Transit Dip Annotator */}
                  <text x="215" y="132" fill="#f59e0b" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    t₀ = 2455002.84
                  </text>
                  <text x="25" y="44" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="end">
                    1.00
                  </text>
                  <text x="25" y="112" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="end">
                    0.98
                  </text>
                </svg>
              </div>

              {/* Data Strip */}
              <div className="grid grid-cols-4 gap-2 border-t border-white/[0.08] pt-3 mt-3 text-[10px] font-mono">
                <div>
                  <p className="text-zinc-500 uppercase">Period (P)</p>
                  <strong className="text-zinc-200">0.8375 d</strong>
                </div>
                <div>
                  <p className="text-zinc-500 uppercase">Depth (δ)</p>
                  <strong className="text-zinc-200">198 ppm</strong>
                </div>
                <div>
                  <p className="text-zinc-500 uppercase">Duration</p>
                  <strong className="text-zinc-200">1.82 h</strong>
                </div>
                <div>
                  <p className="text-zinc-500 uppercase">Score</p>
                  <strong className="text-emerald-400">94.8%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Strip */}
      <div className="reference-proof landing-shell">
        {proof.map(({ icon: Icon, title, text }, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/[0.08] bg-white/[0.03] text-zinc-300">
              <Icon className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">{title}</p>
              <p className="text-[11px] text-zinc-400">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
