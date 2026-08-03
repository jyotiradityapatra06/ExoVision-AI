import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";

import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { UploadDropzone } from "@/components/upload-dropzone";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function UploadPage() {
  return (
    <ProtectedRoute><div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <PageHeader eyebrow="New analysis" title="Upload a light curve" description="Prepare a photometric time series for the ExoVision transit-analysis workflow." />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <UploadDropzone />
        <Card className="p-6">
          <h2 className="font-semibold text-white">File requirements</h2>
          <ul className="mt-5 space-y-5 text-sm text-slate-400">
            <li className="flex gap-3"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /><span><strong className="block text-slate-200">Supported formats</strong>FITS, CSV, and TXT</span></li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /><span><strong className="block text-slate-200">Expected measurements</strong>Time, flux, and optional flux error</span></li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" /><span><strong className="block text-slate-200">Local processing</strong>Files and results stay in local analysis storage</span></li>
          </ul>
        </Card>
      </div>
    </div></ProtectedRoute>
  );
}
