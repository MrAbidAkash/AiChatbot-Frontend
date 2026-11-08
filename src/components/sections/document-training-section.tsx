"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  RefreshCw,
  Package,
  Truck,
  CreditCard,
  Clock,
  RotateCcw,
  MessageSquare,
  FileText,
  Upload,
  ShoppingBag,
  CheckCircle2,
  Sliders,
  Layers,
} from "lucide-react";

const trainingCapabilities = [
  {
    icon: Package,
    title: "Product Catalog ও দাম",
    description: "আপনার পণ্যের সাইজ, রঙ, অফার ও স্টক স্ট্যাটাস সাধারণ ভাষায় লিখে দিন।",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Truck,
    title: "এরিয়াভিত্তিক ডেলিভারি চার্জ",
    description: "ঢাকার ভেতরে ৳৮০, ঢাকার বাইরে ৳১৫০ — যেভাবে চান সেভাবে নিয়ম সেট করুন।",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: CreditCard,
    title: "পেমেন্ট পলিসি ও COD",
    description: "ক্যাশ অন ডেলিভারি, বিকাশ অ্যাডভান্স বা যেকোনো পেমেন্ট শর্ত AI মেনে চলবে।",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    icon: RotateCcw,
    title: "রিটার্ন ও এক্সচেঞ্জ নিয়ম",
    description: "কত দিনের মধ্যে এক্সচেঞ্জ সম্ভব, ডেলিভারি ম্যানের সামনে চেক করার নিয়ম ইত্যাদি।",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Clock,
    title: "ওয়ার্কিং আওয়ার ও অফ-আওয়ার রিপ্লাই",
    description: "অফিসের সময় শেষ হলেও AI অর্ডার নিবে এবং কাস্টমারকে শিডিউল জানিয়ে দেবে।",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    icon: MessageSquare,
    title: "ব্র্যান্ড টোন ও ভাষার স্টাইল",
    description: "ফরমাল, ফ্রেন্ডলি কিংবা ভাইয়া/আপু সম্বোধন — আপনার ব্র্যান্ডের মতো কথা বলবে।",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
];

const sampleInstructions = `আমার Shop: Fatema Fashion House

১. Delivery Charge: ঢাকার ভেতরে ৳৮০, ঢাকার বাইরে ৳১৫০।
২. Return Policy: ৭ দিনের মধ্যে অক্ষত অবস্থায় এক্সচেঞ্জ প্রযোজ্য।
৩. Payment: ক্যাশ অন ডেলিভারি (COD)।
৪. কাস্টমারকে সবসময় "আপু/ভাইয়া" বলে সম্মান দিয়ে কথা বলবে।
৫. কেউ যদি ডিসকাউন্ট চায়: "আপু আমাদের সব প্রোডাক্ট রিজনেবল প্রাইসে রাখা হয়েছে, সাথে থাকছে প্রিমিয়াম কোয়ালিটি!"
৬. Stock শেষ হলে: "দুঃখিত আপু, এই সাইজটি শেষ হয়ে গেছে। আপনার নাম ও নম্বর রাখলে রিস্টক হলে জানাবো।"`;

export function DocumentTrainingSection() {
  const [instructions, setInstructions] = useState(sampleInstructions);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <section className="py-20 lg:py-32" id="training">
      <div className="container mx-auto px-4 md:max-w-[90%] md:mx-auto">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            AI ট্রেনিং
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            কোনো জটিল flow builder নেই।{" "}
            <span className="gradient-text">শুধু বলুন — AI শিখে নেবে</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            ManyChat-এর মতো জটিল বক্স ও লাইন টেনে মাথা নষ্ট করতে হবে না। Plain Bangla-তে আপনার
            ব্যবসার নিয়মকানুন লিখে দিন — AI হুবহু সেই নিয়মে কাস্টমারদের সাথে ডিল করবে।
          </p>
        </div>

        {/* Two-Column Training Interactive Showcase */}
        <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-12">
          {/* Left Column: Simulated Training Console */}
          <div className="lg:col-span-7">
            <Card className="h-full border-border bg-card shadow-xl flex flex-col">
              {/* Console Top Bar */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    prompt-rules.bn.txt
                  </span>
                </div>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  <Sliders className="mr-1.5 h-3 w-3" />
                  Live Rules Console
                </Badge>
              </div>

              {/* Console Editor Area */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>শপের নিয়মাবলী (বাংলা / বাংলিশে লিখুন):</span>
                    <span>বাংলা ইউনিকোড সাপোর্টেড</span>
                  </div>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={11}
                    className="w-full resize-none rounded-lg border border-border bg-muted/60 p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="এখানে আপনার শপের নিয়ম লিখে দিন..."
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-muted-foreground">
                      {isSaved ? "✅ নতুন নিয়ম সংরক্ষিত ও লাইভ হয়েছে!" : "AI বর্তমানে ৭টি সক্রিয় নিয়ম অনুসরণ করছে"}
                    </span>
                  </div>
                  <Button
                    onClick={handleSave}
                    className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSaved ? "animate-spin" : ""}`} />
                    {isSaved ? "নিয়ম আপডেট হচ্ছে..." : "নিয়ম আপডেট করুন"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: What Can You Teach */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="mb-2">
              <h3 className="text-xl font-bold text-foreground">কী কী শেখাতে পারবেন?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                মানুষ যেভাবে নতুন বিক্রয় প্রতিনিধিকে ট্রেনিং দেয়, ঠিক সেভাবেই AI-কে শিখিয়ে নিন।
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {trainingCapabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="flex items-start gap-3.5 rounded-xl border border-border bg-card/60 p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cap.bgColor}`}>
                    <cap.icon className={`h-4.5 w-4.5 ${cap.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{cap.title}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-normal">
                      {cap.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Document & Catalog Sync Options */}
        <div className="mt-20">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-foreground">
              অথবা আপনার ক্যাটালগ ও ফাইল আপলোড করুন
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              বড় ক্যাটালগ থাকলে সরাসরি ফাইল আপলোড করুন অথবা ওয়েবসাইট সিঙ্ক করে নিন
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="border-border bg-card p-6 transition-all hover:border-primary/50">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground">PDF বা Excel ক্যাটালগ</h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                আপনার প্রোডাক্ট লিস্ট, সাইজ চার্ট ও প্রাইস শিট সরাসরি PDF/Excel ফরম্যাটে আপলোড করুন।
              </p>
              <Badge variant="outline" className="mt-4 text-[11px] text-primary border-primary/30">
                PDF / XLSX / CSV
              </Badge>
            </Card>

            <Card className="border-border bg-card p-6 transition-all hover:border-primary/50">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground">WooCommerce / Shopify Sync</h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                আপনার ওয়েবসাইট কানেক্ট করুন। প্রোডাক্ট যোগ বা স্টক শেষ হলে AI স্বয়ংক্রিয়ভাবে আপডেট জেনে যাবে।
              </p>
              <Badge variant="outline" className="mt-4 text-[11px] text-pink-400 border-pink-500/30">
                1-Click Store Sync
              </Badge>
            </Card>

            <Card className="border-border bg-card p-6 transition-all hover:border-primary/50">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                <Layers className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground">ইমেজ ও ফটো গ্যালারি</h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                আপনার প্রতিটি প্রোডাক্টের ছবি আপলোড করুন যাতে কাস্টমার ছবি পাঠালে ভিশন AI চিনে দাম বলে দেয়।
              </p>
              <Badge variant="outline" className="mt-4 text-[11px] text-green-400 border-green-500/30">
                Vision AI Embeddings
              </Badge>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
