"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, Activity } from "lucide-react";

interface ProgressiveScrollCardProps {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  headline: string;
  summary: string;
  accentNote: string;
  details: { label: string; value: string }[];
  stats: { label: string; val: string }[];
  imageSrc?: string;
  imageCaption?: string;
  streamTelemetry: {
    telemetryCode: string;
    coordinates: string;
    samplingRate: string;
    activeChannels: string;
  };
}

export function ProgressiveScrollCard({
  id,
  num,
  title,
  subtitle,
  headline,
  summary,
  accentNote,
  details,
  stats,
  imageSrc,
  imageCaption,
  streamTelemetry,
}: ProgressiveScrollCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: false, margin: "-12% 0px -12% 0px" });
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isInView) {
      const resetTimeout = setTimeout(() => {
        setLoadProgress(0);
        setIsLoaded(false);
      }, 0);
      return () => clearTimeout(resetTimeout);
    }

    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 24) + 14;
      if (p >= 100) {
        p = 100;
        setIsLoaded(true);
        clearInterval(interval);
      }
      setLoadProgress(p);
    }, 45);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={cardRef} id={id} className="scroll-mt-28">
      <motion.article
        initial={{ opacity: 0, y: 50, scale: 0.97, filter: "blur(8px)" }}
        animate={
          isInView
            ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
            : { opacity: 0.25, y: 30, scale: 0.98, filter: "blur(4px)" }
        }
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="group relative rounded-2xl border border-white/[0.12] bg-[#07090D]/85 hover:bg-[#07090D]/95 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_12px_44px_rgba(0,0,0,0.6)] hover:border-amber-400/40 hover:shadow-[0_16px_56px_rgba(245,158,11,0.12)] transition-all duration-300 overflow-hidden"
      >
        {/* Dynamic Laser Scanline that sweeps across when loaded on scroll */}
        {isInView && (
          <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "200%" }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute top-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none z-30 shadow-[0_0_12px_#f59e0b]"
          />
        )}

        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none"
        />

        {/* Top Telemetry Diagnostic HUD Bar (Scroll-Triggered Live Status) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4 mb-8 text-[10px] font-mono">
          {/* Left: Stream Code */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-amber-300 font-semibold">
              {streamTelemetry.telemetryCode}
            </span>
            <span className="text-zinc-500 hidden sm:inline">·</span>
            <span className="text-zinc-400 hidden sm:inline">{streamTelemetry.coordinates}</span>
          </div>

          {/* Center: Live Scroll Progressive Loading Indicator */}
          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#0A0F1A] border border-white/[0.1]">
            {!isLoaded ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-amber-400 uppercase tracking-widest font-semibold">
                  STREAMING TELEMETRY ({loadProgress}%)
                </span>
                {/* Micro Progress Bar */}
                <div className="w-12 h-1.5 rounded-full bg-white/[0.1] overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-75"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  DATA STREAM SYNCHRONIZED
                </span>
              </>
            )}
          </div>

          {/* Right: Sampling Rate & Channel Spec */}
          <div className="flex items-center gap-2 text-zinc-400">
            <Activity className="w-3 h-3 text-amber-400/80" />
            <span className="hidden md:inline">{streamTelemetry.samplingRate}</span>
            <span className="text-zinc-600 hidden md:inline">·</span>
            <span>{streamTelemetry.activeChannels}</span>
          </div>
        </div>

        {/* Card Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
          {/* Left Column: Luminous Milestone Numeral & Category */}
          <div className="lg:col-span-4">
            <div className="flex items-baseline gap-4">
              <div className="relative">
                <span className="font-mono text-5xl sm:text-6xl font-light text-zinc-600 group-hover:text-amber-400 transition-colors duration-300">
                  {num}
                </span>
                <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 shadow-[0_0_8px_#f59e0b] transition-opacity duration-300" />
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400 font-semibold">
                  {title}
                </span>
                <span className="block font-mono text-xs text-zinc-400 mt-0.5">
                  {subtitle}
                </span>
              </div>
            </div>

            {/* Accent Note */}
            <div className="mt-7 border-l-2 border-amber-400/60 pl-4 py-2 bg-white/[0.02] rounded-r-md group-hover:border-amber-400 transition-colors">
              <p className="text-xs text-zinc-300 italic font-sans leading-relaxed">
                &ldquo;{accentNote}&rdquo;
              </p>
            </div>

            {/* Live Stats Badges with Scroll-Loaded Reveal */}
            <div className="mt-6 flex flex-col gap-2 font-mono text-xs">
              {stats.map((st, sIdx) => (
                <motion.div
                  key={sIdx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isLoaded ? { opacity: 1, x: 0 } : { opacity: 0.4, x: -6 }}
                  transition={{ delay: 0.1 * sIdx, duration: 0.4 }}
                  className="p-2.5 rounded border border-white/[0.08] bg-white/[0.025] backdrop-blur-md flex items-center justify-between group-hover:border-amber-400/30 transition-colors"
                >
                  <span className="text-[10px] uppercase text-zinc-400">{st.label}</span>
                  <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                    {isLoaded && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
                    {st.val}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Editorial Body & Detailed Parameter Specs */}
          <div className="lg:col-span-8">
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal tracking-tight group-hover:text-amber-100 transition-colors">
              {headline}
            </h3>
            <p className="mt-4 text-sm sm:text-base text-zinc-300/90 leading-relaxed font-sans">
              {summary}
            </p>

            {/* Parameter Specification Grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/[0.08] pt-6">
              {details.map((detail, dIdx) => (
                <motion.div
                  key={dIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 5 }}
                  transition={{ delay: 0.15 + dIdx * 0.08, duration: 0.4 }}
                  className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] group-hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
                >
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-medium">
                    {detail.label}
                  </span>
                  <span className="block mt-1 text-xs text-zinc-200 font-sans leading-snug">
                    {detail.value}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Product Capability Interface Image Preview */}
            {imageSrc && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 10 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="mt-7 relative rounded-xl overflow-hidden border border-white/[0.12] bg-[#07090D] shadow-[0_12px_40px_rgba(0,0,0,0.65)] group/img hover:border-amber-400/40 transition-colors"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={imageSrc}
                    alt={headline}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover/img:scale-[1.025]"
                    sizes="(max-width: 1024px) 100vw, 750px"
                  />
                </div>

                {/* Subtle dark vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090D]/85 via-transparent to-black/20 pointer-events-none" />

                {/* Telemetry caption overlay tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-zinc-300 pointer-events-none">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#07090D]/90 backdrop-blur-md border border-white/10 text-amber-300 font-semibold shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {imageCaption || "ExoVision UI Telemetry"}
                  </span>
                  <span className="hidden sm:inline px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-zinc-400">
                    Live Platform Architecture
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.article>
    </div>
  );
}
