"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AuthButton from "@/components/auth-button";
import PricingButton from "@/components/pricing-button";
import { Check, Sparkles, Zap, Gift, CreditCard, HelpCircle } from "lucide-react";

const rechargePackages = [
  {
    name: "স্টার্টার রিচার্জ",
    price: "৳৫০০",
    replies: "~৫০০ রিপ্লাই",
    icon: <Zap className="h-5 w-5 text-primary" />,
    bonus: null,
    popular: false,
    features: [
      "Messenger + Instagram + WhatsApp",
      "COD Order নেওয়া",
      "Comment Auto-reply",
      "Human Handover",
      "৬ মাস মেয়াদ",
    ],
    cta: "রিচার্জ করুন",
    planKey: "starter",
  },
  {
    name: "প্রফেশনাল রিচার্জ",
    price: "৳১,০০০",
    replies: "~১,১০০ রিপ্লাই",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    bonus: "১০% বোনাস",
    popular: true,
    features: [
      "সব চ্যানেল",
      "COD Order + Invoice",
      "Vision AI (ছবি চেনা)",
      "Voice Note",
      "Team Inbox",
      "Human Handover",
      "১ বছর মেয়াদ",
    ],
    cta: "রিচার্জ করুন",
    planKey: "professional",
  },
  {
    name: "বিজনেস রিচার্জ",
    price: "৳৫,০০০",
    replies: "~৬,০০০ রিপ্লাই",
    icon: <CreditCard className="h-5 w-5 text-primary" />,
    bonus: "২০% বোনাস",
    popular: false,
    features: [
      "সব প্রফেশনাল ফিচার",
      "Priority Support",
      "Custom AI Persona",
      "Advanced Analytics",
      "API Access",
      "কোনো মেয়াদ নেই",
    ],
    cta: "রিচার্জ করুন",
    planKey: "business",
  },
];

const paymentMethods = [
  { emoji: "🟢", name: "bKash" },
  { emoji: "🔵", name: "Nagad" },
  { emoji: "🏦", name: "Bank Transfer" },
];

const faqs = [
  {
    question: "Credit কতদিন থাকে?",
    answer:
      "Credit এর কোনো expiry নেই, যতদিন আপনার account থাকবে ততদিন থাকবে।",
  },
  {
    question: "কিভাবে রিচার্জ করব?",
    answer:
      "Dashboard থেকে bKash, Nagad, বা Bank Transfer এ রিচার্জ করা যায়। ৫-১০ মিনিটে active হয়।",
  },
  {
    question: "কতটি page কানেক্ট করা যাবে?",
    answer:
      "একটি account থেকে multiple Facebook page কানেক্ট করা যায়।",
  },
  {
    question: "Human handover কিভাবে কাজ করে?",
    answer:
      "Team inbox থেকে যেকোনো conversation এ ক্লিক করে AI pause করে নিজে reply করুন। কাজ শেষে AI আবার চালু হবে।",
  },
  {
    question: "Meta compliant কি?",
    answer:
      "হ্যাঁ, আমরা Meta এর official API ব্যবহার করি। আপনার page সম্পূর্ণ নিরাপদ।",
  },
];

export function PricingSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 md:max-w-[90%] md:mx-auto">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="mr-2 h-3 w-3" />
            মূল্য পরিকল্পনা
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            কোনো মাসিক ফি নেই। শুধু{" "}
            <span className="gradient-text">ব্যবহার করুন,</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Pay-as-you-go model — রিচার্জ করুন, ব্যবহার করুন। কোনো বাধ্যতামূলক
            সাবস্ক্রিপশন নেই। বাংলাদেশের সেরা পেমেন্ট পদ্ধতিতে রিচার্জ করুন।
          </p>
        </div>

        {/* Free Trial Banner */}
        <div className="mt-12">
          <div className="relative rounded-2xl border border-green-500/40 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 p-8">
            <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/20">
                  <Gift className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    ৭ দিন বিনামূল্যে ব্যবহার করুন
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    ৳৫০ ফ্রি ক্রেডিট — কোনো ক্রেডিট কার্ড দরকার নেই। ৭ দিন সব
                    ফিচার ব্যবহার করুন।
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <a href="/signup">ফ্রি ট্রায়াল শুরু করুন</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Recharge Packages */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {rechargePackages.map((pkg) => (
            <Card
              key={pkg.name}
              className={`relative border-border bg-card ${
                pkg.popular ? "ring-2 ring-primary" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    সবচেয়ে জনপ্রিয়
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pkg.icon}
                    <CardTitle className="text-lg text-foreground">
                      {pkg.name}
                    </CardTitle>
                  </div>
                  {pkg.bonus && (
                    <Badge className="border-green-500/30 bg-green-500/10 text-green-400">
                      {pkg.bonus}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      {pkg.price}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pkg.replies}
                  </p>
                </div>

                <PricingButton
                  planName={pkg.planKey}
                  className={`mb-6 w-full gap-2 ${
                    pkg.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  variant={pkg.popular ? "default" : "secondary"}
                />

                <ul className="space-y-3">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-12 text-center">
          <p className="mb-6 text-sm font-medium text-muted-foreground">
            পছন্দের পেমেন্ট পদ্ধতিতে রিচার্জ করুন
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="flex items-center gap-2 rounded-full border border-border bg-muted px-5 py-2.5"
              >
                <span className="text-lg">{method.emoji}</span>
                <span className="text-sm font-medium text-foreground">
                  {method.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">
                সাধারণ প্রশ্নাবলী
              </h3>
            </div>
            <p className="text-muted-foreground">
              আপনার মনে যা প্রশ্ন আছে, উত্তর এখানেই আছে।
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="rounded-xl border border-border bg-card px-6"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-20">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-between gap-6 p-8 text-center lg:flex-row lg:p-12 lg:text-left">
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  আজই শুরু করুন — ৭ দিন বিনামূল্যে
                </h3>
                <p className="mt-2 text-muted-foreground">
                  ৳৫০ ফ্রি ক্রেডিট দিয়ে সব ফিচার পরীক্ষা করুন। কোনো ক্রেডিট
                  কার্ড দরকার নেই।
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-4">
                <Button variant="outline" size="lg" asChild>
                  <a href="#features">বিস্তারিত জানুন</a>
                </Button>
                <AuthButton
                  size="lg"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
