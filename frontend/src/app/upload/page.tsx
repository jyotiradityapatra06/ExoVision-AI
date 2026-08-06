"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UploadDropzone } from "@/components/upload-dropzone";

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <main className="app-workspace min-h-screen">
        {/* Header */}
        <header className="mb-8 w-full border-b border-white/[0.08] pb-8">
          <p className="workspace-kicker">Virtual telescope / observation deck</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">ExoVision Observatory</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Explore astronomical targets and analyze stellar observations.</p>
        </header>

        {/* Main Interface Grid */}
        <UploadDropzone />
      </main>
    </ProtectedRoute>
  );
}
