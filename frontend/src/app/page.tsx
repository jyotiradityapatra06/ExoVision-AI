import { StarfieldBackground } from "@/components/StarfieldBackground";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { MissionStats } from "@/components/landing/MissionStats";
import { AIInsightSection } from "@/components/landing/AIInsightSection";
import { DashboardShowcase } from "@/components/landing/DashboardShowcase";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { ApplicationsSection } from "@/components/landing/ApplicationsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      <StarfieldBackground />
      <HeroSection />
      <TrustSection />
      <FeatureCards />
      <MissionStats />
      <AIInsightSection />
      <DashboardShowcase />
      <WorkflowSection />
      <ApplicationsSection />
      <CTASection />
    </main>
  );
}
