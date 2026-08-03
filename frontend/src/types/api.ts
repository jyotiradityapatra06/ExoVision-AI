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
  status: "completed";
  candidate_count: number;
};

export type AnalysisStatus = {
  analysis_id: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  progress: number;
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
  };
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
