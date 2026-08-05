"use client";

import { Download, FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/api";
import type { AnalysisHistoryItem } from "@/types/api";

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}

function ReportsContent() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    api
      .analysisHistory()
      .then((data) => {
        if (isSubscribed) {
          setHistory(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setHistory([]);
          setLoading(false);
        }
      });
    return () => {
      isSubscribed = false;
    };
  }, []);

  const filteredHistory = history.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDownload(id: string, filename: string) {
    try {
      const blob = await api.downloadReport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Report PDF generation failed.");
    }
  }

  function handleBibtexExport(item: AnalysisHistoryItem) {
    const bibtex = `@article{exovision_${item.id.slice(0, 8)},
  title={Candidate Analysis Report for Target ${item.filename}},
  author={ExoVision AI Autonomous Pipeline},
  journal={ExoVision Scientific Telemetry},
  year={2026},
  url={https://exovision.ai/results/${item.id}}
}`;
    const blob = new Blob([bibtex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.filename}_citation.bib`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="relative z-10 pt-24 pb-32 px-gutter md:px-margin max-w-max-width mx-auto">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-primary tracking-tight font-headline-lg">
            SCIENTIFIC REPORTS REGISTRY
          </h1>
          <p className="font-data-mono text-data-mono text-outline uppercase mt-1">
            Publication-grade AAS formatted candidate documentation
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80 font-data-mono text-data-mono">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            type="text"
            placeholder="Search report targets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/50 rounded-DEFAULT pl-9 pr-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(0,218,243,0.3)] transition-all placeholder:text-outline"
          />
        </div>
      </header>

      {/* Reports Table */}
      <div className="hud-border glass-panel corner-bracket-tl overflow-hidden">
        <div className="border-b border-outline-variant/30 p-4 bg-surface-dim/70 flex justify-between items-center font-data-mono text-data-mono">
          <span className="font-bold text-on-surface uppercase">GENERATED CANDIDATE DOSSIERS</span>
          <span className="text-primary font-bold">{filteredHistory.length} REPORTS REGISTERED</span>
        </div>

        <div className="overflow-x-auto p-4">
          {loading ? (
            <div className="p-12 text-center font-data-mono text-data-mono text-outline">
              Syncing scientific reports archive...
            </div>
          ) : filteredHistory.length ? (
            <table className="w-full text-left border-collapse font-data-mono text-[12px]">
              <thead>
                <tr className="border-b border-outline-variant/30 text-outline">
                  <th className="pb-3 pl-2 font-label-caps text-label-caps uppercase">Target Dataset</th>
                  <th className="pb-3 font-label-caps text-label-caps uppercase">Pipeline ID</th>
                  <th className="pb-3 font-label-caps text-label-caps uppercase">Status</th>
                  <th className="pb-3 text-right pr-2 font-label-caps text-label-caps uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="py-3.5 pl-2 text-primary font-bold">{item.filename}</td>
                    <td className="py-3.5 text-outline">{item.id}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold text-primary bg-primary/10 border border-primary/30 uppercase">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex justify-end gap-2 font-label-caps text-label-caps">
                        <button
                          onClick={() => handleDownload(item.id, item.filename)}
                          className="px-3 py-1 border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 transition-all flex items-center gap-1 font-bold"
                          type="button"
                        >
                          <Download className="h-3.5 w-3.5" /> PDF
                        </button>
                        <button
                          onClick={() => handleBibtexExport(item)}
                          className="px-3 py-1 border border-outline-variant text-outline hover:text-primary transition-all flex items-center gap-1"
                          type="button"
                        >
                          <FileText className="h-3.5 w-3.5" /> BibTeX
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center font-data-mono text-data-mono text-outline">
              No scientific reports found matching filter.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
