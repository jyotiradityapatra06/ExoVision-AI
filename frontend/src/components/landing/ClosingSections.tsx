import Link from "next/link";
import { ArrowRight, Database, FileDown, ShieldCheck } from "lucide-react";

const technologies = [
  ["Frontend", "Next.js · React · TypeScript"],
  ["Backend", "FastAPI · Python · SQLite"],
  ["Science", "Astropy · Lightkurve · Box Least Squares"],
  ["Machine learning", "scikit-learn · Random Forest"],
  ["Data", "NASA MAST · FITS / CSV / TXT"],
];

export function DataAndReportsSection() {
  return (
    <section className="landing-section border-b border-white/[0.07]">
      <div className="landing-shell split-features">
        <article><Database /><p className="landing-kicker">Public observations</p><h2>Explore public light curves.</h2><p>Search and import supported Kepler, K2, and TESS light-curve products through NASA MAST. Imported observations enter the same owned analysis workflow as uploaded data.</p><Link href="/datasets">Explore observations <ArrowRight /></Link></article>
        <article><FileDown /><p className="landing-kicker">Scientific report</p><h2>Take the analysis with you.</h2><p>Generate a PDF that records candidate measurements, classifier output, supporting and cautionary evidence, and the scientific caveats needed for responsible interpretation.</p><Link href="/demo">See the demonstration <ArrowRight /></Link></article>
      </div>
    </section>
  );
}

export function TechnologySection() {
  return (
    <section className="landing-section" id="technology">
      <div className="landing-shell"><div className="landing-heading-grid"><div><p className="landing-kicker">System architecture</p><h2>Built as a real analysis system.</h2></div><p>A browser interface connects to an authenticated FastAPI service, a reproducible astronomy pipeline, local persistence, and a bundled classifier. Each layer has a clear job.</p></div>
        <div className="technology-stack">{technologies.map(([layer, tools]) => <div key={layer}><span>{layer}</span><p>{tools}</p></div>)}</div>
      </div>
    </section>
  );
}

export function TransparencyAndCta() {
  return (
    <><section className="transparency-section"><div className="landing-shell"><ShieldCheck /><p className="landing-kicker">Scientific transparency</p><h2>Designed for screening,<br />not confirmation.</h2><p>ExoVision helps identify and inspect promising transit-like signals. Potential candidates require additional validation, instrument-systematics assessment, and scientific review.</p></div></section>
      <section className="final-cta"><div className="landing-shell"><p className="landing-kicker">Begin an analysis</p><h2>Start with a light curve.</h2><p>Upload an observation or explore the bundled demonstration workflow.</p><div><Link className="landing-button landing-button-primary" href="/upload">Analyze Observation <ArrowRight /></Link><Link className="landing-button landing-button-secondary" href="/demo">Explore Demo</Link></div></div></section></>
  );
}

export function LandingFooter() {
  return (
    <footer className="landing-footer"><div className="landing-shell"><div><strong>EXOVISION AI</strong><p>AI-Assisted Exoplanet Candidate Screening</p></div><nav aria-label="Footer navigation"><a href="#science">Science</a><a href="#workflow">Workflow</a><a href="#technology">Technology</a><Link href="/upload">Analyze</Link><Link href="/demo">Demo</Link><Link href="/auth/login">Sign In</Link></nav><p className="landing-disclaimer">Candidate-screening and research-support software. Independent validation is required for scientific confirmation.</p></div></footer>
  );
}
