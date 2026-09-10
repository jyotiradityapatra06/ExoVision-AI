"use client";
import Link from "next/link";
import { FileUp } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ObservationSources } from "@/components/observation-sources";
import { UploadDropzone } from "@/components/upload-dropzone";

export default function LocalUploadPage() {
  return <ProtectedRoute><main className="app-workspace intake-workspace">
    <header className="intake-header"><div><p className="workspace-kicker">Analysis / Local observation</p><h1><FileUp aria-hidden="true" /> Upload Observation</h1><p>Provide a FITS, CSV, or TXT stellar light curve for candidate screening.</p></div><ObservationSources current="/upload/local" /></header>
    <UploadDropzone /><p className="intake-crosslink">Need another source? <Link href="/datasets">Search NASA MAST</Link>, or <Link href="/demo">run the bundled demo</Link>.</p>
  </main></ProtectedRoute>;
}
