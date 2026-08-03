import { ResultsDashboard } from "@/components/results/ResultsDashboard";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultsDashboard analysisId={id} />;
}
