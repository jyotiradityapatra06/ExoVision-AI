import { DataAndReportsSection, LandingFooter, TechnologySection, TransparencyAndCta } from "@/components/landing/ClosingSections";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingNav } from "@/components/landing/LandingNav";
import { ObservationSignalEvidence } from "@/components/landing/ObservationSignalEvidence";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { EvidenceSection, PipelineSection, ScienceSection } from "@/components/landing/ScienceSections";
import { ObservatoryBackground } from "@/components/observatory/ObservatoryBackground";

export default function HomePage() {
  return (
    <main className="landing-page">
      <ObservatoryBackground variant="landing" className="observatory-background-landing" />
      <LandingNav />
      <HeroSection />
      <ObservationSignalEvidence />
      <PipelineSection />
      <ProductShowcase />
      <ScienceSection />
      <EvidenceSection />
      <DataAndReportsSection />
      <TechnologySection />
      <TransparencyAndCta />
      <LandingFooter />
    </main>
  );
}
