"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, RadioTower, X } from "lucide-react";

const sectionLinks = [
  { href: "#observe", label: "01 Observe" },
  { href: "#analyze", label: "02 Analyze" },
  { href: "#interpret", label: "03 Interpret" },
  { href: "#archive", label: "04 Archive" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 sm:px-8 pt-4 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-full transition-all duration-300 px-5 sm:px-6 h-14 flex items-center justify-between ${
          scrolled
            ? "bg-[#07090D]/85 backdrop-blur-2xl border border-white/[0.14] shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
            : "bg-[#07090D]/40 backdrop-blur-md border border-white/[0.08]"
        }`}
      >
        {/* Brand */}
        <Link className="flex items-center gap-2.5 text-zinc-100 group" href="/">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.15] bg-white/[0.05] text-amber-400 group-hover:border-amber-400/50 transition-colors">
            <RadioTower className="h-3.5 w-3.5" />
          </div>
          <span className="font-serif text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
            ExoVision
            <span className="font-mono text-[9px] text-amber-400 uppercase tracking-widest px-1 py-0.2 rounded bg-amber-400/10 border border-amber-400/20">
              AI
            </span>
          </span>
        </Link>

        {/* Narrative Links */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Sections">
          {sectionLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors tracking-wider"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="hidden items-center gap-4 sm:flex">
          <Link
            href="/auth/login"
            className="text-xs font-mono text-zinc-300 hover:text-white transition-colors px-2"
          >
            Sign In
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.1] backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white hover:text-black hover:border-white shadow-[0_0_16px_rgba(255,255,255,0.1)]"
          >
            <span>Launch Pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="rounded-full p-2 text-zinc-300 md:hidden hover:bg-white/10"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="mt-2 max-w-7xl mx-auto rounded-2xl border border-white/15 bg-[#07090D]/95 backdrop-blur-2xl p-5 md:hidden shadow-2xl space-y-4"
        >
          <div className="flex flex-col gap-3 font-mono text-xs">
            {sectionLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-zinc-300 hover:text-amber-400 py-1"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="text-xs font-mono text-zinc-300 py-1"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white text-black py-2.5 text-xs font-semibold"
              onClick={() => setOpen(false)}
            >
              <span>Launch Pipeline</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
