"use client";

import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";

export function OrbitalHeroStage() {
  const [transitStep, setTransitStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransitStep((prev) => (prev + 1) % 100);
    }, 35);
    return () => clearInterval(interval);
  }, []);

  const isTransiting = transitStep >= 38 && transitStep <= 62;
  const transitDepthPercent = isTransiting
    ? Math.sin(((transitStep - 38) / 24) * Math.PI) * 1.0
    : 0;

  return (
    <div className="relative w-full h-[480px] lg:h-[540px] flex items-center justify-center">
      {/* Container Box with Stitch Glass Frame */}
      <div className="relative w-full h-full max-w-lg hud-glass p-3 rounded-xl border border-primary/20 overflow-hidden shadow-[0_0_35px_rgba(0,218,243,0.15)] scanline-container">
        {/* Floating Scanner beam */}
        <div
          className="absolute inset-y-0 w-0.5 bg-gradient-to-b from-transparent via-primary to-transparent pointer-events-none transition-all duration-75 shadow-[0_0_15px_#00e5ff]"
          style={{ left: `${transitStep}%` }}
        />

        {/* Central Astronomy Render Container */}
        <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-[#050b18]">
          {/* Host Star */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="absolute h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-gradient-to-r from-amber-100 via-secondary-container to-amber-500 shadow-[0_0_90px_rgba(234,107,0,0.95)] animate-pulse" />
            <div className="absolute h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white shadow-[0_0_50px_#ffffff]" />

            {/* Transiting Planet Shadow */}
            {isTransiting && (
              <div
                className="absolute z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-surface-container-lowest/90 shadow-[0_0_15px_#000000]"
                style={{ transform: `translateX(${(transitStep - 50) * 3}px)` }}
              />
            )}
          </div>

          {/* Orbital Rings */}
          <div className="absolute h-[160px] w-[290px] sm:h-[190px] sm:w-[380px] rounded-[50%] border border-primary/20 rotate-[-12deg]" />
          <div className="absolute h-[210px] w-[390px] sm:h-[250px] sm:w-[500px] rounded-[50%] border border-primary/40 rotate-[-15deg] shadow-[0_0_25px_rgba(0,218,243,0.2)]">
            <motion.div
              className="absolute top-1/2 left-1/2 -ml-4 -mt-4 z-30"
              style={{
                x: Math.cos((transitStep / 100) * 2 * Math.PI) * 195,
                y: Math.sin((transitStep / 100) * 2 * Math.PI) * 100 * Math.cos(Math.PI / 6),
              }}
            >
              <div className="relative">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary via-ai-accent to-indigo-950 shadow-[0_0_20px_#00e5ff] border border-white/60" />
                <div className="absolute -inset-1.5 rounded-full bg-primary/40 blur-md animate-pulse" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Data Card: Top Left */}
        <div className="absolute top-8 left-[-10px] sm:left-[-25px] hud-glass p-4 border-l-2 border-primary w-48 text-left shadow-2xl z-30 font-mono text-xs">
          <div className="font-data-mono text-[10px] text-on-surface-variant uppercase mb-1">TARGET IDENTIFIER</div>
          <div className="font-label-caps text-primary text-sm font-bold mb-2 flex items-center gap-1">
            <BadgeCheck className="h-4 w-4 text-primary" />
            EXO-4821
          </div>
          <div className="space-y-1 font-data-mono text-[11px]">
            <div className="flex justify-between"><span className="text-outline">CLASS</span> <span className="text-on-surface font-bold">CONFIRMED</span></div>
            <div className="flex justify-between"><span className="text-outline">CONFIDENCE</span> <span className="text-primary font-bold drop-shadow-[0_0_5px_#00e5ff]">98.4%</span></div>
          </div>
        </div>

        {/* Floating Data Card: Bottom Right */}
        <div className="absolute bottom-16 right-[-10px] sm:right-[-25px] hud-glass p-4 border-r-2 border-secondary w-48 text-right shadow-2xl z-30 font-mono text-xs">
          <div className="space-y-1 font-data-mono text-[11px]">
            <div className="flex justify-between"><span className="text-outline">PERIOD</span> <span className="text-on-surface font-bold">3.52 DAYS</span></div>
            <div className="flex justify-between"><span className="text-outline">SNR</span> <span className="text-secondary font-bold">24.8</span></div>
          </div>
        </div>

        {/* Mini Light Curve Overlay at Bottom */}
        <div className="absolute bottom-3 left-3 right-3 h-20 hud-glass border-t border-outline-variant/50 p-2 flex flex-col justify-between z-30">
          <div className="flex justify-between text-[10px] font-data-mono text-primary">
            <span>REAL-TIME LIGHT CURVE</span>
            <span>FLUX: {(1.0 - transitDepthPercent * 0.015).toFixed(4)}</span>
          </div>
          <svg className="w-full h-10 opacity-90 drop-shadow-[0_0_6px_rgba(0,229,255,0.8)]" preserveAspectRatio="none" viewBox="0 0 100 40">
            <path
              d={`M 0 10 L 30 10 C 35 10, 40 ${10 + transitDepthPercent * 25}, 50 ${10 + transitDepthPercent * 25} C 60 ${10 + transitDepthPercent * 25}, 65 10, 70 10 L 100 10`}
              fill="none"
              stroke="#00e5ff"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" x1="0" x2="100" y1="35" y2="35" />
            <line stroke="rgba(0,229,255,0.3)" strokeDasharray="2,2" strokeWidth="0.5" x1="50" x2="50" y1="0" y2="40" />
          </svg>
        </div>
      </div>
    </div>
  );
}
