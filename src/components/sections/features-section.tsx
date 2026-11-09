"use client";

import { useState } from "react";
import {
  MessageSquare,
  Camera,
  ShoppingBag,
  Mic,
  MessageCircle,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    id: 1,
    icon: MessageSquare,
    title: "বাংলা, Banglish ও English এ পারদর্শী",
    badge: "স্মার্ট NLP",
    color: "text-primary",
    bgColor: "bg-primary/10",
    description:
      "কাস্টমার যেভাবে খুশি লিখুক — 'dam koto bhai', 'অফার আছে কি?' কিংবা 'Show me red color' — AI মানুষের মতো স্বাভাবিকভাবে সঠিক উত্তর দেয়।",
  },
  {
    id: 2,
    icon: Camera,
    title: "ছবি দেখে ইনস্ট্যান্ট প্রোডাক্ট ম্যাচিং",
    badge: "Vision AI",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    description:
      "স্ক্রিনশট বা জামাকাপড়/গ্যাজেটের ছবি পাঠালেই AI আপনার ক্যাটালগ সার্চ করে প্রডাক্টের সাইজ, দাম ও লাইভ স্টক নিশ্চিত করে।",
  },
  {
    id: 3,
    icon: ShoppingBag,
    title: "স্বয়ংক্রিয় ক্যাশ অন ডেলিভারি (COD)",
    badge: "অটো চেকআউট",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    description:
      "চ্যাটবক্সেই নাম, মোবাইল নম্বর ও ঠিকানা সংগ্রহ করে এরিয়া অনুযায়ী ডেলিভারি চার্জ যোগ করে অর্ডার কনফার্ম করে।",
  },
  {
    id: 4,
    icon: Mic,
    title: "অডিও ও ভয়েস নোট লিসেনিং",
    badge: "Voice-to-Text",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    description:
      "মেসেঞ্জারে কাস্টমারদের পাঠানো ভয়েস মেসেজ শুনে AI স্বয়ংক্রিয়ভাবে টেক্সটে রূপান্তর করে এবং যথাযথ উত্তর দেয়।",
  },
  {
    id: 5,
    icon: MessageCircle,
    title: "পোস্ট কমেন্ট টু ইনবক্স কনভার্সন",
    badge: "Lead Booster",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    description:
      "ফেসবুক পোস্টের কমেন্টে 'দাম কত?' জানতে চাইলে মুহূর্তেই রিপ্লাই দিয়ে কাস্টমারকে সরাসরি ইনবক্সে ডেকে আনে।",
  },
  {
    id: 6,
    icon: Users,
    title: "টিম ইনবক্স ও ১-ক্লিক টেকওভার",
    badge: "Human Handover",
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
    description:
      "স্পেশাল কোনো কাস্টমার বা জটিল প্রশ্নে যেকোনো সময় একজন মানুষ চ্যাটে ঢুকতে পারেন, প্রয়োজন শেষে AI পুনরায় সচল হয়।",
  },
];

const steps = [
  {
    number: "০১",
    title: "ফেসবুক পেজ কানেক্ট করুন",
    description: "মাত্র ২ মিনিটে Meta এর অফিসিয়াল সিকিউর API দিয়ে আপনার পেজ লিংক করুন",
  },
  {
    number: "০২",
    title: "শপের নিয়ম ও প্রাইস লিস্ট দিন",
    description: "ডেলিভারি চার্জ, পলিসি ও প্রোডাক্টের বিবরণ সাধারণ বাংলায় বা ফাইলে লিখে দিন",
  },
  {
    number: "০৩",
    title: "নিশ্চিন্তে গ্রোথে মনোযোগ দিন",
    description: "ChatTime AI দিন-রাত ২৪ ঘণ্টা আপনার সেলস ও সাপোর্ট সম্পূর্ণ নিখুঁতভাবে চালাবে",
  },
];

const comparisonRows = [
  { feature: "বাংলিশ ও আঞ্চলিক ভাষা বোঝে", keywordBot: false, ourAI: true },
  { feature: "ছবি দেখে প্রোডাক্ট ও স্টক মেলায়", keywordBot: false, ourAI: true },
  { feature: "অটোমেটিক COD অর্ডার ইনভয়েস", keywordBot: false, ourAI: true },
  { feature: "গ্রাহকের ভয়েস নোট বোঝে", keywordBot: false, ourAI: true },
  { feature: "১-ক্লিকে টিম টেকওভার", keywordBot: false, ourAI: true },
  {
    feature: "সেটআপ ও কনফিগারেশন সময়",
    keywordBot: "কয়েক দিন",
    ourAI: "১০ মিনিট",
    isText: true,
  },
];

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16 space-y-4">
          <Badge
            variant="outline"
            className="border-primary/40 text-primary bg-primary/10 px-4 py-1.5 text-sm font-medium"
          >
            ChatTime AI পাওয়ারফুল ফিচারস
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            কাস্টমারের প্রতিটি ইনকোয়ারিকে{" "}
            <span className="gradient-text">সরাসরি অর্ডারে রূপান্তর করুন</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            কোনো জটিল ফ্লোচার্ট বা কিওয়ার্ড রুল নয়। ChatTime AI কাস্টমারের ভাষা বোঝে, ছবি চিনে স্টক জানায় এবং চোখের পলকে সেলস ক্লোজ করে।
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-24">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            return (
              <Card
                key={feature.id}
                className={`relative group cursor-pointer border transition-all duration-300 ${
                  isActive
                    ? "border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/40 hover:shadow-md"
                } bg-card shadow-xs`}
                onMouseEnter={() => setActiveFeature(feature.id)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${feature.bgColor} transition-all duration-300 group-hover:scale-110`}
                    >
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium shrink-0"
                    >
                      {feature.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-3">
                    {feature.title}
                  </h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>

                {/* Active glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-primary/3 pointer-events-none" />
                )}
              </Card>
            );
          })}
        </div>

        {/* How it works */}
        <div className="mb-24">
          <div className="text-center mb-12 space-y-3">
            <Badge
              variant="outline"
              className="border-primary/40 text-primary bg-primary/10 px-4 py-1.5 text-sm font-medium"
            >
              সহজ সেটআপ
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              কিভাবে কাজ করে?
            </h3>
          </div>

          <div className="relative flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-0">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative flex flex-col lg:flex-1 items-center text-center group"
              >
                {/* Connector line (desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent z-0" />
                )}

                {/* Step circle */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center mb-5 group-hover:border-primary/70 group-hover:bg-primary/20 transition-all duration-300">
                  <span className="text-primary font-bold text-lg">
                    {step.number}
                  </span>
                </div>

                <div className="px-4">
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>

                {/* Mobile connector */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden w-px h-8 bg-gradient-to-b from-primary/40 to-transparent mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div>
          <div className="text-center mb-10 space-y-3">
            <Badge
              variant="outline"
              className="border-primary/40 text-primary bg-primary/10 px-4 py-1.5 text-sm font-medium"
            >
              তুলনা করুন
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              Traditional Keyword Bot vs{" "}
              <span className="gradient-text">Intelligent AI Agent</span>
            </h3>
          </div>

          <Card className="border-border overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="text-left px-6 py-4 font-semibold text-foreground w-1/2">
                      Feature
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-muted-foreground w-1/4">
                      সাধারণ কিওয়ার্ড বট
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-primary w-1/4">
                      ChatTime AI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr
                      key={index}
                      className={`border-b border-border/30 transition-colors duration-150 ${
                        index % 2 === 0
                          ? "bg-transparent"
                          : "bg-muted/20"
                      } hover:bg-muted/30`}
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.isText ? (
                          <span className="text-muted-foreground">
                            {row.keywordBot}
                          </span>
                        ) : (
                          <span
                            className={
                              row.keywordBot
                                ? "text-green-400 text-lg"
                                : "text-red-400 text-lg"
                            }
                          >
                            {row.keywordBot ? "✅" : "❌"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.isText ? (
                          <span className="text-primary font-semibold">
                            {row.ourAI}
                          </span>
                        ) : (
                          <span
                            className={
                              row.ourAI
                                ? "text-green-400 text-lg"
                                : "text-red-400 text-lg"
                            }
                          >
                            {row.ourAI ? "✅" : "❌"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
