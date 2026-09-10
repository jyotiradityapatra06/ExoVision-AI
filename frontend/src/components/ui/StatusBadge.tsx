import { AlertTriangle, CheckCircle2, LoaderCircle, Orbit } from "lucide-react";

type Status = "processing" | "candidate" | "non-detection" | "failed" | "completed";
const labels: Record<Status, string> = { processing: "Pipeline processing", candidate: "Orbital candidate flag", "non-detection": "No transit detected", failed: "Execution failed", completed: "Analysis completed" };

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const Icon = status === "processing" ? LoaderCircle : status === "candidate" ? Orbit : status === "completed" ? CheckCircle2 : AlertTriangle;
  return <span className={`dso-status dso-status--${status}`} role="status"><Icon className={status === "processing" ? "animate-spin" : ""} aria-hidden="true" /><span>{label ?? labels[status]}</span></span>;
}
