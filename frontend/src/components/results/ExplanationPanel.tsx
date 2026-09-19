import { CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

import type { CandidateResult } from "@/types/api";

export function ExplanationPanel({ candidate }: { candidate?: CandidateResult }) {
  if (!candidate) {
    return (
      <div className="results-evidence-panel">
        <div className="results-panel-title">
          <div>
            <h3>Candidate Evidence & Assessment</h3>
            <p>Algorithmic verification and machine-learning screening factors</p>
          </div>
          <Sparkles className="h-4 w-4 text-slate-500" />
        </div>
        <p className="results-narrative text-slate-500">
          No periodic transit signal was detected or submitted to the Random Forest screening classifier.
        </p>
      </div>
    );
  }

  const positive = candidate.explanation.positive_factors ?? [];
  const negative = candidate.explanation.negative_factors ?? [];

  return (
    <div className="results-evidence-panel" aria-labelledby="evidence-heading">
      <div className="results-panel-title">
        <div>
          <h3 id="evidence-heading">Candidate Evidence & Factors</h3>
          <p>Features evaluated by the Random Forest candidate screening pipeline</p>
        </div>
        <Sparkles className="h-4 w-4" />
      </div>

      {candidate.explanation.summary && (
        <p className="results-narrative">
          {candidate.explanation.summary}
        </p>
      )}

      <div className="results-evidence-cols">
        {/* Supporting Evidence */}
        <div className="results-evidence-box results-evidence-box-support">
          <div className="results-evidence-box-header">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Supporting Evidence ({positive.length})</span>
          </div>
          <ul className="results-evidence-list">
            {positive.length > 0 ? (
              positive.map((factor) => (
                <li key={factor}>{factor}</li>
              ))
            ) : (
              <li className="text-slate-500">No supporting factors recorded.</li>
            )}
          </ul>
        </div>

        {/* Cautionary Evidence */}
        <div className="results-evidence-box results-evidence-box-caution">
          <div className="results-evidence-box-header">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <span>Cautionary Evidence ({negative.length})</span>
          </div>
          <ul className="results-evidence-list">
            {negative.length > 0 ? (
              negative.map((factor) => (
                <li key={factor}>{factor}</li>
              ))
            ) : (
              <li className="text-slate-500">No cautionary factors recorded.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
