import { Activity, Binary, BrainCircuit, FileSearch, ScanLine } from "lucide-react";

const pipeline = [
  ["01", "Observation", "FITS / CSV / TXT"],
  ["02", "Preprocess", "Clean · Normalize · Detrend"],
  ["03", "BLS search", "Periodic transit search"],
  ["04", "Candidate", "Period · Duration · Depth · SNR"],
  ["05", "ML screening", "Random Forest"],
  ["06", "Evidence", "Measurements · Model score · Report"],
];

export function PipelineSection() {
  return (
    <section className="landing-section border-b border-white/[0.07]" id="capabilities">
      <div className="landing-shell">
        <div className="landing-heading-grid">
          <div><p className="landing-kicker">The analysis path</p><h2>From starlight to evidence.</h2></div>
          <p>A stellar light curve contains changes in brightness over time. ExoVision processes that observation, searches for periodic transit-like signals, extracts candidate measurements, and uses machine learning to assist candidate screening.</p>
        </div>
        <ol className="pipeline-sequence" aria-label="ExoVision analysis pipeline">
          {pipeline.map(([number, title, detail]) => (
            <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TransitChart() {
  return (
    <figure className="science-chart">
      <figcaption><span>Explanatory visualization</span><span>Relative brightness / time</span></figcaption>
      <svg aria-label="Illustration of a repeating light curve with three transit-like dips" role="img" viewBox="0 0 900 250">
        <g className="chart-grid"><path d="M0 45H900M0 105H900M0 165H900M0 225H900" /><path d="M100 0V250M300 0V250M500 0V250M700 0V250" /></g>
        <path className="chart-signal" d="M0 72 C35 67 55 77 85 71 S135 68 160 72 L180 72 C190 72 193 185 207 188 L235 188 C249 187 252 73 264 72 C305 67 332 78 370 71 S420 69 450 72 L468 72 C478 72 481 184 495 188 L523 188 C537 186 540 73 552 72 C595 68 622 77 660 72 S710 68 738 72 L756 72 C766 72 769 184 783 188 L811 188 C825 186 828 73 840 72 C862 69 880 74 900 71" />
        <g className="chart-marker"><path d="M207 18V218M495 18V218M783 18V218" /><circle cx="207" cy="188" r="5" /><circle cx="495" cy="188" r="5" /><circle cx="783" cy="188" r="5" /></g>
      </svg>
      <div className="chart-legend"><span>Observed brightness</span><span>Repeating transit-like interval</span></div>
    </figure>
  );
}

export function ScienceSection() {
  return (
    <section className="landing-section" id="science">
      <div className="landing-shell">
        <div className="max-w-3xl"><p className="landing-kicker">Signal analysis</p><h2>Search for the repeating shadow.</h2><p className="landing-lead">When an orbiting object crosses its host star, measured brightness may decrease periodically. ExoVision uses Box Least Squares to search for repeating box-shaped transit-like signals. A detection is evidence to inspect—not confirmation of a planet.</p></div>
        <div className="mt-14"><TransitChart /></div>
        <div className="science-columns mt-24">
          <div><p className="landing-kicker">Machine learning</p><h2>Machine learning as a screening layer.</h2><p className="landing-lead">Detected candidates become measurable features evaluated by the bundled Random Forest classifier.</p></div>
          <div className="model-panel">
            <div className="model-panel-header"><BrainCircuit className="h-5 w-5" /><span>Classifier output</span></div>
            <p className="model-score-label">Model Score</p>
            <div className="model-score">
              <span className="font-mono">0.84</span>
              <i aria-hidden="true" />
            </div>
            <dl><div><dt>Period</dt><dd>Orbital interval</dd></div><div><dt>Transit depth</dt><dd>Relative flux change</dd></div><div><dt>Duration</dt><dd>Event width</dd></div><div><dt>Transit SNR</dt><dd>Signal strength</dd></div></dl>
            <p className="model-note">Model score reflects classifier output for candidate screening. It is not a calibrated probability of a confirmed exoplanet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EvidenceSection() {
  const items = [
    { icon: Activity, title: "Measured properties", text: "Period, duration, depth, SNR, repeatability, and shape diagnostics remain visible." },
    { icon: Binary, title: "Feature importance", text: "Global Random Forest feature importance shows which measurements matter to the model overall." },
    { icon: ScanLine, title: "Supporting evidence", text: "Domain-direction rules identify measurements consistent with an interesting candidate." },
    { icon: FileSearch, title: "Cautionary evidence", text: "Odd/even differences, secondary events, variability, and other concerns remain in view." },
  ];
  return (
    <section className="landing-section evidence-section" id="workflow">
      <div className="landing-shell"><div className="landing-heading-grid"><div><p className="landing-kicker">Interpretation</p><h2>Evidence, not a black box.</h2></div><p>ExoVision presents the measurements and model context behind candidate screening. The goal is an inspectable assessment—not a label without scientific context.</p></div>
        <div className="evidence-list">{items.map(({ icon: Icon, title, text }, index) => <article key={title}><span>0{index + 1}</span><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div>
    </section>
  );
}
