/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { IntegrationsSection } from "@/components/sections/integrations-section";
import { DashboardPreview } from "@/components/sections/dashboard-preview";
import { DocumentTrainingSection } from "@/components/sections/document-training-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { SocialProofSection } from "@/components/sections/social-proof-section";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function ProductDesignOutline() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <div className="md:max-w-[90%] md:mx-auto px-4">
        <Header />
      </div>

      <main className="divide-y divide-border/60">
        <div id="overview" className="px-4 md:max-w-[90%] md:mx-auto">
          <HeroSection />
        </div>

        <div id="features" className="px-4 md:max-w-[90%] md:mx-auto">
          <FeaturesSection />
        </div>

        <div id="integrations" className="px-4 md:max-w-[90%] md:mx-auto">
          <IntegrationsSection />
        </div>

        <div id="dashboard" className="px-4 md:max-w-[90%] md:mx-auto">
          <DashboardPreview />
        </div>

        <div id="training" className="px-4 md:max-w-[90%] md:mx-auto">
          <DocumentTrainingSection />
        </div>

        {/* Social Proof / Testimonials */}
        <div id="testimonials" className="px-4 md:max-w-[90%] md:mx-auto">
          <SocialProofSection />
        </div>

        <div id="pricing" className="px-4 md:max-w-[90%] md:mx-auto">
          <PricingSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
