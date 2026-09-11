"use client";

import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { motion } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";

import { ProductCapabilitiesShowcase } from "@/components/auth/ProductCapabilitiesShowcase";

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
}) {
  const { loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  if (loading || user) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-[#07090D] text-zinc-300 gap-3"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle className="w-5 h-5 animate-spin text-amber-400" aria-hidden="true" />
        <p className="font-mono text-xs text-zinc-400">
          {loading ? "Restoring research session…" : "Opening research workspace…"}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between items-center bg-[#07090D] text-zinc-100 font-sans selection:bg-amber-500 selection:text-black relative overflow-x-hidden p-6 sm:p-10">
      {/* Astrometric Coordinate Grid Background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px]"
      />

      {/* Radiant Central Nebular Glow */}
      <div
        aria-hidden="true"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[650px] bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.08)_0%,_rgba(56,189,248,0.03)_45%,_transparent_72%)] blur-3xl pointer-events-none"
      />

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl flex items-center justify-between relative z-10 py-2">
        <Link href="/" className="inline-flex items-center gap-3 text-white group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.45)]">
            <span className="font-serif font-bold text-xs text-black">Ex</span>
          </div>
          <span className="font-serif text-lg font-semibold tracking-wide group-hover:text-amber-300 transition-colors">
            ExoVision AI
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
            Observatory Terminal
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Return to Observatory</span>
        </Link>
      </header>

      {/* Content Area: Side-by-Side on Wide Screens (Terminal on Left, Product Capabilities Showcase on Right) */}
      <div className="w-full max-w-7xl my-auto relative z-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Focused Glassmorphic Observatory Login Terminal */}
        <div className="lg:col-span-5 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl border border-white/[0.12] bg-[#0A0E17]/85 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden"
          >
            {/* Luminous Top Golden Starlight Edge Beam */}
            <div
              aria-hidden="true"
              className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none"
            />

            {/* Terminal Eyebrow & Headline */}
            <div className="pb-5 border-b border-white/[0.08]">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300 mb-3 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                <span>{eyebrow}</span>
              </div>

              <h1
                id="auth-form-title"
                className="font-serif text-2xl sm:text-3xl font-medium text-white tracking-tight leading-tight"
              >
                {title}
              </h1>

              <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-sans">
                {description}
              </p>
            </div>

            {/* Form Children */}
            <div className="py-5">
              {children}
            </div>

            {/* Alternate Pathway Link */}
            <div className="pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs font-sans">
              <span className="text-zinc-400">Need another pathway?</span>
              <Link
                href={alternateHref}
                className="font-medium text-amber-300 hover:text-amber-200 hover:underline underline-offset-4 transition-colors"
              >
                {alternateLabel}
              </Link>
            </div>
          </motion.div>

          {/* Security Provenance Assurance */}
          <div className="mt-5 flex items-center justify-center gap-2 text-zinc-500 text-[11px] font-mono text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
            <span>Authenticated workspace · Deterministic ledger</span>
          </div>
        </div>

        {/* Right Column: Real Product Capabilities Showcase (Real Images & Telemetry) */}
        <div className="lg:col-span-7 w-full">
          <ProductCapabilitiesShowcase />
        </div>
      </div>

      {/* Bottom Footer Stamp */}
      <footer className="w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 relative z-10 py-2 border-t border-white/[0.04]">
        <span>ExoVision AI v2.4 · NASA MAST Direct Access</span>
        <span className="hidden sm:inline">SHA-256 Cryptographic Session Tokens</span>
      </footer>
    </main>
  );
}
