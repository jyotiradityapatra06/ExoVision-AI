export function ConfidenceGauge({ value, label = "Random Forest score", compact = false }: { value: number; label?: string; compact?: boolean }) {
  const percent = Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
  return (
    <div className={`confidence-gauge${compact ? " confidence-gauge--compact" : ""}`}>
      <div className="confidence-gauge__readout"><span>{label}</span><strong>{percent.toFixed(1)}%</strong></div>
      <div className="confidence-gauge__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}><span style={{ width: `${percent}%` }} /></div>
      {!compact && <p>Screening score only — not a calibrated probability of planetary confirmation.</p>}
    </div>
  );
}
