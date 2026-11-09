"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PricingButton from "@/components/pricing-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Check, Sparkles, Zap, CreditCard, ShieldCheck } from "lucide-react";

const plans = [
  {
    name: "ফ্রি ট্রায়াল",
    key: "Free",
    description: "টাকা ছাড়াই সরাসরি নিজের ফেসবুক পেজে টেস্ট করুন",
    price: "৳০",
    period: "৫০টি ফ্রি রিপ্লাই",
    features: [
      "৫০ টি সম্পূর্ণ ফ্রি AI রিপ্লাই",
      "Facebook Page ইন্টিগ্রেশন (১-ক্লিক)",
      "শপ ক্যাটালগ ও রুলস ট্রেনিং",
      "লাইভ AI টেস্ট কনসোল",
      "কোনো ক্রেডিট কার্ড বা বিকাশ দরকার নেই",
    ],
    popular: false,
    bonus: null,
  },
  {
    name: "স্টার্টার প্যাক",
    key: "Starter",
    description: "ছোট বা মাঝারি পেজের জন্য সাশ্রয়ী রিচার্জ প্যাক",
    price: "৳৫০০",
    period: "~১,০০০ কাস্টমার রিপ্লাই",
    features: [
      "১,০০০ টি কাস্টমার মেসেজ রিপ্লাই (৫০ পয়সা/রিপ্লাই)",
      "অটোমেটিক ক্যাশ অন ডেলিভারি (COD) অর্ডার",
      "পেজ পোস্ট কমেন্ট অটো-রিপ্লাই",
      "টিম ইনবক্স ও ম্যানুয়াল চ্যাট হ্যান্ডওভার",
      "ক্রেডিটের কোনো মেয়াদ সীমাবদ্ধতা নেই (No Expiry)",
    ],
    popular: false,
    bonus: null,
  },
  {
    name: "গ্রোথ প্যাক",
    key: "Growth",
    description: "ক্রমবর্ধমান সেলস ও দ্রুত ব্যবসার জন্য সেরা পছন্দ",
    price: "৳১,০০০",
    period: "~২,২০০ রিপ্লাই (১০% বোনাস)",
    features: [
      "২,২০০ টি কাস্টমার মেসেজ রিপ্লাই",
      "১০% বোনাস ক্রেডিট (২০০ টি ফ্রি রিপ্লাই)",
      "Vision AI (কাস্টমারের পাঠানো ছবি চিনে প্রোডাক্ট ম্যাচ)",
      "ভয়েস মেসেজ শোনা ও ট্রান্সক্রিপশন",
      "রিয়েল-টাইম টিম ইনবক্স",
      "প্রায়োরিটি অনবোর্ডিং ও সাপোর্ট",
      "ক্রেডিটের কোনো এক্সপায়ারি নেই",
    ],
    popular: true,
    bonus: "১০% বোনাস ক্রেডিট",
  },
  {
    name: "বিজনেস স্কেল",
    key: "Business",
    description: "হাই-ভলিউম বড় শপ ও মাল্টিপল পেজের জন্য",
    price: "৳৫,০০০",
    period: "~১২,০০০ রিপ্লাই (২০% বোনাস)",
    features: [
      "১২,০০০ টি কাস্টমার মেসেজ রিপ্লাই",
      "২০% বোনাস ক্রেডিট (২,০০০ টি ফ্রি রিপ্লাই)",
      "একাধিক ফেসবুক পেজ একই ড্যাশবোর্ড থেকে পরিচালনা",
      "কাস্টম সেলস স্ক্রিপ্ট ও স্পেশাল ব্যান্ডউইথ",
      "VIP ডেডিকেটেড সাপোর্ট",
      "ক্রেডিটের কোনো মেয়াদ সীমাবদ্ধতা নেই",
    ],
    popular: false,
    bonus: "২০% বোনাস ক্রেডিট",
  },
];

const faqs = [
  {
    question: "রিচার্জ করা ব্যালেন্স কি মেয়াদ শেষ হলে কেটে যাবে?",
    answer:
      "না! ChatTime AI-তে আপনার রিচার্জ করা ক্রেডিটের কোনো এক্সপায়ারি বা মেয়াদ নেই। ব্যালেন্স আপনার ওয়ালেটে সবসময় জমা থাকবে এবং প্রতি কাস্টমার মেসেজ অনুযায়ী কাটবে।",
  },
  {
    question: "পেমেন্ট কীভাবে করা যায়?",
    answer:
      "সরাসরি দেশীয় বিকাশ (bKash) পেমেন্ট গেটওয়ের মাধ্যমে মাত্র ১ ক্লিকে নিরাপদভাবে ওয়ালেট রিচার্জ করতে পারবেন। পেমেন্ট সফল হওয়ার সাথে সাথেই ব্যালেন্স যোগ হবে।",
  },
  {
    question: "একটি অ্যাকাউন্ট থেকে একাধিক ফেসবুক পেজ চালানো যাবে কি?",
    answer:
      "হ্যাঁ, একটি ChatTime AI ড্যাশবোর্ড থেকেই আপনি একাধিক ফেসবুক পেজ যুক্ত করতে পারবেন এবং প্রতিটি পেজের জন্য আলাদা নিয়মাবলী ও ক্যাটালগ সেট করতে পারবেন।",
  },
  {
    question: "প্রয়োজনে কি নিজে কাস্টমারের সাথে কথা বলা যাবে?",
    answer:
      "অবশ্যই! আমাদের 'কাস্টমার ইনবক্স' থেকে আপনি যেকোনো মুহূর্তে ম্যানুয়ালি রিপ্লাই দিতে পারবেন। আপনি চ্যাট করলে AI সাময়িকভাবে পজ থাকবে এবং আপনার কথা শেষ হলে আবার সক্রিয় হবে।",
  },
  {
    question: "অটোমেটিক COD অর্ডার কীভাবে কনফার্ম হয়?",
    answer:
      "কাস্টমার যখন প্রোডাক্ট নিতে চায়, AI স্বয়ংক্রিয়ভাবে তার নাম, সম্পূর্ণ ঠিকানা ও সচল মোবাইল নম্বর চেয়ে নেয় এবং ডেলিভারি চার্জসহ মোট বিল হিসাব করে অর্ডার কনফার্ম করে।",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-primary/5 via-background to-background py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>সহজ ও স্বচ্ছ ক্রেডিট-ভিত্তিক মূল্যতালিকা</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              কোনো হিডেন চার্জ নেই,{" "}
              <span className="text-primary">যত মেসেজ তত খরচ</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              কোনো ফিক্সড মাসিক চার্জ নেই। বিকাশ দিয়ে রিচার্জ করুন, প্রতি রিপ্লাই মাত্র ৫০ পয়সা। আজীবনের জন্য ক্রেডিট জমা থাকবে।
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                ৫০টি ফ্রি রিপ্লাই ট্রায়াল
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                বিকাশ ইনস্ট্যান্ট রিচার্জ
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                মেয়াদের কোনো শেষ নেই
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col justify-between border-border/80 bg-card transition-all ${
                  plan.popular
                    ? "border-2 border-primary shadow-lg ring-1 ring-primary/20"
                    : "shadow-2xs hover:border-primary/40"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-xs">
                      <Zap className="h-3 w-3" />
                      সবচেয়ে জনপ্রিয়
                    </span>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    {plan.bonus && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        {plan.bonus}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs min-h-[32px] mt-1">
                    {plan.description}
                  </CardDescription>

                  <div className="mt-4 pt-2 border-t border-border/40">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-foreground font-mono">
                        {plan.price}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-between space-y-6 pt-2">
                  <ul className="space-y-2.5 text-xs">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-border/40">
                    <PricingButton
                      planName={plan.key}
                      className="w-full text-xs h-9 shadow-2xs font-semibold"
                      variant={plan.popular ? "default" : "outline"}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secure Payment Assurance */}
          <div className="mt-12 rounded-2xl border border-border/80 bg-muted/20 p-5 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  ১০০% নিরাপদ bKash পেমেন্ট গেটওয়ে
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  অফিসিয়াল বিকাশ টোকেনাইজড পেমেন্টের মাধ্যমে ইনস্ট্যান্ট ওয়ালেট রিচার্জ।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="border-pink-500/30 text-pink-600 bg-pink-500/10 text-xs">
                bKash
              </Badge>
              <Badge variant="outline" className="border-orange-500/30 text-orange-600 bg-orange-500/10 text-xs">
                Nagad
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              রিচার্জ ও পেমেন্ট সম্পর্কিত যেকোনো প্রশ্নের উত্তর
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-border/80 bg-card p-5 shadow-2xs"
              >
                <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                  {faq.question}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 sm:p-12 text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              এখনই নিজের ফেসবুক পেজে টেস্ট করুন
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              কোনো ক্রেডিট কার্ড ছাড়াই প্রথম ৫০টি রিপ্লাই সম্পূর্ণ ফ্রি ট্রায়াল নিন।
            </p>
            <div className="pt-2">
              <Button asChild className="text-xs font-semibold h-9 px-6 bg-primary text-primary-foreground">
                <Link href="/dashboard">ড্যাশবোর্ডে প্রবেশ করুন →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
