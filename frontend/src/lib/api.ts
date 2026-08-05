import { getStoredToken } from "@/lib/auth";
import type { AnalysisHistoryItem, AnalysisResponse, AnalysisResult, AnalysisStatus, ApiErrorPayload, ApiHealth, AuthResponse, AuthUser, DatasetSearchResult, ModelInfo, ReportResponse, UploadResponse } from "@/types/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const token = getStoredToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    const detail = typeof payload?.detail === "string" ? payload.detail : "The ExoVision API request failed.";
    throw new ApiError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

async function downloadFile(path: string, fallbackName: string): Promise<File> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new ApiError(response.status, typeof payload?.detail === "string" ? payload.detail : "Dataset download failed.");
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? fallbackName;
  return new File([await response.blob()], filename, { type: "application/fits" });
}

export const api = {
  health: (init?: RequestInit) => request<ApiHealth>("/api/v1/health", { ...init, cache: "no-store" }),
  modelInfo: () => request<ModelInfo>("/api/v1/ml/info", { cache: "no-store" }),
  uploadLightcurve: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<UploadResponse>("/api/v1/upload/lightcurve", { method: "POST", body });
  },
  startAnalysis: (analysisId: string) => request<AnalysisResponse>(`/api/v1/analyze/${encodeURIComponent(analysisId)}`, { method: "POST" }),
  analysisStatus: (analysisId: string) => request<AnalysisStatus>(`/api/v1/analyze/${encodeURIComponent(analysisId)}/status`, { cache: "no-store" }),
  getAnalysisResult: (analysisId: string) => request<AnalysisResult>(`/api/v1/results/${encodeURIComponent(analysisId)}`, { cache: "no-store" }),
  generateReport: (analysisId: string) => request<ReportResponse>(`/api/v1/reports/${encodeURIComponent(analysisId)}`, { method: "POST" }),
  reportDownloadUrl: (analysisId: string) => `${API_URL}/api/v1/reports/${encodeURIComponent(analysisId)}/download`,
  register: (email: string, displayName: string, password: string) => request<AuthResponse>("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ email, display_name: displayName, password }) }),
  login: (email: string, password: string) => request<AuthResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<AuthUser>("/api/v1/auth/me", { cache: "no-store" }),
  analysisHistory: () => request<AnalysisHistoryItem[]>("/api/v1/analyze", { cache: "no-store" }),
  downloadReport: async (analysisId: string) => {
    const token = getStoredToken();
    const response = await fetch(`${API_URL}/api/v1/reports/${encodeURIComponent(analysisId)}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new ApiError(response.status, "The scientific report could not be downloaded.");
    return response.blob();
  },
  searchDatasets: (target: string, mission: "all" | "kepler" | "tess") => request<DatasetSearchResult[]>(`/api/v1/datasets/search?target=${encodeURIComponent(target)}&mission=${mission}`, { cache: "no-store" }),
  downloadDataset: (dataUri: string, filename: string) => downloadFile(`/api/v1/datasets/download?data_uri=${encodeURIComponent(dataUri)}`, filename),
  downloadDemoDataset: () => downloadFile("/api/v1/datasets/demo", "exoplanet_demo_transit.fits"),
};
