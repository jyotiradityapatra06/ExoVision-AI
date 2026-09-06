import { AlertTriangle, Check, FileText, Orbit, ScanSearch } from "lucide-react";

export function ProductShowcase() {
  return (
    <section className="landing-section product-section">
      <div className="landing-shell">
        <div className="landing-heading-grid">
          <div><p className="landing-kicker">Actual product capability</p><h2>See the signal. Inspect the evidence.</h2></div>
          <p>The results workspace keeps the raw observation, phase-folded signal, candidate measurements, classifier output, and interpretation together. The representative interface below uses illustrative values and mirrors the current product structure.</p>
        </div>
        <div className="product-frame">
          <div className="product-frame-bar"><span><i /> ExoVision results workspace</span><span>Representative sample data</span></div>
          <div className="product-grid">
            <div className="product-main">
              <div className="product-summary"><div><p>Candidate screening</p><h3>Transit-like signal identified</h3></div><span>Analysis completed</span></div>
              <div className="product-metrics"><div><span>Period</span><b>3.52 d</b></div><div><span>Duration</span><b>0.15 d</b></div><div><span>Depth</span><b>0.012</b></div><div><span>Transit SNR</span><b>18.2</b></div></div>
              <div className="product-plot"><div><span>Phase-folded curve</span><span>Relative flux</span></div><svg aria-label="Representative phase-folded transit curve" role="img" viewBox="0 0 700 180"><path className="product-gridline" d="M0 35H700M0 90H700M0 145H700M175 0V180M350 0V180M525 0V180"/><path className="product-line" d="M0 51 C120 48 180 54 260 50 C294 50 305 54 315 115 C321 147 379 147 385 115 C395 54 406 50 440 50 C530 54 605 48 700 51"/></svg></div>
            </div>
            <aside className="product-aside">
              <div className="product-classification"><span><Orbit /> Random Forest</span><p>Model score</p><strong>0.86</strong><small>Candidate screening output</small></div>
              <div className="product-evidence"><h4><Check /> Supporting evidence</h4><p>Strong periodicity and a measurable transit signal support further inspection.</p></div>
              <div className="product-evidence caution"><h4><AlertTriangle /> Cautionary evidence</h4><p>Independent validation and review of possible false positives remain required.</p></div>
            </aside>
          </div>
          <div className="product-frame-footer"><span><ScanSearch /> Raw and folded observations</span><span><FileText /> Downloadable scientific report</span></div>
        </div>
      </div>
    </section>
  );
}
