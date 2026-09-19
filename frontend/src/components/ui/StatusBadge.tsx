import { AlertCircle, CheckCircle2, Database, LoaderCircle, MinusCircle, Orbit } from "lucide-react";

type Status = "ready" | "processing" | "candidate" | "non-detection" | "failed" | "completed";

const labels: Record<Status, string> = {
  ready: "Ready for analysis",
  processing: "Pipeline processing",
  candidate: "Orbital candidate flag",
  "non-detection": "No transit detected",
  failed: "Execution failed",
  completed: "Analysis completed",
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const Icon =
    status === "ready"
      ? Database
      : status === "processing"
        ? LoaderCircle
      : status === "candidate"
        ? Orbit
        : status === "completed"
          ? CheckCircle2
          : status === "non-detection"
            ? MinusCircle
            : AlertCircle;

  return (
    <span className={`dso-status dso-status--${status}`} role="status">
      <Icon className={`h-3 w-3 shrink-0 ${status === "processing" ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{label ?? labels[status]}</span>
    </span>
  );
}

