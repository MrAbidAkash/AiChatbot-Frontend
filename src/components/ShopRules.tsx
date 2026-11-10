"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  Check,
  Truck,
  RotateCcw,
  CreditCard,
  Bot,
  Info,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function ShopRules() {
  const [insideDhakaCharge, setInsideDhakaCharge] = useState("80");
  const [outsideDhakaCharge, setOutsideDhakaCharge] = useState("150");
  const [freeDeliveryOver, setFreeDeliveryOver] = useState("2000");
  const [deliveryDays, setDeliveryDays] = useState("১-৩ কার্যদিবস");
  const [returnDays, setReturnDays] = useState("৭ দিন");
  const [returnConditions, setReturnConditions] = useState(
    "পণ্য ও ট্যাগ অক্ষত থাকতে হবে, ডেলিভারিম্যানের সামনে চেক করে নিতে হবে।"
  );
  const [codEnabled, setCodEnabled] = useState(true);
  const [brandTone, setBrandTone] = useState<"friendly" | "formal" | "casual">("friendly");
  const [customRules, setCustomRules] = useState(
    "কাস্টমার ডিসকাউন্ট চাইলে বলবে: 'আপু/ভাইয়া আমাদের সব প্রোডাক্ট রিজনেবল প্রাইসে রাখা হয়েছে এবং প্রিমিয়াম কোয়ালিটি নিশ্চিত করা হয়!' স্টক শেষ হলে বিনয়ের সাথে জানিয়ে কাস্টমারের ফোন নম্বর চেয়ে রাখবে।"
  );
  const [savingRules, setSavingRules] = useState(false);
  const [loadingRules, setLoadingRules] = useState(true);

  // Load existing store policies on mount
  useEffect(() => {
    let isMounted = true;
    const fetchExistingRules = async () => {
      try {
        setLoadingRules(true);
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          const rulesDoc = (data.documents || []).find(
            (d: any) => d.title === "Store Delivery & Policy Rules"
          );
          if (rulesDoc && isMounted) {
            if (rulesDoc.metadata) {
              const m = rulesDoc.metadata;
              if (m.insideDhakaCharge !== undefined) setInsideDhakaCharge(String(m.insideDhakaCharge));
              if (m.outsideDhakaCharge !== undefined) setOutsideDhakaCharge(String(m.outsideDhakaCharge));
              if (m.freeDeliveryOver !== undefined) setFreeDeliveryOver(String(m.freeDeliveryOver));
              if (m.deliveryDays !== undefined) setDeliveryDays(String(m.deliveryDays));
              if (m.returnDays !== undefined) setReturnDays(String(m.returnDays));
              if (m.returnConditions !== undefined) setReturnConditions(String(m.returnConditions));
              if (m.codEnabled !== undefined) setCodEnabled(Boolean(m.codEnabled));
              if (m.brandTone) setBrandTone(m.brandTone);
              if (m.customRules !== undefined) setCustomRules(String(m.customRules));
            } else if (rulesDoc.content) {
              const content = rulesDoc.content;
              const insideMatch = content.match(/ঢাকার ভেতরে:\s*৳?(\d+)/);
              if (insideMatch) setInsideDhakaCharge(insideMatch[1]);
              const outsideMatch = content.match(/ঢাকার বাইরে:\s*৳?(\d+)/);
              if (outsideMatch) setOutsideDhakaCharge(outsideMatch[1]);
              const freeMatch = content.match(/ফ্রি ডেলিভারি:\s*৳?(\d+)/);
              if (freeMatch) setFreeDeliveryOver(freeMatch[1]);
              const daysMatch = content.match(/আনুমানিক ডেলিভারি সময়:\s*(.*)/);
              if (daysMatch) setDeliveryDays(daysMatch[1].trim());
              const returnDaysMatch = content.match(/সময়সীমা:\s*(.*)/);
              if (returnDaysMatch) setReturnDays(returnDaysMatch[1].trim());
              const condMatch = content.match(/শর্তাবলী:\s*(.*)/);
              if (condMatch) setReturnConditions(condMatch[1].trim());
              const codMatch = content.match(/ক্যাশ অন ডেলিভারি \(COD\):\s*(চালু আছে|বন্ধ)/);
              if (codMatch) setCodEnabled(codMatch[1] === "চালু আছে");
              if (content.includes("আপু/ভাইয়া সম্বোধন")) setBrandTone("friendly");
              else if (content.includes("ফরমাল ও মার্জিত")) setBrandTone("formal");
              const customMatch = content.match(/৫\.\s*বিশেষ নিয়মাবলী ও নির্দেশনা:\s*([\s\S]*)/);
              if (customMatch && customMatch[1].trim()) setCustomRules(customMatch[1].trim());
            }
          }
        }
      } catch (err) {
        console.error("Failed to load existing rules:", err);
      } finally {
        if (isMounted) setLoadingRules(false);
      }
    };

    fetchExistingRules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save Store Policies to API
  const handleSavePolicies = async () => {
    try {
      setSavingRules(true);
      const policyContent = `--- শপের সাধারণ নিয়মাবলী ও পলিসি ---
১. ডেলিভারি চার্জ:
- ঢাকার ভেতরে: ৳${insideDhakaCharge}
- ঢাকার বাইরে: ৳${outsideDhakaCharge}
- ফ্রি ডেলিভারি: ৳${freeDeliveryOver} বা তার বেশি অর্ডারে
- আনুমানিক ডেলিভারি সময়: ${deliveryDays}

২. রিটার্ন ও এক্সচেঞ্জ:
- সময়সীমা: ${returnDays}
- শর্তাবলী: ${returnConditions}

৩. পেমেন্ট পদ্ধতি:
- ক্যাশ অন ডেলিভারি (COD): ${codEnabled ? "চালু আছে" : "বন্ধ"}

৪. ব্র্যান্ডের টোন:
- কাস্টমারকে ${
        brandTone === "friendly"
          ? "আপু/ভাইয়া সম্বোধন করে সম্মান দিয়ে কথা বলবে।"
          : "ফরমাল ও মার্জিত ভাষায় কথা বলবে।"
      }

৫. বিশেষ নিয়মাবলী ও নির্দেশনা:
${customRules}
`;

      const rulesData = {
        insideDhakaCharge,
        outsideDhakaCharge,
        freeDeliveryOver,
        deliveryDays,
        returnDays,
        returnConditions,
        codEnabled,
        brandTone,
        customRules,
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Store Delivery & Policy Rules",
          content: policyContent,
          fileType: "manual",
          replaceExisting: true,
          metadata: rulesData,
        }),
      });

      if (!res.ok) throw new Error("Failed to save store rules");

      toast.success("শপের নিয়মাবলী সফলভাবে সেভ ও AI-তে সিঙ্ক হয়েছে!");
    } catch (err: any) {
      toast.error(err?.message || "নিয়মাবলী সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <span>শপের নিয়মাবলী ও সেলস পলিসি</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ডেলিভারি চার্জ, রিটার্ন শর্তাবলী ও ব্র্যান্ড টোন কনফিগার করুন যা AI সবসময় মেনে উত্তর দেবে।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/playground">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span>বট টেস্ট করুন</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleSavePolicies}
            disabled={savingRules}
            className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-medium shadow-2xs"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{savingRules ? "সেভ হচ্ছে..." : "নিয়মাবলী সেভ করুন"}</span>
          </Button>
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Form Column (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Delivery Charges Card */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span>ডেলিভারি চার্জ কনফিগারেশন</span>
              </CardTitle>
              <CardDescription className="text-xs">
                কাস্টমার জানতে চাইলে বা অর্ডার করার সময় AI স্বয়ংক্রিয়ভাবে এই চার্জ যুক্ত করবে।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-foreground">ঢাকার ভেতরে চার্জ (৳)</label>
                  <Input
                    type="number"
                    value={insideDhakaCharge}
                    onChange={(e) => setInsideDhakaCharge(e.target.value)}
                    placeholder="80"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">ঢাকার বাইরে চার্জ (৳)</label>
                  <Input
                    type="number"
                    value={outsideDhakaCharge}
                    onChange={(e) => setOutsideDhakaCharge(e.target.value)}
                    placeholder="150"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">ফ্রি ডেলিভারি মিনিমাম অর্ডার (৳)</label>
                  <Input
                    type="number"
                    value={freeDeliveryOver}
                    onChange={(e) => setFreeDeliveryOver(e.target.value)}
                    placeholder="2000"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">আনুমানিক ডেলিভারি সময়</label>
                  <Input
                    type="text"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    placeholder="১-৩ কার্যদিবস"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return & COD Policy */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>রিটার্ন পলিসি ও ক্যাশ অন ডেলিভারি</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20">
                <div>
                  <p className="font-semibold text-foreground">ক্যাশ অন ডেলিভারি (COD)</p>
                  <p className="text-[11px] text-muted-foreground">পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা</p>
                </div>
                <Button
                  size="sm"
                  variant={codEnabled ? "default" : "outline"}
                  onClick={() => setCodEnabled(!codEnabled)}
                  className="text-xs h-7 px-3"
                >
                  {codEnabled ? "সক্রিয় (Active)" : "বন্ধ"}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-foreground">রিটার্ন সময়সীমা</label>
                  <Input
                    type="text"
                    value={returnDays}
                    onChange={(e) => setReturnDays(e.target.value)}
                    placeholder="৭ দিন"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">রিটার্ন গ্রহণের শর্তাবলী</label>
                  <Input
                    type="text"
                    value={returnConditions}
                    onChange={(e) => setReturnConditions(e.target.value)}
                    placeholder="ট্যাগ ও ইনভয়েস থাকতে হবে"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Tone & Custom Instructions */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>বট টোন ও কাস্টম সেলস নির্দেশনা</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1 text-xs">
              <div>
                <label className="font-semibold text-foreground">বটের কথা বলার ধরণ (Tone)</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { id: "friendly", label: "Friendly (আপু/ভাইয়া)" },
                    { id: "formal", label: "Formal (শ্রদ্ধাশীল)" },
                    { id: "casual", label: "Casual (বন্ধুভাবাপন্ন)" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBrandTone(t.id as typeof brandTone)}
                      className={`p-2.5 rounded-lg border text-center transition-all text-xs font-medium ${
                        brandTone === t.id
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  বিশেষ নির্দেশনা (অফার, ডিসকাউন্ট ও স্টক আউট হ্যান্ডলিং)
                </label>
                <textarea
                  rows={4}
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="এখানে আপনার শপের যেকোনো বিশেষ নিয়ম লিখে দিন..."
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSavePolicies}
                  disabled={savingRules}
                  className="gap-2 bg-primary text-primary-foreground font-medium text-xs h-8"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{savingRules ? "সেভ হচ্ছে..." : "নিয়মাবলী সেভ ও সিঙ্ক করুন"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Info Column (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                <span>কীভাবে কাজ করে?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed pt-0">
              <p>
                ১. এখানে সেভ করা নিয়মগুলো AI আপনার পেজের <strong>মূল প্রাইসিং ও ডেলিভারি নির্দেশিকা</strong> হিসেবে ব্যবহার করবে।
              </p>
              <p>
                ২. কোনো কাস্টমার মেসেঞ্জারে ডেলিভারি চার্জ জানতে চাইলে AI স্বয়ংক্রিয়ভাবে ঢাকার ভেতরে ৳{insideDhakaCharge} এবং বাইরে ৳{outsideDhakaCharge} জানাবে।
              </p>
              <p>
                ৩. অর্ডার কনফার্ম করার সময় ঠিকানার ভিত্তিতে ডেলিভারি ফি যুক্ত করে সঠিক ইনভয়েস তৈরি করবে।
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-primary/5 shadow-2xs border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>তাত্ক্ষণিক AI আপডেট</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                নিয়ম পরিবর্তন করলেই পরবর্তী মেসেজ থেকেই AI নতুন নিয়ম মেনে উত্তর দেওয়া শুরু করবে। কোনো রিস্টার্টের প্রয়োজন নেই।
              </p>
              <Link href="/playground" className="block pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>AI টেস্ট কনসোলে পরীক্ষা করুন</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

