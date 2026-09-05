"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Database,
  Sparkles,
  Telescope,
  Radio,
  CheckCircle2,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden pt-24 pb-16">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/4 top-1/4 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[450px] w-[450px] rounded-full bg-violet-600/15 blur-[140px]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-10">
        {/* LEFT COLUMN */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-start"
        >
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-mono font-bold tracking-[0.2em] text-cyan-300 shadow-[0_0_15px_rgba(0,218,243,0.15)]">
            <Telescope className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>EXOVISION AI</span>
            <span className="text-cyan-500">•</span>
            <span className="text-slate-300">AI-ASSISTED CANDIDATE SCREENING</span>
          </div>

          {/* Headline */}
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl xl:text-7xl leading-[1.1]">
            Screen Stellar Signals{" "}
            <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent filter drop-shadow-[0_0_25px_rgba(0,218,243,0.3)]">
              With AI-Powered Insight
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            ExoVision AI analyzes Kepler, K2, TESS, and user-supplied light curves to detect transit-like signals and help classify potential exoplanet candidates.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
            <Link
              href="/upload"
              className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-8 py-3.5 font-semibold text-slate-950 shadow-[0_0_25px_rgba(0,218,243,0.4)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(0,218,243,0.7)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Screening</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex h-13 items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-900/60 px-8 py-3.5 font-semibold text-cyan-200 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/60 hover:bg-cyan-950/40 hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              Explore Dashboard
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 grid w-full max-w-xl grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4 backdrop-blur-md shadow-lg">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 text-cyan-300">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Kepler & TESS Compatible</p>
                <p className="text-xs text-slate-400">Direct NASA mission data integration</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-slate-900/50 p-4 backdrop-blur-md shadow-lg">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-950/60 text-violet-300">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Explainable AI Analysis</p>
                <p className="text-xs text-slate-400">Model importance and evidence overlays</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN - HUD CONTAINER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative flex justify-center lg:justify-end"
        >
          {/* Main Floating Glass HUD Container */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="group relative w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-400/40 bg-slate-950/70 p-3 shadow-[0_0_50px_rgba(6,182,212,0.25)] backdrop-blur-xl transition-transform duration-500 hover:scale-[1.02] hover:border-cyan-300/70"
          >
            {/* Top HUD Frame bar */}
            <div className="mb-2 flex items-center justify-between px-3 py-1.5 text-xs font-mono text-cyan-300/80 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span>LIVE SYSTEM CONSOLE // MISSION-CONTROL</span>
              </div>
              <span className="text-[10px] text-slate-400">BLS + ML PIPELINE</span>
            </div>

            {/* Next.js Optimized Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-cyan-500/20 shadow-inner">
              <Image
                src="/dashboard-hero.png"
                alt="ExoVision AI Scientific Analysis Dashboard Console"
                fill
                priority
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Corner Bracket Accents */}
            <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
          </motion.div>

          {/* Floating Card: TOP RIGHT - ILLUSTRATIVE MODEL SCORE */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -top-6 -right-2 sm:right-0 z-20 w-64 rounded-2xl border border-cyan-300/30 bg-slate-950/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                MODEL SCORE
              </span>
              <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-[10px] text-cyan-300">EXAMPLE</span>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">98.4%</p>
            <p className="mt-1 text-xs text-slate-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              Illustrative candidate classification
            </p>
          </motion.div>

          {/* Floating Card: BOTTOM LEFT - MISSION DATA */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-6 -left-2 sm:left-0 z-20 w-72 rounded-2xl border border-violet-400/30 bg-slate-950/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-violet-300">
              <Radio className="h-4 w-4 text-violet-400 animate-pulse" />
              MISSION DATA
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-lg border border-cyan-500/30 bg-cyan-950/60 px-2.5 py-1 text-xs font-mono font-semibold text-cyan-300">
                NASA KEPLER
              </span>
              <span className="rounded-lg border border-violet-500/30 bg-violet-950/60 px-2.5 py-1 text-xs font-mono font-semibold text-violet-300">
                NASA TESS
              </span>
              <span className="rounded-lg border border-amber-500/30 bg-amber-950/60 px-2.5 py-1 text-xs font-mono font-semibold text-amber-300">
                CUSTOM LIGHT CURVES
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
