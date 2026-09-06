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
      <div className="landing-shell relative z-10 flex min-h-[100svh] items-end pb-24 pt-32 sm:pb-28 lg:items-center lg:pb-20">
        <div className="max-w-3xl">
          <p className="landing-kicker">AI-assisted astronomical analysis</p>
          <h1 id="hero-title" className="mt-5 text-[clamp(3.4rem,8.5vw,7rem)] font-semibold leading-[0.84] tracking-[-0.07em] text-white">
            EXOVISION <span className="text-cyan-200">AI</span>
          </h1>
          <p className="mt-7 max-w-2xl text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl lg:text-3xl">AI-Assisted Exoplanet Candidate Screening</p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Analyze stellar observations. Detect transit-like signals. Screen candidates with machine learning.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link className="landing-button landing-button-primary" href="/upload">Analyze Observation <ArrowRight className="h-4 w-4" /></Link>
            <Link className="landing-button landing-button-secondary" href="/demo"><Play className="h-4 w-4" /> Explore Demo</Link>
          </div>
          <p className="mt-7 font-mono text-[10px] uppercase leading-5 tracking-[0.16em] text-slate-400 sm:text-xs">FITS / CSV / TXT <span aria-hidden="true">·</span> Box Least Squares <span aria-hidden="true">·</span> Random Forest <span aria-hidden="true">·</span> NASA MAST</p>
        </div>
      </div>
      <a className="landing-scroll-cue" href="#capabilities"><span>Scroll to explore</span><ArrowDown className="h-4 w-4" /></a>
    </section>
  );
}
