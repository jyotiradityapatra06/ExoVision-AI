"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UploadDropzone } from "@/components/upload-dropzone";

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <main className="relative z-10 pt-24 pb-12 px-gutter max-w-max-width mx-auto min-h-screen flex flex-col items-center justify-center">
        {/* Header */}
        <header className="text-center mb-12 w-full max-w-4xl">
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4 drop-shadow-[0_0_15px_rgba(0,218,243,0.4)]">
            Observatory Data Upload
          </h1>
          <p className="font-data-mono text-data-mono text-on-surface-variant uppercase tracking-widest">
            Initialize FITS/CSV pipeline sequence
          </p>
        </header>

        {/* Main Interface Grid */}
        <UploadDropzone />
      </main>
    </ProtectedRoute>
  );
}
