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
      <main className="app-workspace intake-workspace">
        <header className="intake-header">
          <div>
            <div className="inline-flex items-center gap-2 rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] text-cyan-400 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
              Observation Ingestion · Pipeline v2.4
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
              <FileUp className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              Analyze Stellar Observation
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Provide a FITS, CSV, or TXT stellar light curve for Box Least Squares period searching and candidate screening.
            </p>
          </div>

          <div className="flex items-center">
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

        <UploadDropzone />

        <p className="intake-crosslink text-xs text-zinc-500 font-mono mt-4 text-center">
          Need another observation source?{" "}
          <Link href="/datasets" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            Search NASA MAST Archives
          </Link>
          , or{" "}
          <Link href="/demo" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            run the bundled demonstration
          </Link>
          .
        </p>
      </main>
    </ProtectedRoute>
  );
}
