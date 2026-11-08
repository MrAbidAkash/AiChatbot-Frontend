"use client";

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

// Static border component (replaces heavy AnimatedBorder)
function StaticBorder({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Static gradient border */}
      <div className="relative rounded-2xl p-[2px] overflow-hidden">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/30 via-accent/30 to-primary/30 opacity-70" />
        {/* Inner content */}
        <div className="relative rounded-[14px] bg-card">{children}</div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const typedText = "How can I help you today?";

  return (
    <section className="relative overflow-hidden py-20 lg:pb-40">
      {/* Background Effects - static, no transitions */}
      <div className="max-sm:hidden absolute inset-0 -z-10 overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.18_0.01_260/0.1)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.18_0.01_260/0.1)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_50%,transparent_100%)]" />
        {/* Static color blobs (smaller, no blur-heavy mix-blend) */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[80px] opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[80px] opacity-50" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content */}
          <div className="max-w-2xl">
            <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20">
              <Sparkles className="mr-2 h-3 w-3" />
              Powered by Advanced AI
            </Badge>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              5X Your Revenue{" "}
              <span className="gradient-text">with the Power of WhatsApp</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Build, deploy, and manage AI-powered chatbots across WhatsApp,
              Instagram, and Facebook. Train your AI with your own documents for
              context-aware, personalized customer interactions.
            </p>

            {/* Social Channels */}
            <div className="mt-8 flex flex-wrap gap-2">
              {socialChannels.map((channel) => (
                <Badge
                  key={channel.name}
                  variant="outline"
                  className={channel.color}
                >
                  {channel.name}
                </Badge>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <AuthButton
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              />
              <Button size="lg" variant="outline" className="gap-2">
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Interactive Demo */}
          <div className="relative">
            <StaticBorder className="shadow-2xl">
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
                      <p className="text-foreground">{typedText}</p>
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
                    className="rounded-full bg-primary text-primary-foreground"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </StaticBorder>

            {/* Floating Badge Cards - static, no float/ping animations */}
            <div className="absolute -left-4 -top-9 hidden rounded-lg border border-border bg-card/90 backdrop-blur-sm p-3 shadow-lg lg:block">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Instant Responses
                </span>
              </div>
            </div>

            <div className="absolute -right-4 -bottom-8 hidden rounded-lg border border-border bg-card/90 backdrop-blur-sm p-3 shadow-lg lg:block">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Enterprise Security
                </span>
              </div>
            </div>

            <div className="absolute -bottom-8 left-1/4 hidden rounded-lg border border-border bg-card/90 backdrop-blur-sm p-3 shadow-lg lg:block">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Multi-Channel
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
