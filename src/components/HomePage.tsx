/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef } from "react";
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
  const overviewRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const integrationsRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const trainingRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <div className="md:max-w-[90%] md:mx-auto px-4">
        <Header />
      </div>

      {/* Sticky Navigation Sub-bar */}
      <div className="sticky top-16 px-4 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md w-full md:max-w-[90%] md:mx-auto transition-colors">
        <div className="container mx-auto flex flex-wrap gap-2 sm:gap-6 px-2 sm:px-4 py-2.5">
          <button
            onClick={() => scrollToSection(overviewRef)}
            className="hover:text-primary cursor-pointer text-xs sm:text-sm font-medium text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection(featuresRef)}
            className="hover:text-primary cursor-pointer text-xs sm:text-sm font-medium text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
          >
            ফিচারসমূহ
          </button>
          <button
            onClick={() => scrollToSection(integrationsRef)}
            className="hover:text-primary cursor-pointer text-xs sm:text-sm font-medium text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
          >
            ইন্টিগ্রেশন
          </button>
          <button
            onClick={() => scrollToSection(dashboardRef)}
            className="hover:text-primary cursor-pointer text-xs sm:text-sm font-medium text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
          >
            AI Desk
          </button>
          <button
            onClick={() => scrollToSection(trainingRef)}
            className="hover:text-primary cursor-pointer text-xs sm:text-sm font-medium text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
          >
            AI ট্রেনিং
          </button>
          <button
            onClick={() => scrollToSection(pricingRef)}
            className="hover:text-primary cursor-pointer text-xs sm:text-sm font-medium text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
          >
            মূল্য ও রিচার্জ
          </button>
        </div>
      </div>

      <main className="divide-y divide-border/60">
        <div ref={overviewRef} className="px-4 md:max-w-[90%] md:mx-auto">
          <HeroSection />
        </div>

        <div ref={featuresRef} className="px-4 md:max-w-[90%] md:mx-auto">
          <FeaturesSection />
        </div>

        <div ref={integrationsRef} className="px-4 md:max-w-[90%] md:mx-auto">
          <IntegrationsSection />
        </div>

        <div ref={dashboardRef} className="px-4 md:max-w-[90%] md:mx-auto">
          <DashboardPreview />
        </div>

        <div ref={trainingRef} className="px-4 md:max-w-[90%] md:mx-auto">
          <DocumentTrainingSection />
        </div>

        {/* Social Proof / Testimonials */}
        <div className="px-4 md:max-w-[90%] md:mx-auto">
          <SocialProofSection />
        </div>

        <div ref={pricingRef} className="px-4 md:max-w-[90%] md:mx-auto">
          <PricingSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
