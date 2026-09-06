"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, RadioTower, X } from "lucide-react";

const sectionLinks = [
  { href: "#capabilities", label: "Capabilities" },
  { href: "#science", label: "Science" },
  { href: "#workflow", label: "Workflow" },
  { href: "#technology", label: "Technology" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <header className={`landing-nav ${scrolled || open ? "landing-nav-solid" : ""}`}>
      <nav aria-label="Public navigation" className="landing-shell flex h-[72px] items-center justify-between">
        <Link className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.08em] text-white" href="/"><RadioTower className="h-4 w-4 text-cyan-200" /> EXOVISION AI</Link>
        <div className="hidden items-center gap-7 lg:flex">{sectionLinks.map((link) => <a className="landing-nav-link" href={link.href} key={link.href}>{link.label}</a>)}</div>
        <div className="hidden items-center gap-5 sm:flex"><Link className="landing-nav-link" href="/auth/login">Sign In</Link><Link className="landing-nav-action" href="/upload">Analyze Observation</Link></div>
        <button aria-expanded={open} aria-label={open ? "Close navigation" : "Open navigation"} className="rounded-sm p-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 sm:hidden" onClick={() => setOpen((value) => !value)} type="button">{open ? <X /> : <Menu />}</button>
      </nav>
      {open && <nav aria-label="Mobile public navigation" className="border-t border-white/10 bg-[#06090d] px-5 py-5 sm:hidden"><div className="flex flex-col gap-1">{sectionLinks.map((link) => <a className="landing-mobile-link" href={link.href} key={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}<Link className="landing-mobile-link" href="/auth/login">Sign In</Link><Link className="landing-button landing-button-primary mt-3" href="/upload">Analyze Observation</Link></div></nav>}
    </header>
  );
}
