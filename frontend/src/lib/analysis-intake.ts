import { api, ApiError } from "@/lib/api";

export const SUPPORTED_OBSERVATION_EXTENSIONS = [".fits", ".csv", ".txt"] as const;
export const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export type IntakeStage = "idle" | "downloading" | "uploading" | "starting";

export function validateObservationFile(file?: File): string | null {
  if (!file) return "Choose an observation file to continue.";
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!SUPPORTED_OBSERVATION_EXTENSIONS.includes(extension as typeof SUPPORTED_OBSERVATION_EXTENSIONS[number])) return "Unsupported format. Choose a FITS, CSV, or TXT light-curve file.";
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > DEFAULT_MAX_UPLOAD_BYTES) return "This file exceeds the default 25 MiB upload limit.";
  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function intakeError(error: unknown): string {
  if (!(error instanceof ApiError)) return "The observation could not be prepared. Please try again.";
  const detail = error.message.toLowerCase();
  if (error.status === 0) return "The ExoVision API could not be reached. Check your connection and try again.";
  if (error.status === 401) return "Your session has expired. Sign in again before starting an analysis.";
  if (error.status === 429 && (detail.includes("active analysis") || detail.includes("in progress") || detail.includes("current analysis"))) {
    return "You already have an analysis in progress. Open the active analysis or wait for it to finish before starting another.";
  }
  if (error.status === 429 && detail.includes("stored analysis quota")) {
    return "Your stored-analysis quota has been reached. Existing analyses remain available from the dashboard.";
  }
  if (error.status === 429) {
    if (typeof error.retryAfter === "number" && error.retryAfter > 0) {
      return `Rate limit reached. Please wait ${error.retryAfter} second${error.retryAfter === 1 ? "" : "s"} before trying again.`;
    }
    return "This request was rate limited. Wait briefly before trying again.";
  }
  if (detail.includes("stored data quota") || detail.includes("storage quota")) {
    return "Your observation storage quota has been reached. Existing analyses remain available.";
  }
  if (detail.includes("unsupported") || detail.includes("extension")) {
    return "This file format is not supported. Choose a FITS, CSV, or TXT light curve.";
  }
  if (detail.includes("byte limit") || detail.includes("too large") || detail.includes("exceeds")) {
    return "The observation exceeds the server upload limit.";
  }
  if (detail.includes("empty")) return "The selected observation file is empty.";
  if (detail.includes("enough valid")) return "The observation does not contain enough valid light-curve samples.";
  if (detail.includes("time") && detail.includes("flux")) {
    return "CSV and TXT observations must contain time and flux columns.";
  }
  if (detail.includes("sample") && (detail.includes("limit") || detail.includes("too many"))) {
    return "The observation contains too many samples for this deployment.";
  }
  if (detail.includes("malformed") || detail.includes("parse") || detail.includes("format")) {
    return "The observation could not be read as a valid light curve.";
  }
  if (detail.includes("classifier") || detail.includes("model")) {
    return "Candidate classification is temporarily unavailable.";
  }
  if (error.status === 502) {
    return "The NASA MAST archive is temporarily unavailable. Please retry shortly.";
  }
  if (error.status >= 500) {
    return "The observation service encountered an unexpected error. Please try again later.";
  }
  if (detail.includes("traceback") || detail.includes("exception") || detail.includes("file \"") || detail.includes("line ") || detail.includes("astropy") || detail.includes("lightkurve")) {
    return "The observation could not be analyzed safely.";
  }
  return error.message;
}

export async function startObservation(file: File, setStage: (stage: IntakeStage) => void) {
  setStage("uploading");
  const uploaded = await api.uploadLightcurve(file);
  setStage("starting");
  await api.startAnalysis(uploaded.analysis_id);
  return uploaded.analysis_id;
}
