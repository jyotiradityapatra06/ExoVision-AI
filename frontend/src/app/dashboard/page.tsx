import { Activity, ArrowUpRight, CircleDot, Clock3, Upload } from "lucide-react";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { PageHeader } from "@/components/page-header";

const stats = [
  { label: "Total analyses", value: "—", note: "Awaiting first upload", icon: Activity },
  { label: "Planet candidates", value: "—", note: "No classifications yet", icon: CircleDot },
  { label: "Median confidence", value: "—", note: "Available after analysis", icon: ArrowUpRight },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <PageHeader eyebrow="Mission control" title="Analysis dashboard" description="A central view for light-curve investigations, classification outcomes, and recent scientific work." action={<Button href="/upload"><Upload className="h-4 w-4" />Upload light curve</Button>} />
      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Analysis statistics">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <stat.icon className="h-5 w-5 text-sky-300" aria-hidden="true" />
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-white">{stat.value}</p>
            <p className="mt-2 text-xs text-slate-500">{stat.note}</p>
          </Card>
        ))}
      </section>
      <section className="mt-8">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
            <div><h2 className="font-semibold text-white">Recent analyses</h2><p className="mt-1 text-sm text-slate-500">Your latest light-curve investigations</p></div>
            <Clock3 className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400"><Activity className="h-5 w-5" /></span>
            <h3 className="mt-4 font-medium text-slate-200">No analyses yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Upload your first Kepler or TESS light curve to begin building your research history.</p>
            <Button href="/upload" variant="secondary" className="mt-6">Prepare an upload</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
