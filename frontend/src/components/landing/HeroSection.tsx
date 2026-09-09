"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoAvailable, setVideoAvailable] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePlayback = () => {
      if (!videoRef.current) return;
      if (media.matches) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } else {
        void videoRef.current.play().catch(() => setVideoAvailable(false));
      }
    };
    updatePlayback();
    media.addEventListener("change", updatePlayback);
    return () => media.removeEventListener("change", updatePlayback);
  }, []);

  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="landing-hero-fallback" aria-hidden="true" />
      {videoAvailable && (
        <video ref={videoRef} aria-hidden="true" autoPlay className="landing-hero-video" loop muted onError={() => setVideoAvailable(false)} playsInline preload="metadata">
          <source src="/EXOVISION_AI__AI_Assisted_Exop.mp4" type="video/mp4" />
        </video>
      )}
      <div className="landing-hero-shade" aria-hidden="true" />
      <div className="landing-shell relative z-10 flex min-h-[100svh] items-end pb-20 pt-28 sm:pb-24 lg:items-center lg:pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-sm border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />
            AI-Assisted Candidate Screening
          </div>

          <h1 id="hero-title" className="mt-5 font-display text-[clamp(3rem,8vw,6.5rem)] font-bold leading-[0.88] tracking-[-0.06em] text-white">
            EXOVISION <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-indigo-200 bg-clip-text text-transparent">AI</span>
          </h1>

          <p className="mt-5 max-w-2xl font-display text-xl font-medium tracking-[-0.02em] text-slate-100 sm:text-2xl lg:text-3xl">
            Stellar Light Curves. Transit Signals. Evidence.
          </p>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Analyze stellar photometric observations, detect periodic transit-like dips using Box Least Squares, and screen candidate signals with machine learning.
          </p>

          {/* Conceptual transit light-curve illustration */}
          <div className="landing-hero-motif mt-6 max-w-xl" aria-label="Conceptual light-curve transit motif">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>Conceptual Light-Curve Motif</span>
              <span>Relative Flux ΔF/F</span>
            </div>
            <svg aria-hidden="true" className="mt-2 h-10 w-full" viewBox="0 0 500 40" fill="none">
              <path d="M0 16 C60 14 110 18 170 15 L210 15 C218 15 222 34 235 35 L265 35 C278 34 282 15 290 15 L330 16 C390 14 440 18 500 16" stroke="#38bdf8" strokeWidth="1.75" strokeLinecap="round" />
              <line x1="210" y1="6" x2="210" y2="38" stroke="rgba(56,189,248,0.25)" strokeDasharray="2 2" />
              <line x1="290" y1="6" x2="290" y2="38" stroke="rgba(56,189,248,0.25)" strokeDasharray="2 2" />
            </svg>
          </div>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <Link className="landing-button landing-button-primary" href="/upload">
              Analyze Observation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="landing-button landing-button-secondary" href="/demo">
              <Play className="h-4 w-4 text-cyan-300" /> Explore Demo
            </Link>
          </div>

          <p className="mt-7 font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-slate-400 sm:text-xs">
            Supported Data: FITS · CSV · TXT <span aria-hidden="true">·</span> Kepler · K2 · TESS via NASA MAST
          </p>
        </div>
      </div>
      <a className="landing-scroll-cue" href="#transition-story"><span>Scroll to explore</span><ArrowDown className="h-4 w-4" /></a>
    </section>
  );
}
