"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthButton from "@/components/auth-button";
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  Bot,
  Zap,
  Shield,
  Globe,
  Play,
} from "lucide-react";

const HeroBubbles = dynamic(
  () => import("@/components/hero-bubbles").then((mod) => mod.HeroBubbles),
  { ssr: false },
);

const stats = [
  { value: "5k+", label: "Messages Processed" },
  { value: "10+", label: "Active Businesses" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "3+", label: "Countries" },
];

const socialChannels = [
  { name: "WhatsApp", color: "bg-green-500/20 text-green-400" },
  { name: "Instagram", color: "bg-pink-500/20 text-pink-400" },
  { name: "Facebook", color: "bg-blue-500/20 text-blue-400" },
  { name: "Telegram", color: "bg-sky-500/20 text-sky-400" },
];

// Animated border component
function AnimatedBorder({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Outer glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary via-accent to-primary opacity-20 blur-xl animate-pulse" />

      {/* Animated border container */}
      <div className="relative rounded-2xl p-[2px] overflow-hidden">
        {/* Rotating gradient border */}
        <div className="absolute inset-0 rounded-2xl">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                "conic-gradient(from var(--border-angle, 0deg) at 50% 50%, oklch(0.70 0.18 180), oklch(0.68 0.16 330), oklch(0.65 0.20 280), oklch(0.70 0.18 180))",
              animation: "rotate-border 4s linear infinite",
            }}
          />
        </div>

        {/* Inner content */}
        <div className="relative rounded-[14px] bg-card">{children}</div>
      </div>

      {/* Corner accents */}
      <div className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-primary/60 blur-sm animate-pulse" />
      <div
        className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent/60 blur-sm animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-accent/60 blur-sm animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-primary/60 blur-sm animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  );
}

export function HeroSection() {
  const [typedText, setTypedText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const fullText = "How can I help you today?";
  const sectionRef = useRef<HTMLElement>(null);

  // Loading animation sequence
  useEffect(() => {
    const loadTimer = setTimeout(() => setIsLoaded(true), 100);
    const contentTimer = setTimeout(() => setShowContent(true), 300);
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  // Typing animation
  useEffect(() => {
    if (!showContent) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [showContent]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 lg:pb-40">
      {/* Background Effects */}
      <div
        className={`max-sm:hidden absolute inset-0 -z-10 overflow-hidden transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Animated floating bubble canvas with enhanced configuration */}
        <HeroBubbles
          bubbleCount={22}
          minRadius={30}
          maxRadius={180}
          speed={0.7}
          mouseInteraction={true}
          mouseRadius={220}
          colorTheme="mixed"
          opacity={1}
          enableGlow={true}
          enableDepth={true}
          enableConnections={true}
          connectionDistance={160}
          enableParticles={true}
          particleCount={35}
          enableMouseTrail={true}
        />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.18_0.01_260/0.2)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.18_0.01_260/0.2)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_50%,transparent_100%)]" />

        {/* Radial vignette */}
        <div className="absolute inset-0 [background:radial-gradient(ellipse_90%_80%_at_50%_40%,transparent_30%,oklch(0.05_0.005_260)_100%)]" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-accent/10 blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 right-1/3 h-32 w-32 rounded-full bg-primary/5 blur-2xl animate-float-slow" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ">
          {/* Left Column - Content */}
          <div className="max-w-2xl">
            <Badge
              className={`mb-6 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-700 ${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <Sparkles className="mr-2 h-3 w-3" />
              Powered by Advanced AI
            </Badge>

            <h1
              className={`text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl transition-all duration-700 delay-100${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              5X Your Revenue{" "}
              <span className="gradient-text">with the Power of WhatsApp</span>
            </h1>

            <p
              className={`mt-6 text-lg leading-relaxed text-muted-foreground transition-all duration-700 delay-200 ${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              Build, deploy, and manage AI-powered chatbots across WhatsApp,
              Instagram, and Facebook. Train your AI with your own documents for
              context-aware, personalized customer interactions.
            </p>

            {/* Social Channels */}
            <div
              className={`mt-8 flex flex-wrap gap-2 transition-all duration-700 delay-300 ${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              {socialChannels.map((channel, index) => (
                <Badge
                  key={channel.name}
                  variant="outline"
                  className={`${channel.color} transition-all duration-500`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  {channel.name}
                </Badge>
              ))}
            </div>

            {/* CTA Buttons */}
            <div
              className={`mt-8 flex flex-col gap-4 sm:flex-row transition-all duration-700 delay-500 ${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <AuthButton
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform"
              />
              <Button
                size="lg"
                variant="outline"
                className="gap-2 hover:scale-105 transition-transform"
              >
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div
              className={`mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4 transition-all duration-700 delay-700 ${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="transition-all duration-500"
                  style={{ transitionDelay: `${800 + index * 100}ms` }}
                >
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Right Column - Interactive Demo */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              showContent
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            <AnimatedBorder className="shadow-2xl">
              <div className="p-6">
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      ChatTime Assistant
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Online • Powered by AI
                    </p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="mt-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-3">
                      <p className="text-foreground">
                        {typedText}
                        <span className="animate-pulse">|</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <div className="rounded-2xl rounded-tr-none bg-primary px-4 py-3">
                      <p className="text-primary-foreground">
                        {"I'd like to know about your return policy"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-3">
                      <p className="text-foreground">
                        {
                          "Our return policy allows returns within 30 days of purchase. Would you like me to help you start a return?"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Replies */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Start a return
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Track my order
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Contact support
                  </Button>
                </div>

                {/* Input */}
                <div className="mt-4 flex gap-2">
                  <div className="flex flex-1 items-center rounded-full border border-border bg-muted px-4 py-2">
                    <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Type a message...
                    </span>
                  </div>
                  <Button
                    size="icon"
                    className="rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AnimatedBorder>

            {/* Floating Cards with staggered animations */}
            <div
              className={`absolute -left-4 -top-9 hidden rounded-lg border border-border bg-card/90 backdrop-blur-sm p-3 shadow-lg lg:block animate-float transition-all duration-700 delay-700 ${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Zap className="h-4 w-4 text-primary" />
                  <div className="absolute inset-0 h-4 w-4 animate-ping text-primary opacity-30">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  Instant Responses
                </span>
              </div>
            </div>

            <div
              className={`absolute -right-4 -bottom-8 hidden rounded-lg border border-border bg-card/90 backdrop-blur-sm p-3 shadow-lg lg:block animate-float-delayed transition-all duration-700 delay-1000 ${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Shield className="h-4 w-4 text-primary" />
                  <div className="absolute inset-0 h-4 w-4 animate-pulse text-primary opacity-50">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  Enterprise Security
                </span>
              </div>
            </div>

            <div
              className={`absolute -bottom-8 left-1/4 hidden rounded-lg border border-border bg-card/90 backdrop-blur-sm p-3 shadow-lg lg:block animate-float-slow transition-all duration-700 delay-[1200ms] ${
                showContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Globe
                    className="h-4 w-4 text-primary animate-spin"
                    style={{ animationDuration: "8s" }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Multi-Channel
                </span>
              </div>
            </div>
          </div>{" "}
        </div>
      </div>
    </section>
  );
}
