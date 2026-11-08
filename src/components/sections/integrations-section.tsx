"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageCircle,
  Instagram,
  Facebook,
  MessageSquare,
  Globe,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react"

const channels = [
  {
    id: "messenger",
    name: "Facebook Messenger",
    icon: Facebook,
    color: "bg-blue-600",
    textColor: "text-blue-400",
    description:
      "Messenger এ আসা সব customer query তে AI instant reply দেয় — ২৪/৭।",
    features: [
      "Auto reply to all messages",
      "COD order intake",
      "Human handover",
      "Quick reply buttons",
      "Product catalog answers",
    ],
  },
  {
    id: "instagram",
    name: "Instagram DM",
    icon: Instagram,
    color: "bg-gradient-to-br from-pink-500 to-purple-600",
    textColor: "text-pink-400",
    description:
      "Instagram DM এ order নেওয়া, product জানানো সব AI করে।",
    features: [
      "DM automation",
      "Story mention replies",
      "Comment-to-DM",
      "Product showcase",
      "Order confirmation",
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    color: "bg-green-600",
    textColor: "text-green-400",
    description:
      "WhatsApp এ customer দের সাথে সরাসরি কথা বলুন AI দিয়ে।",
    features: [
      "WhatsApp Business API",
      "Rich media support",
      "Voice note transcription",
      "COD order",
      "Delivery updates",
    ],
  },
  {
    id: "fb-comments",
    name: "FB Post Comments",
    icon: MessageSquare,
    color: "bg-orange-600",
    textColor: "text-orange-400",
    description:
      "Facebook post এর comment এ auto-reply দিয়ে customer কে inbox এ নিয়ে আসুন।",
    features: [
      "Auto comment reply",
      "Keyword triggers",
      "Move to inbox",
      "Spam filter",
      "Bulk comment management",
    ],
  },
  {
    id: "widget",
    name: "Website Widget",
    icon: Globe,
    color: "bg-purple-600",
    textColor: "text-purple-400",
    description:
      "আপনার website এ chat widget যোগ করুন instant support এর জন্য।",
    features: [
      "Embeddable widget",
      "Custom branding",
      "Proactive triggers",
      "Mobile responsive",
      "Lead capture",
    ],
  },
]

const connectSteps = [
  {
    step: "১",
    title: "Dashboard এ লগইন করুন",
    desc: "আপনার account তৈরি করুন",
  },
  {
    step: "২",
    title: "Facebook Page Connect করুন",
    desc: "Meta এর official permission দিয়ে নিরাপদে connect করুন",
  },
  {
    step: "৩",
    title: "AI চালু হয়ে যাবে",
    desc: "৫ মিনিটে আপনার page AI-powered হয়ে যাবে",
  },
]

const trustBadges = [
  "Official Meta API",
  "No Password Needed",
  "End-to-End Secure",
  "GDPR Compliant",
]

export function IntegrationsSection() {
  const [activeChannel, setActiveChannel] = useState("messenger")

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 md:max-w-[90%] md:mx-auto">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary">
            <Zap className="mr-2 h-3 w-3" />
            সংযোগ ও ইন্টিগ্রেশন
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            যেখানেই আপনার customer,{" "}
            <span className="gradient-text">সেখানেই</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Facebook Messenger, Instagram DM, WhatsApp, Facebook Post Comments — সব চ্যানেলে একসাথে AI চালু রাখুন।
          </p>
        </div>

        {/* Channel Cards Grid + Tabs */}
        <div className="mt-16">
          <Tabs value={activeChannel} onValueChange={setActiveChannel} className="w-full">
            {/* Tab Triggers */}
            <TabsList className="mx-auto flex h-auto w-full max-w-3xl flex-wrap justify-center gap-2 bg-transparent p-0">
              {channels.map((ch) => (
                <TabsTrigger
                  key={ch.id}
                  value={ch.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <ch.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{ch.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Channel Cards — 2-col mobile, 4-col desktop overview grid */}
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {channels.map((ch) => (
                <Card
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`cursor-pointer border-border bg-card transition-all duration-200 hover:border-primary/60 hover:shadow-lg hover:-translate-y-1 ${
                    activeChannel === ch.id ? "border-primary ring-1 ring-primary/30" : ""
                  }`}
                >
                  <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${ch.color}`}
                    >
                      <ch.icon className="h-6 w-6 text-white" />
                    </div>
                    <p className={`text-sm font-semibold ${ch.textColor}`}>
                      {ch.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tab Content Detail */}
            {channels.map((ch) => (
              <TabsContent key={ch.id} value={ch.id} className="mt-8">
                <Card className="overflow-hidden border-border bg-card">
                  <div className="grid lg:grid-cols-2">
                    {/* Platform Info */}
                    <CardContent className="p-8 lg:p-12">
                      <div
                        className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${ch.color}`}
                      >
                        <ch.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="mt-6 text-2xl font-bold text-foreground">
                        {ch.name}
                      </h3>
                      <p className="mt-3 text-muted-foreground leading-relaxed">
                        {ch.description}
                      </p>
                      <Button className="mt-8 gap-2 bg-primary text-primary-foreground">
                        Connect {ch.name.split(" ")[0]}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>

                    {/* Features List */}
                    <div className="border-t border-border bg-muted/50 p-8 lg:border-l lg:border-t-0 lg:p-12">
                      <h4 className="mb-6 text-lg font-semibold text-foreground">
                        মূল ফিচার সমূহ
                      </h4>
                      <ul className="space-y-4">
                        {ch.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ch.color}`}
                            >
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* How to Connect — 3-step stepper */}
        <div className="mt-20">
          <div className="mb-10 text-center">
            <h3 className="text-2xl font-bold text-foreground">
              কিভাবে Connect করবেন?
            </h3>
            <p className="mt-2 text-muted-foreground">
              মাত্র ৩টি ধাপে আপনার চ্যানেল AI-powered করুন
            </p>
          </div>

          <div className="relative grid gap-6 sm:grid-cols-3">
            {/* Connector line (desktop) */}
            <div
              aria-hidden
              className="absolute left-1/6 right-1/6 top-10 hidden h-px bg-border sm:block"
            />

            {connectSteps.map((s, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                {/* Step bubble */}
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                  <span className="text-2xl font-bold text-primary">{s.step}</span>
                </div>
                {/* Connector arrow between steps (mobile) */}
                {idx < connectSteps.length - 1 && (
                  <ArrowRight className="my-2 h-5 w-5 rotate-90 text-muted-foreground sm:hidden" />
                )}
                <h4 className="mt-4 font-semibold text-foreground">{s.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Meta Official Partner Trust Section */}
        <div className="mt-20">
          <Card className="border-primary/20 bg-card">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                {/* Icon */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                  <Shield className="h-10 w-10 text-primary" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-lg font-bold text-foreground">
                      ✅ Meta Verified API Partner
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    আমরা Meta এর official Business API ব্যবহার করি। আপনার Facebook Page এর password আমাদের কাছে থাকে না। সম্পূর্ণ নিরাপদ।
                  </p>

                  {/* Badge chips */}
                  <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                    {trustBadges.map((badge) => (
                      <Badge
                        key={badge}
                        className="border-primary/30 bg-primary/10 text-primary"
                      >
                        <Check className="mr-1.5 h-3 w-3" />
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
