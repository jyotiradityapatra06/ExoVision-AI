export type ApiHealth = {
  status: "healthy";
  service: string;
  phase: string;
};

export type ModelInfo = {
  model: string;
  version: string;
  classes: string[];
  features_count: number;
  features: string[];
};

export type ApiErrorPayload = {
  detail: string | Array<{ loc: Array<string | number>; msg: string; type: string }>;
};

export type UploadResponse = {
  analysis_id: string;
  filename: string;
  status: "uploaded";
};

export type AnalysisResponse = {
  analysis_id: string;
  status: "processing" | "completed" | "failed";
  stage: AnalysisStage;
  message: string;
  retryable: boolean;
};

export type AnalysisStage = "ready" | "preparing_observation" | "analyzing_lightcurve" | "classifying_candidate" | "preparing_results" | "completed" | "failed";

export type AnalysisStatus = {
  analysis_id: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  progress: number;
  stage: AnalysisStage;
  message: string;
  retryable: boolean;
  error: string | null;
};

export type LightCurveData = {
  time: number[];
  flux: number[];
  sample_count: number;
};

export type TransitData = {
  detected: boolean;
  period: number | null;
  epoch: number | null;
  duration: number | null;
  depth: number | null;
  snr: number | null;
  phase: number[];
  flux: number[];
};

export type CandidateResult = {
  rank: number;
  candidate_id: string;
  classification: string;
  confidence: number;
  period: number | null;
  depth: number | null;
  snr: number | null;
  explanation: {
    positive_factors?: string[];
    negative_factors?: string[];
    summary?: string;
    feature_importance?: Array<{ feature: string; importance: number; direction: string }>;
  };
};

export type DatasetSearchResult = {
  target_name: string;
  mission: string;
  observation_period: string;
  format: "FITS";
  filename: string;
  data_uri: string;
  size_bytes: number;
};

export type AnalysisResult = {
  analysis_id: string;
  summary: {
    status?: string;
    candidate_count?: number;
    sample_count?: number;
    pipeline_status?: string;
  };
  lightcurve: LightCurveData;
  transit: TransitData;
  candidates: CandidateResult[];
};

export type ReportResponse = {
  analysis_id: string;
  status: "generated";
  filename: string;
  download_url: string;
};

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
};

export type AnalysisHistoryItem = {
  id: string;
  filename: string;
  status: string;
  created_at: string;
};

export type AnalysisSummaryItem = AnalysisHistoryItem & {
  stage: AnalysisStage;
  updated_at: string;
  processing_started_at: string | null;
  safe_error: string | null;
  candidate_detected: boolean | null;
  classification: string | null;
  model_score: number | null;
  period_days: number | null;
  depth: number | null;
  duration_days: number | null;
  transit_snr: number | null;
};

export type AnalysisHistoryPage = {
  items: AnalysisSummaryItem[];
  counts: { total: number; completed: number; processing: number; failed: number };
  total: number;
  limit: number;
  offset: number;
};
