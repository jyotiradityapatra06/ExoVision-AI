"use client";

import Link from "next/link";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ObservationSources } from "@/components/observation-sources";
import { UploadDropzone } from "@/components/upload-dropzone";

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <main className="app-workspace intake-workspace">
        <header className="intake-header">
          <div>
            <p className="workspace-kicker">Analysis / New observation</p>
            <h1>Analyze an observation</h1>
            <p>Upload a stellar light curve and screen it for periodic transit-like signals.</p>
          </div>
          <ObservationSources current="/upload" />
        </header>
        <UploadDropzone />
        <p className="intake-crosslink">
          Don&apos;t have a light curve? <Link href="/datasets">Search NASA MAST</Link>, or <Link href="/demo">run the bundled demo</Link>.
        </p>
      </main>
    </ProtectedRoute>
  );
}
