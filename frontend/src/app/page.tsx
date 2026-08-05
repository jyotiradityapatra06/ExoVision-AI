"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  Database,
  FileChartColumn,
  FileUp,
  Orbit,
  ScanSearch,
  Sparkles,
  Telescope,
} from "lucide-react";
import Link from "next/link";

const pipeline = [
  { id: "upload-data", icon: FileUp, title: "Upload Data", detail: "FITS, CSV, or TXT photometry" },
  { id: "signal-processing", icon: ChartNoAxesCombined, title: "Signal Processing", detail: "Clean, normalize, and detrend" },
  { id: "bls-detection", icon: ScanSearch, title: "BLS Detection", detail: "Search for periodic transit dips" },
  { id: "ml-classification", icon: BrainCircuit, title: "ML Classification", detail: "Evaluate candidate features" },
  { id: "explainable-results", icon: Sparkles, title: "Explainable Results", detail: "Inspect evidence and reports" },
];

const features = [
  {
    id: "transit-detection",
    icon: Orbit,
    title: "Transit Detection",
    description: "Box Least Squares searches calibrated light curves for the periodic loss of flux produced by an orbiting body.",
    label: "PERIODIC SIGNAL SEARCH",
  },
  {
    id: "ml-classification",
    icon: BrainCircuit,
    title: "Machine Learning Classification",
    description: "Candidate measurements are transformed into validated features and evaluated by the trained classification pipeline.",
    label: "CANDIDATE ASSESSMENT",
  },
  {
    id: "explainable-ai",
    icon: Sparkles,
    title: "Explainable AI",
    description: "Supporting and cautionary evidence makes each model assessment inspectable instead of returning an opaque label.",
    label: "EVIDENCE ATTRIBUTION",
  },
  {
    id: "research-reports",
    icon: FileChartColumn,
    title: "Research Reports",
    description: "Export analysis measurements, transit plots, classification context, and scientific caveats as a structured PDF.",
    label: "REPRODUCIBLE OUTPUT",
  },
];

const stars = [
  [7, 12, 1], [15, 35, 1.5], [24, 8, 1], [35, 18, 1.2], [46, 7, 1],
  [56, 24, 1.4], [68, 10, 1], [78, 20, 1.3], [91, 8, 1], [94, 41, 1.5],
  [5, 62, 1.2], [18, 79, 1], [33, 69, 1.4], [72, 76, 1], [88, 66, 1.2],
];

export default function HomePage() {
  const reducedMotion = useReducedMotion();
  const reveal = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.18 },
        transition: { duration: 0.6 },
      };

  return (
    <div className="overflow-hidden pt-16">
      <section className="relative isolate min-h-[calc(100vh-4rem)] border-b border-white/[0.07]">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_76%_37%,rgba(14,116,144,.15),transparent_30%),radial-gradient(circle_at_15%_30%,rgba(30,64,175,.12),transparent_26%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1480px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:py-20">
          <motion.div {...reveal} className="relative z-10">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">
              <Telescope className="h-4 w-4" aria-hidden="true" />
              AI-powered transit analysis
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-white sm:text-6xl xl:text-7xl">
              Discover Exoplanets Hidden in Stellar Light Curves
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Detect periodic transit signals in Kepler and TESS photometry with a complete AI workflow—from light-curve preparation and BLS search to classification, explanation, and scientific reporting.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-200 px-6 text-sm font-semibold text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200" href="/upload">
                Analyze Light Curve <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/40 px-6 text-sm font-semibold text-white backdrop-blur transition hover:border-cyan-200/40 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200" href="/dashboard">
                Explore Dashboard
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-4 border-t border-white/[0.08] pt-6 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Database className="h-4 w-4 text-cyan-200" /> Kepler &amp; TESS compatible</span>
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300" /> Explainable predictions</span>
            </div>
          </motion.div>

          <motion.div {...reveal} className="relative mx-auto w-full max-w-3xl" aria-label="Scientific visualization of an exoplanet transit and corresponding brightness dip">
            <div className="absolute -inset-10 rounded-full bg-cyan-400/[0.05] blur-3xl" />
            <div className="relative aspect-[1.08/1] overflow-hidden rounded-[1.75rem] border border-cyan-100/15 bg-[#030817]/90 shadow-[0_32px_100px_rgba(0,0,0,.55)]">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 700" role="img" aria-labelledby="transit-title transit-description">
                <title id="transit-title">Exoplanet transit detection</title>
                <desc id="transit-description">An exoplanet crosses a glowing star while a connected light curve records the resulting dip in brightness.</desc>
                <defs>
                  <radialGradient id="star-core"><stop offset="0" stopColor="#fffde8" /><stop offset=".35" stopColor="#fde68a" /><stop offset=".72" stopColor="#f59e0b" /><stop offset="1" stopColor="#b45309" /></radialGradient>
                  <radialGradient id="planet"><stop offset="0" stopColor="#155e75" /><stop offset=".58" stopColor="#082f49" /><stop offset="1" stopColor="#020617" /></radialGradient>
                  <filter id="star-glow"><feGaussianBlur stdDeviation="22" /></filter>
                  <filter id="soft-glow"><feGaussianBlur stdDeviation="6" /></filter>
                  <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#22d3ee" stopOpacity=".2" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient>
                </defs>

                {stars.map(([x, y, radius], index) => (
                  <motion.circle
                    animate={reducedMotion ? undefined : { opacity: [0.25, 0.85, 0.25] }}
                    cx={`${x}%`} cy={`${y}%`} fill="#dbeafe" key={`hero-star-${x}-${y}-${radius}`} r={radius}
                    transition={{ duration: 3 + (index % 4), repeat: Infinity, delay: index * 0.17 }}
                  />
                ))}

                <ellipse cx="395" cy="280" fill="none" rx="254" ry="108" stroke="#67e8f9" strokeDasharray="4 9" strokeOpacity=".26" transform="rotate(-12 395 280)" />
                <ellipse cx="395" cy="280" fill="none" rx="215" ry="88" stroke="#fff" strokeOpacity=".05" transform="rotate(-12 395 280)" />
                <circle cx="408" cy="264" fill="#f59e0b" filter="url(#star-glow)" opacity=".42" r="125" />
                <circle cx="408" cy="264" fill="url(#star-core)" r="88" />
                <circle cx="382" cy="238" fill="#fff" opacity=".3" r="25" />
                <path d="M334 250c28-28 111-49 151 10M342 293c35 23 91 36 137 4" fill="none" stroke="#fff7cc" strokeLinecap="round" strokeOpacity=".24" strokeWidth="3" />

                <motion.g animate={reducedMotion ? undefined : { x: [-46, 102, -46], y: [8, -17, 8] }} transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}>
                  <circle cx="358" cy="270" fill="#0891b2" filter="url(#soft-glow)" opacity=".25" r="37" />
                  <circle cx="358" cy="270" fill="url(#planet)" r="25" />
                  <path d="M342 255c8-8 19-12 30-8" fill="none" stroke="#67e8f9" strokeLinecap="round" strokeOpacity=".55" strokeWidth="3" />
                </motion.g>

                <g fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="11">
                  <path d="M525 170l55-40h70" fill="none" stroke="#94a3b8" strokeWidth="1" />
                  <circle cx="525" cy="170" fill="#67e8f9" r="3" />
                  <text x="588" y="125" fill="#67e8f9">STELLAR SOURCE</text><text x="588" y="141" fill="#64748b">NORMALIZED FLUX</text>
                  <path d="M306 327l-72 40h-87" fill="none" stroke="#94a3b8" strokeWidth="1" />
                  <circle cx="306" cy="327" fill="#67e8f9" r="3" />
                  <text x="98" y="364" fill="#67e8f9">ORBITAL PATH</text><text x="98" y="380" fill="#64748b">PERIODIC OCCULTATION</text>
                  <path d="M380 287l92 75h112" fill="none" stroke="#94a3b8" strokeWidth="1" />
                  <circle cx="380" cy="287" fill="#fbbf24" r="3" />
                  <text x="493" y="357" fill="#fbbf24">TRANSIT EVENT</text><text x="493" y="373" fill="#64748b">BRIGHTNESS DECREASE</text>
                </g>

                <g transform="translate(58 470)">
                  <rect fill="#07101f" fillOpacity=".8" height="172" rx="12" stroke="#164e63" strokeOpacity=".65" width="644" />
                  <text fill="#94a3b8" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" letterSpacing="2" x="22" y="27">OBSERVED STELLAR BRIGHTNESS</text>
                  <line stroke="#334155" strokeOpacity=".7" x1="42" x2="620" y1="130" y2="130" />
                  <line stroke="#334155" strokeOpacity=".5" x1="42" x2="42" y1="48" y2="130" />
                  <path d="M42 63 C110 61 152 65 211 63 C247 63 253 119 287 119 C321 119 327 63 363 63 C448 65 510 61 620 63 L620 130 L42 130Z" fill="url(#chart-fill)" />
                  <motion.path d="M42 63 C110 61 152 65 211 63 C247 63 253 119 287 119 C321 119 327 63 363 63 C448 65 510 61 620 63" fill="none" initial={reducedMotion ? undefined : { pathLength: 0 }} stroke="#67e8f9" strokeLinecap="round" strokeWidth="2.5" transition={{ duration: 2.2, ease: "easeInOut" }} viewport={{ once: true }} whileInView={reducedMotion ? undefined : { pathLength: 1 }} />
                  <line stroke="#fbbf24" strokeDasharray="3 5" strokeOpacity=".7" x1="287" x2="287" y1="42" y2="135" />
                  <text fill="#fbbf24" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" x="299" y="109">TRANSIT DIP</text>
                  <text fill="#64748b" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="9" x="530" y="151">TIME →</text>
                </g>
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div {...reveal} className="max-w-2xl">
            <p className="section-label">How ExoVision works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">From raw photons to an explainable candidate</h2>
            <p className="mt-5 leading-7 text-slate-400">A traceable scientific workflow preserves the connection between uploaded measurements, detected periodicity, and the final model assessment.</p>
          </motion.div>
          <div className="mt-14 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
            {pipeline.map((stage, index) => (
              <div className="contents" key={stage.id}>
                <motion.article {...reveal} className="group rounded-2xl border border-white/[0.08] bg-slate-950/50 p-5 transition hover:border-cyan-200/25 hover:bg-cyan-200/[0.035]" key={`${stage.id}-card`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-200/[0.07] text-cyan-200"><stage.icon className="h-5 w-5" /></div>
                  <p className="mt-7 font-mono text-[10px] tracking-[0.18em] text-slate-600">STEP 0{index + 1}</p>
                  <h3 className="mt-2 font-semibold text-white">{stage.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{stage.detail}</p>
                </motion.article>
                {index < pipeline.length - 1 && <div className="flex items-center justify-center py-1 text-slate-700 lg:px-1"><ArrowDown className="h-4 w-4 lg:-rotate-90" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-slate-950/45 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div {...reveal} className="text-center"><p className="section-label">Scientific features</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Built for evidence, not spectacle</h2></motion.div>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <motion.article {...reveal} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07101f]/80 p-7 sm:p-8" key={feature.id}>
                <div className="absolute right-0 top-0 h-32 w-32 bg-cyan-300/[0.04] blur-2xl" />
                <div className="flex items-start gap-5"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-200/[0.07] text-cyan-200"><feature.icon className="h-6 w-6" /></div><div><p className="font-mono text-[10px] tracking-[0.18em] text-cyan-300/70">{feature.label}</p><h3 className="mt-2 text-xl font-semibold text-white">{feature.title}</h3><p className="mt-3 leading-7 text-slate-400">{feature.description}</p></div></div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:items-center lg:px-10">
          <motion.div {...reveal}>
            <p className="section-label">Real analysis preview</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Inspect the signal behind every result</h2>
            <p className="mt-5 leading-7 text-slate-400">The analysis workspace renders the uploaded light curve, its phase-folded transit, measured parameters, model classification, confidence, and explanatory evidence directly from the API.</p>
            <ul className="mt-7 space-y-3 text-sm text-slate-300">
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" /> Interactive zoom and point inspection</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" /> Candidate-specific model confidence</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-200" /> Supporting and cautionary evidence</li>
            </ul>
          </motion.div>
          <motion.div {...reveal} className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#050b17] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><p className="text-sm font-semibold text-white">Candidate analysis workspace</p><p className="mt-1 text-xs text-slate-500">Populated from each completed analysis</p></div><span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs text-emerald-300">API data</span></div>
            <div className="grid gap-px bg-white/[0.06] sm:grid-cols-[1fr_180px]">
              <div className="space-y-px bg-white/[0.06]">
                <PreviewChart title="Observed light curve" folded={false} reducedMotion={reducedMotion} />
                <PreviewChart title="Phase-folded curve" folded reducedMotion={reducedMotion} />
              </div>
              <div className="bg-[#050b17] p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Candidate confidence</p><div className="mt-5 flex aspect-square items-center justify-center rounded-full border-[10px] border-slate-800 border-t-cyan-200 border-r-violet-300"><div className="text-center"><BrainCircuit className="mx-auto h-6 w-6 text-cyan-200" /><span className="mt-2 block text-xs text-slate-400">Calculated from<br />real features</span></div></div><div className="mt-6 space-y-2"><div className="h-2 rounded bg-slate-800"><div className="h-2 w-4/5 rounded bg-cyan-200/70" /></div><div className="h-2 rounded bg-slate-800"><div className="h-2 w-3/5 rounded bg-violet-300/70" /></div><p className="pt-2 text-[11px] leading-5 text-slate-500">Values appear only after a dataset has been analyzed.</p></div></div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 sm:pb-28">
        <motion.div {...reveal} className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-cyan-200/15 bg-[#071321] px-6 py-16 text-center sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.12),transparent_45%)]" />
          <div className="relative"><Telescope className="mx-auto h-7 w-7 text-cyan-200" /><h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Analyze your first stellar signal</h2><p className="mx-auto mt-5 max-w-xl leading-7 text-slate-400">Bring a Kepler, TESS, or calibrated observatory light curve into the complete ExoVision workflow.</p><Link className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-200 px-7 text-sm font-semibold text-slate-950 transition hover:bg-white" href="/upload">Analyze Light Curve <ArrowRight className="h-4 w-4" /></Link></div>
        </motion.div>
      </section>
    </div>
  );
}

function PreviewChart({ title, folded, reducedMotion }: { title: string; folded: boolean; reducedMotion: boolean | null }) {
  const path = folded
    ? "M20 38 C90 37 120 39 145 38 C165 38 170 91 200 91 C230 91 235 38 255 38 C290 39 330 37 390 38"
    : "M20 47 C70 42 100 51 145 45 C185 40 210 49 248 44 C275 41 302 48 390 43";
  return (
    <div className="bg-[#050b17] p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-300">{title}</p><span className="font-mono text-[9px] text-slate-600">DATA-DRIVEN</span></div><svg className="mt-4 h-28 w-full" viewBox="0 0 410 110" role="img" aria-label={`${title} interface preview`}><line x1="20" x2="390" y1="96" y2="96" stroke="#334155" /><line x1="20" x2="20" y1="14" y2="96" stroke="#334155" /><motion.path d={path} fill="none" initial={reducedMotion ? undefined : { pathLength: 0 }} stroke={folded ? "#c4b5fd" : "#67e8f9"} strokeWidth="2" transition={{ duration: 1.8 }} viewport={{ once: true }} whileInView={reducedMotion ? undefined : { pathLength: 1 }} /></svg></div>
  );
}
