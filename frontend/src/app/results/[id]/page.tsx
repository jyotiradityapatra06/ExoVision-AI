import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProtectedRoute><ResultsDashboard analysisId={id} /></ProtectedRoute>;
}
