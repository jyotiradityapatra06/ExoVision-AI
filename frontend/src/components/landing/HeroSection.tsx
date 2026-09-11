"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Layers,
  Orbit,
  Sparkles,
  Telescope,
} from "lucide-react";
import { CelestialObservatoryCanvas } from "@/components/landing/CelestialObservatoryCanvas";

const proof = [
  { icon: Telescope, label: "01 ARCHIVE", title: "NASA MAST", text: "Kepler, K2 & TESS calibrated telemetry" },
  { icon: Orbit, label: "02 DETECTION", title: "BLS Search", text: "Box Least Squares periodicity solver" },
  { icon: Sparkles, label: "03 VALIDATION", title: "Evidence AI", text: "Random Forest & harmonic scrutiny" },
  { icon: Layers, label: "04 PROVENANCE", title: "Immutable Dossier", text: "Publication-grade PDF & BibTeX" },
];

export function HeroSection() {
  const [hoverX, setHoverX] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.1]);
  const y = useTransform(scrollYProgress, [0, 0.8], [0, 60]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden border-b border-white/[0.08] bg-[#07090D]"
      aria-labelledby="hero-title"
    >
      {/* Real-time Interactive 3D Celestial Observatory System — Host Star, Orbits, Gravity & Flares */}
      <CelestialObservatoryCanvas className="opacity-100" />

      {/* Atmospheric Luminous Shading — Minimal scrimming to keep the video bright and vivid */}
      {/* Top nav contrast shadow */}
      <div
        className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#07090d]/80 via-[#07090d]/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      {/* Ambient starlight glow */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-amber-400/20 via-sky-400/15 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      {/* Deep-Space Left-Hand Contrast Shield for Typography */}
      <div
        className="absolute inset-y-0 left-0 w-full lg:w-3/5 bg-gradient-to-r from-[#07090D]/75 via-[#07090D]/35 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      {/* Bottom seamless blend into next chapter */}
      <div
        className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#07090d] via-[#07090d]/70 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Hero Content Area */}
      <motion.div
        style={{ opacity, y }}
        className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pt-28 sm:pt-32 pb-8 w-full"
      >
        {/* Observatory Command Plinth — Shields Title & Buttons with Generous Breathing Room for Real Sun */}
        <div className="relative max-w-xl lg:max-w-[540px] xl:max-w-xl rounded-3xl border border-white/[0.14] bg-[#07090D]/85 backdrop-blur-2xl p-6 sm:p-9 shadow-[0_24px_64px_rgba(0,0,0,0.85),_inset_0_1px_1px_rgba(255,255,255,0.14)] overflow-hidden">
          {/* Golden Starlight Top Rim Beam */}
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent pointer-events-none"
          />
          {/* Ambient Warm Corner Starlight Aura */}
          <div
            aria-hidden="true"
            className="absolute -top-16 -left-16 w-56 h-56 bg-amber-400/15 blur-3xl pointer-events-none rounded-full"
          />

          {/* Luminous Glassmorphic Kicker Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/[0.14] bg-white/[0.05] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-300 mb-5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-zinc-200 font-medium">From Light to New Worlds</span>
            <span className="text-zinc-600">/</span>
            <span className="text-amber-400/90 font-semibold">Observational Astrophysics</span>
          </motion.div>

          {/* Attractive Display Heading with Metallic / Starlight Gradient */}
          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[0.96] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]"
          >
            Exoplanets<br />
            <span className="italic font-serif bg-gradient-to-r from-zinc-100 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(217,119,6,0.45)]">
              Hidden in Light
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-5 max-w-xl text-sm sm:text-base text-zinc-200 font-sans leading-relaxed drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]"
          >
            AI-assisted analysis of stellar light curves. Query space telescopes,
            detect sub-millimagnitude transit dips, and inspect the evidentiary dossiers behind distant worlds.
          </motion.p>

          {/* Glassmorphic Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/upload"
              className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#F4F1EA] text-[#090D0F] text-xs font-semibold tracking-wide hover:bg-white transition-all duration-200 shadow-[0_4px_28px_rgba(255,255,255,0.22)] hover:shadow-[0_0_36px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
            >
              <span>Analyze Observation</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#narrative"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg border border-white/20 bg-[#07090D]/60 backdrop-blur-xl text-zinc-200 text-xs font-medium tracking-wide hover:border-amber-400/50 hover:bg-white/[0.08] hover:text-white transition-all duration-200 hover:-translate-y-0.5"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Explore the Science</span>
            </Link>
          </motion.div>
        </div>

        {/* Opaque Astronomical Telemetry Dossier Card — Distinct, Crisp & High-Contrast */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="mt-10 mb-6 rounded-xl border border-white/[0.18] bg-[#0A0E17]/95 backdrop-blur-3xl p-5 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.85),_0_0_1px_1px_rgba(255,255,255,0.08)] relative z-20 overflow-hidden"
        >
          {/* Subtle Golden Top Rim Highlight */}
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent pointer-events-none"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-200 font-semibold">
                Live Flux Telemetry
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-[11px] font-mono text-zinc-300">Target Kepler-10 (KOI-072.01)</span>
            </div>

            {/* Live Synchronized Transit Simulation & Parameter Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Miniature Star & Orbiting Exoplanet Simulation */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#07090D] border border-white/[0.12]">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Transit Sim</span>
                <div className="relative w-12 h-5 flex items-center justify-center overflow-hidden">
                  {/* Host Star */}
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 shadow-[0_0_10px_#f59e0b]" />
                  {/* Orbiting Exoplanet */}
                  <motion.div
                    className="absolute w-1.5 h-1.5 rounded-full bg-zinc-950 border border-amber-300/80 shadow-[0_0_4px_rgba(0,0,0,0.9)]"
                    animate={{
                      x: [-20, 20],
                      scale: [0.8, 1.1, 0.8],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-300">
                <span className="px-2.5 py-1 rounded bg-[#07090D] border border-white/[0.1]">
                  P = 0.8375 d
                </span>
                <span className="px-2.5 py-1 rounded bg-[#07090D] border border-white/[0.1]">
                  δ = 198 ppm
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  BLS SNR 18.42
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Photometric Curve with Ultra-Crisp Precision & Scan Line */}
          <div
            className="w-full h-28 sm:h-32 relative overflow-hidden mt-3 cursor-crosshair rounded bg-[#06080E]/60 border border-white/[0.04]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoverX(((e.clientX - rect.left) / rect.width) * 1000);
            }}
            onMouseLeave={() => setHoverX(null)}
          >
            {/* Ultra-Slim Precision BLS Laser Scan Line */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-y-0 w-8 pointer-events-none z-10 bg-gradient-to-r from-transparent via-amber-400/[0.08] to-amber-400/[0.18] border-r-2 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]"
              animate={{
                left: ["-5%", "105%"],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            <svg
              className="w-full h-full"
              viewBox="0 0 1000 120"
              preserveAspectRatio="none"
              aria-label="Kepler-10 interactive light curve"
            >
              <defs>
                <linearGradient id="dipGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Coordinate Grid Lines */}
              <line x1="0" y1="20" x2="1000" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="1000" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="1000" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

              {/* Transit Zone Highlight */}
              <rect x="440" y="0" width="120" height="120" fill="url(#dipGlow)" />
              <line x1="500" y1="0" x2="500" y2="120" stroke="rgba(245,158,11,0.5)" strokeDasharray="3 3" />

              {/* Hover Cursor Line */}
              {hoverX !== null && (
                <line x1={hoverX} y1="0" x2={hoverX} y2="120" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />
              )}

              {/* Photometry Points */}
              {Array.from({ length: 96 }).map((_, i) => {
                const x = 8 + i * 10.4;
                const dist = Math.abs(x - 500);
                const dip = dist < 65 ? Math.exp(-Math.pow(dist / 30, 2)) * 48 : 0;
                const noise = Math.sin(i * 12.34) * 4.5;
                const y = 35 + dip + noise;
                const isDip = dist < 42;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={isDip ? "2" : "1.3"}
                    fill={isDip ? "#f59e0b" : "rgba(226, 232, 240, 0.6)"}
                    opacity={isDip ? 0.95 : 0.45}
                  />
                );
              })}

              {/* Fitted Keplerian Transit Dip Model Curve */}
              <path
                d="M 10 35 L 435 35 Q 465 35 482 78 L 495 83 Q 500 84 505 83 L 518 78 Q 535 35 565 35 L 990 35"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
              />

              {/* Label Callout */}
              <text x="500" y="106" fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="0.08em">
                t₀ TRANSIT DIP (198 PPM)
              </text>
            </svg>
          </div>
        </motion.div>
      </motion.div>

      {/* Glassmorphic Telemetry Provenance Strip */}
      <div className="relative z-10 border-t border-white/[0.08] bg-[#07090D]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          {proof.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="py-5 px-4 first:pl-0 last:pr-0 flex items-start gap-3 group">
                <div className="w-8 h-8 rounded border border-white/[0.1] bg-white/[0.03] backdrop-blur-md flex items-center justify-center shrink-0 text-amber-400 group-hover:border-amber-400/50 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                    {item.label}
                  </span>
                  <span className="block mt-0.5 text-xs font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </span>
                  <p className="mt-0.5 text-[11px] text-zinc-400 font-sans truncate">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {/* Scroll Descent Sentinel Prompt */}
        <div className="border-t border-white/[0.04] py-2.5 px-6 flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400 bg-black/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>Scroll to Stream Deep Space Ingestion</span>
          <motion.span
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-amber-400 font-bold"
          >
            ↓
          </motion.span>
        </div>
      </div>
    </section>
  );
}
