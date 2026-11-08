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
  const overviewRef = useRef(null);
  const featuresRef = useRef(null);
  const integrationsRef = useRef(null);
  const dashboardRef = useRef(null);
  const trainingRef = useRef(null);
  const pricingRef = useRef(null);

  const scrollToSection = (ref: any) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="md:max-w-[90%] md:mx-auto px-4">
        <Header />
      </div>

      {/* Sticky Navigation */}
      <div className="sticky top-16 px-4 z-40 border-b bg-background w-full md:max-w-[90%] md:mx-auto">
        <div className="container mx-auto flex flex-wrap gap-3 sm:gap-10 px-4 py-2">
          <button
            onClick={() => scrollToSection(overviewRef)}
            className="hover:text-primary cursor-pointer text-sm text-muted-foreground transition-colors"
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection(featuresRef)}
            className="hover:text-primary cursor-pointer text-sm text-muted-foreground transition-colors"
          >
            ফিচারসমূহ
          </button>
          <button
            onClick={() => scrollToSection(integrationsRef)}
            className="hover:text-primary cursor-pointer text-sm text-muted-foreground transition-colors"
          >
            ইন্টিগ্রেশন
          </button>
          <button
            onClick={() => scrollToSection(dashboardRef)}
            className="hover:text-primary cursor-pointer text-sm text-muted-foreground transition-colors"
          >
            AI Desk
          </button>
          <button
            onClick={() => scrollToSection(trainingRef)}
            className="hover:text-primary cursor-pointer text-sm text-muted-foreground transition-colors"
          >
            AI ট্রেনিং
          </button>
          <button
            onClick={() => scrollToSection(pricingRef)}
            className="hover:text-primary cursor-pointer text-sm text-muted-foreground transition-colors"
          >
            মূল্য
          </button>
        </div>
      </div>

      <main>
        <section ref={overviewRef} className="px-4 md:max-w-[90%] md:mx-auto">
          <HeroSection />
        </section>

        <div className="section-divider" />

        <section
          ref={featuresRef}
          className="section-features section-noise px-4"
        >
          <FeaturesSection />
        </section>

        <div className="section-divider" />

        <section
          ref={integrationsRef}
          className="section-integrations section-noise px-4"
        >
          <IntegrationsSection />
        </section>

        <div className="section-divider" />

        <section
          ref={dashboardRef}
          className="section-dashboard section-noise px-4"
        >
          <DashboardPreview />
        </section>

        <div className="section-divider" />

        <section
          ref={trainingRef}
          className="section-training section-noise px-4"
        >
          <DocumentTrainingSection />
        </section>

        <div className="section-divider" />

        {/* Social Proof / Testimonials */}
        <section className="section-noise px-4">
          <SocialProofSection />
        </section>

        <div className="section-divider" />

        <section
          ref={pricingRef}
          className="section-pricing section-noise px-4"
        >
          <PricingSection />
        </section>
      </main>

      <Footer />
    </div>
  );
}
