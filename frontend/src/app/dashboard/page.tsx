"use client";

import { Activity, CircleDot, Clock3, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { AnalysisHistoryItem } from "@/types/api";

export default function DashboardPage() {
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
}

function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  useEffect(() => { api.analysisHistory().then(setHistory).catch(() => setHistory([])); }, []);
  const completed = history.filter((item) => item.status === "completed").length;
  return <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
    <PageHeader action={<Button href="/upload"><Upload className="h-4 w-4" />Upload light curve</Button>} description={`Welcome back, ${user?.display_name}. Review your private analysis workspace and scientific exports.`} eyebrow="Mission control" title="Analysis dashboard" />
    <section aria-label="Analysis statistics" className="mt-8 grid gap-4 md:grid-cols-3">
      <Stat icon={Activity} label="Total analyses" value={String(history.length)} />
      <Stat icon={CircleDot} label="Completed" value={String(completed)} />
      <Stat icon={FileText} label="Reports" value="On demand" />
    </section>
    <section className="mt-8"><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5"><div><h2 className="font-semibold text-white">Recent analyses</h2><p className="mt-1 text-sm text-slate-500">Your latest light-curve investigations</p></div><Clock3 className="h-5 w-5 text-slate-500" /></div>
      {history.length ? <div className="divide-y divide-white/[0.07]">{history.map((item) => <Link className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-white/[0.03]" href={`/results/${item.id}`} key={item.id}><div><p className="font-medium text-slate-200">{item.filename}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p></div><span className="rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-300">{item.status}</span></Link>)}</div> : <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"><Activity className="h-7 w-7 text-slate-500" /><h3 className="mt-4 font-medium text-slate-200">No analyses yet</h3><p className="mt-2 text-sm text-slate-500">Upload your first light curve to begin.</p></div>}
    </Card></section>
  </div>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return <Card className="p-6"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-400">{label}</p><Icon className="h-5 w-5 text-sky-300" /></div><p className="mt-5 text-3xl font-semibold text-white">{value}</p></Card>;
}
