import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { MetricsSection } from "@/components/landing/metrics-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { SecuritySection } from "@/components/landing/security-section";
import { DevelopersSection } from "@/components/landing/developers-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import {
  getPortfolioAwards,
  getPortfolioDataDiagnostics,
  getPortfolioExperience,
  getPortfolioHighlights,
  getPortfolioHero,
  getPortfolioProfile,
  getPortfolioProjects,
  getPortfolioSkills,
} from "@/lib/portfolio-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await getPortfolioProfile();
  const [hero, projects, experience, skillGroups, highlights, awards] = await Promise.all([
    getPortfolioHero(profile),
    getPortfolioProjects(),
    getPortfolioExperience(),
    getPortfolioSkills(),
    getPortfolioHighlights(),
    getPortfolioAwards(),
  ]);

  if (process.env.NODE_ENV === "development") {
    getPortfolioDataDiagnostics().then((diagnostics) => {
      if (diagnostics) {
        console.info("[portfolio-data] diagnostics", diagnostics);
      }
    });
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation profile={profile} />
      <HeroSection profile={profile} hero={hero} />
      <FeaturesSection />
      <HowItWorksSection experience={experience} />
      <InfrastructureSection projects={projects} />
      <MetricsSection highlights={highlights} />
      <IntegrationsSection profile={profile} skillGroups={skillGroups} />
      <SecuritySection />
      <DevelopersSection />
      <TestimonialsSection awards={awards} />
      <CtaSection profile={profile} />
      <FooterSection profile={profile} />
    </main>
  );
}
