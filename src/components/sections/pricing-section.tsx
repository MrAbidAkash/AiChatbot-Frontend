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
    name: "স্টার্টার প্যাক",
    price: "৳৫০০",
    replies: "~১,০০০ কাস্টমার রিপ্লাই",
    icon: <Zap className="h-5 w-5 text-primary" />,
    bonus: null,
    popular: false,
    features: [
      "Messenger + Instagram + WhatsApp",
      "অটো COD অর্ডার কনফার্মেশন",
      "পোস্ট কমেন্ট অটো-রিপ্লাই",
      "টিম ইনবক্স ও হ্যান্ডওভার",
      "ক্রেডিটের কোনো এক্সপায়ারি নেই",
    ],
    cta: "রিচার্জ করুন",
    planKey: "starter",
  },
  {
    name: "গ্রোথ প্যাক",
    price: "৳১,০০০",
    replies: "~২,২০০ রিপ্লাই",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    bonus: "১০% বোনাস ক্রেডিট",
    popular: true,
    features: [
      "সব চ্যানেল সাপোর্ট",
      "আনলিমিটেড ফেসবুক পেজ কানেক্ট",
      "অটোমেটিক COD ইনভয়েস",
      "Vision AI (ছবি চিনে প্রোডাক্ট ম্যাচ)",
      "ভয়েস মেসেজ ট্রান্সক্রিপশন",
      "রিয়েল-টাইম টিম ইনবক্স",
      "লাইভ সাপোর্ট ও অনবোর্ডিং",
      "কোনো মেয়াদ সীমাবদ্ধতা নেই",
    ],
    cta: "রিচার্জ করুন",
    planKey: "growth",
  },
  {
    name: "বিজনেস স্কেল",
    price: "৳৫,০০০",
    replies: "~১২,০০০ রিপ্লাই",
    icon: <CreditCard className="h-5 w-5 text-primary" />,
    bonus: "২০% বোনাস ক্রেডিট",
    popular: false,
    features: [
      "সব গ্রোথ ফিচার অন্তর্ভুক্ত",
      "আনলিমিটেড ফেসবুক পেজ পরিচালনা (Unlimited FB Pages)",
      "প্রাইওরিটি কাস্টমার সাপোর্ট",
      "কাস্টম ব্র্যান্ড টোন ও প্রম্পট",
      "অ্যাডভান্সড সেলস অ্যানালিটিক্স",
      "API ও ওয়েবহুক ইন্টিগ্রেশন",
      "আনলিমিটেড ভ্যালিডিটি",
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
    question: "রিচার্জ করা ক্রেডিট কি মেয়াদ শেষ হলে নষ্ট হয়ে যাবে?",
    answer:
      "না, ChatTime AI-তে ক্রেডিটের কোনো এক্সপায়ারি নেই। আপনার ব্যালেন্স যতদিন ইচ্ছা জমা থাকবে এবং ব্যবহৃত রিপ্লাই অনুযায়ী কাটবে।",
  },
  {
    question: "পেমেন্ট কীভাবে করা যায়?",
    answer:
      "সরাসরি দেশীয় বিকাশ (bKash), নগদ (Nagad) কিংবা লোকাল ব্যাংক ট্রান্সফারের মাধ্যমে সহজেই ব্যালেন্স যোগ করতে পারবেন।",
  },
  {
    question: "একটি অ্যাকাউন্ট থেকে কয়টি ফেসবুক পেজ কানেক্ট করা যাবে?",
    answer:
      "ChatTime AI-তে পেজ সংখ্যার কোনো সীমা নেই! আপনি সম্পূর্ণ ফ্রিতে যত খুশি আনলিমিটেড ফেসবুক পেজ (Unlimited Facebook Pages) কানেক্ট করতে পারবেন এবং প্রতিটির জন্য আলাদা ক্যাটালগ ও রুলস সেট করতে পারবেন।",
  },
  {
    question: "প্রয়োজনে কি নিজে কাস্টমারের সাথে কথা বলা যাবে?",
    answer:
      "অবশ্যই। টিম ইনবক্স থেকে যেকোনো মুহূর্তে ১-ক্লিকে চ্যাট নিজের নিয়ন্ত্রণে নিতে পারবেন। আপনার রিপ্লাই শেষ হলে AI আবার অটোমেটিক চালু হবে।",
  },
  {
    question: "আমার ফেসবুক পেজের নিরাপত্তা নিয়ে কি কোনো ঝুঁকি আছে?",
    answer:
      "বিন্দুমাত্র না। আমরা Meta-এর অফিশিয়াল Graph API ব্যবহার করি। আপনার পেজ বা ফেসবুক আইডির কোনো পাসওয়ার্ড আমাদের কখনোই দিতে হয় না।",
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
            স্বচ্ছ ও ফ্লেক্সিবল প্রাইসিং
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            যতটুকু বিক্রি করবেন,{" "}
            <span className="gradient-text">ততটুকুই খরচ হবে</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            কোনো বাধ্যতামূলক মাসিক ফি নেই, কোনো আন্তর্জাতিক কার্ডের ঝামেলা নেই।
            ChatTime AI-তে বিকাশ ও নগদ দিয়ে প্রিপেইড রিচার্জ করুন — ক্রেডিটের মেয়াদ কখনো শেষ হয় না।
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
                    বিনামূল্যে শুরু করুন ChatTime AI
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    নতুন অ্যাকাউন্ট খুললেই পাচ্ছেন ফ্রি ট্রায়াল ক্রেডিট — ক্রেডিট কার্ড ছাড়াই
                    সম্পূর্ণ সেটআপ করুন এবং সব প্রিমিয়াম ফিচার পরখ করে দেখুন।
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <a href="/signup">ফ্রি অ্যাকাউন্ট তৈরি করুন</a>
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
                  আজই শুরু করুন কাস্টমার সাপোর্ট অটোমেশন
                </h3>
                <p className="mt-2 text-muted-foreground">
                  ফ্রি ট্রায়াল ক্রেডিট দিয়ে এখুনি শুরু করুন। কোনো ক্রেডিট কার্ডের প্রয়োজন নেই।
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-4">
                <Button variant="outline" size="lg" asChild>
                  <a href="#features">ফিচারস দেখুন</a>
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
