"use client";

import { Database, FileUp, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { UploadDropzone } from "@/components/upload-dropzone";

export default function AnalyzePage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <main className="app-workspace max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-white/[0.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] text-cyan-400 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
              Observation Ingestion · Pipeline v2.4
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
              Analyze Stellar Observation
            </h1>
            <p className="mt-1 text-xs text-zinc-400 font-sans max-w-2xl">
              Provide a FITS, CSV, or TXT stellar light curve for Box Least Squares period searching and candidate screening.
            </p>
          </div>

          {/* Ingestion Source Switcher */}
          <div className="flex items-center shrink-0">
            <SegmentedControl<string>
              value="upload"
              onChange={(val) => {
                if (val === "datasets") router.push("/datasets");
                if (val === "demo") router.push("/demo");
              }}
              items={[
                { id: "upload", label: "File Upload", icon: FileUp },
                { id: "datasets", label: "NASA MAST", icon: Database },
                { id: "demo", label: "Synthetic Demo", icon: FlaskConical },
              ]}
            />
          </div>
        </header>

        {/* Primary Ingestion Workspace */}
        <UploadDropzone />

        {/* Quiet Footer Crosslink */}
        <p className="mt-8 text-center text-xs font-mono text-zinc-500">
          Need another observation source?{" "}
          <Link href="/datasets" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
            Search NASA MAST Archives
          </Link>
          , or{" "}
          <Link href="/demo" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
            run the synthetic demonstration
          </Link>
          .
        </p>
      </main>
    </ProtectedRoute>
  );
}
