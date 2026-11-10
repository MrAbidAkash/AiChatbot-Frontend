"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Zap,
  Sparkles,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Receipt,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface WalletData {
  totalAllocatedCredits: number;
  remainingReplies: number;
  remainingBalance: number;
  usedCredits: number;
  costPerReply: number;
  totalRechargedAmount: number;
  isPaidUser: boolean;
  planTitle: string;
  hasCredits: boolean;
  isActive: boolean;
}

interface PaymentItem {
  _id: string;
  paymentID?: string;
  trxID?: string;
  amount: number | string;
  transactionStatus?: string;
  createdAt: string;
  customerInfo?: {
    name?: string;
    phone?: string;
  };
}

const packs = [
  {
    id: "starter",
    name: "স্টার্টার প্যাক (Starter)",
    price: 500,
    replies: "১,০০০ টি",
    bonus: null,
    costPerMsg: "৫০ পয়সা",
    description: "ছোট বা মাঝারি শপের জন্য সাশ্রয়ী রিচার্জ প্যাক",
    popular: false,
    features: [
      "১,০০০ টি কাস্টমার মেসেজ রিপ্লাই (৫০ পয়সা/রিপ্লাই)",
      "আনলিমিটেড ফেসবুক পেজ কানেক্ট (Unlimited FB Pages)",
      "অটোমেটিক ক্যাশ অন ডেলিভারি (COD) অর্ডার",
      "পেজ পোস্ট কমেন্ট অটো-রিপ্লাই",
      "টিম ইনবক্স ও ম্যানুয়াল চ্যাট হ্যান্ডওভার",
      "মেয়াদের কোনো সীমাবদ্ধতা নেই (No Expiry)",
    ],
  },
  {
    id: "growth",
    name: "গ্রোথ প্যাক (Growth)",
    price: 1000,
    replies: "২,২০০ টি",
    bonus: "১০% এক্সট্রা বোনাস (২০০ টি ফ্রি)",
    costPerMsg: "৪৫ পয়সা",
    description: "দ্রুত বর্ধনশীল অনলাইন বিজনেসের জন্য সেরা পছন্দ",
    popular: true,
    features: [
      "২,২০০ টি কাস্টমার মেসেজ রিপ্লাই",
      "২০০ টি সম্পূর্ণ ফ্রি বোনাস রিপ্লাই (১০% বোনাস)",
      "আনলিমিটেড ফেসবুক পেজ কানেক্ট ও পরিচালনা",
      "Vision AI (কাস্টমারের পাঠানো ছবি চিনে প্রোডাক্ট ম্যাচ)",
      "ভয়েস মেসেজ শোনা ও ট্রান্সক্রিপশন",
      "রিয়েল-টাইম টিম ইনবক্স ও প্রায়োরিটি সাপোর্ট",
      "মেয়াদের কোনো সীমাবদ্ধতা নেই (No Expiry)",
    ],
  },
  {
    id: "business",
    name: "বিজনেস স্কেল (Business)",
    price: 5000,
    replies: "১২,০০০ টি",
    bonus: "২০% এক্সট্রা বোনাস (২,০০০ টি ফ্রি)",
    costPerMsg: "৪১ পয়সা",
    description: "বড় শপ ও একাধিক পেজের হাই-ভলিউম মেসেজের জন্য",
    popular: false,
    features: [
      "১২,০০০ টি কাস্টমার মেসেজ রিপ্লাই",
      "২,০০০ টি সম্পূর্ণ ফ্রি বোনাস রিপ্লাই (২০% বোনাস)",
      "আনলিমিটেড ফেসবুক পেজ কানেক্ট ও পরিচালনা",
      "কাস্টম সেলস স্ক্রিপ্ট ও স্পেশাল ব্যান্ডউইথ",
      "VIP ডেডিকেটেড সাপোর্ট",
      "মেয়াদের কোনো সীমাবদ্ধতা নেই (No Expiry)",
    ],
  },
];

export default function WalletManager() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet || null);
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Failed to load wallet data:", err);
      toast.error("ওয়ালেট তথ্য লোড হতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchWallet();
    toast.success("ওয়ালেট ব্যালেন্স রিফ্রেশ করা হয়েছে");
  };

  const isExhausted = wallet ? wallet.remainingReplies <= 0 : false;
  const isLowBalance = wallet ? wallet.remainingReplies > 0 && wallet.remainingReplies <= 5 : false;

  const usagePercent = wallet
    ? Math.min(
        100,
        Math.round((wallet.usedCredits / Math.max(1, wallet.totalAllocatedCredits)) * 100)
      )
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>ব্যালেন্স ও ওয়ালেট রিচার্জ</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            আপনার ChatTime AI রিপ্লাই ক্রেডিট, রিচার্জ প্যাক ও লেনদেন হিস্ট্রি পরিচালনা করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </Button>

          <Link href="/checkout?plan=growth">
            <Button size="sm" className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-medium shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>বিকাশ দিয়ে রিচার্জ করুন</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ==================== 1. CRITICAL RECHARGE BANNER IF BALANCE IS 0 ==================== */}
      {isExhausted && !loading && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/25 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  আপনার AI রিপ্লাই ব্যালেন্স শেষ! AI অটো-রিপ্লাই স্থগিত আছে।
                </h3>
                <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">
                  ব্যালেন্স শেষ (0 Credits)
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                আপনার বরাদ্দকৃত ৫০টি ফ্রি ট্রায়াল ক্রেডিট শেষ হয়েছে (মোট ব্যবহৃত: {wallet?.usedCredits || 0} টি)। 
                ফেসবুক পেজে কাস্টমারদের তাৎক্ষণিক উত্তর দেওয়া ও সেলস সচল রাখতে নিচের যেকোনো প্যাক বিকাশ দিয়ে রিচার্জ করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Link href="#recharge-packs">
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-2xs">
                <CreditCard className="h-3.5 w-3.5" />
                <span>রিচার্জ প্যাক বেছে নিন ↓</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Low balance warning */}
      {isLowBalance && !loading && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-3.5 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs font-medium text-foreground">
              ⚠️ আপনার AI রিপ্লাই ব্যালেন্স প্রায় শেষ! মাত্র{" "}
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                {wallet?.remainingReplies}
              </strong>{" "}
              টি রিপ্লাই অবশিষ্ট আছে। নিরবচ্ছিন্ন সার্ভিসের জন্য এখনই রিচার্জ করুন।
            </p>
          </div>
          <Link href="#recharge-packs">
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
              রিচার্জ করুন →
            </Button>
          </Link>
        </div>
      )}

      {/* ==================== 2. WALLET KPI OVERVIEW CARDS ==================== */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Balance */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">বর্তমান ব্যালেন্স</p>
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
                ৳{(wallet?.remainingBalance ?? 0).toFixed(2)}
              </p>
            )}
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">(৫০ পয়সা / রিপ্লাই)</span>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 ${
                  !isExhausted
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                    : "border-destructive/30 bg-destructive/10 text-destructive font-medium"
                }`}
              >
                {!isExhausted ? "সক্রিয় (Active)" : "ব্যালেন্স শেষ"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Remaining Replies */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">অবশিষ্ট AI রিপ্লাই</p>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
                {(wallet?.remainingReplies ?? 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">টি</span>
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              ব্যবহৃত: {wallet?.usedCredits ?? 0} টি / মোট: {wallet?.totalAllocatedCredits ?? 50} টি
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Plan Status */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">প্ল্যান ক্যাটাগরি</p>
              <div className="h-7 w-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <p className="mt-2 text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {wallet?.planTitle || "ফ্রি ট্রায়াল ব্যালেন্স"}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>মেয়াদ: আজীবন (No Expiry)</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Recharged */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">মোট রিচার্জ</p>
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Receipt className="h-3.5 w-3.5" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
                ৳{(wallet?.totalRechargedAmount ?? 0).toFixed(2)}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              সরাসরি বিকাশ (bKash) পেমেন্ট
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Credit Usage Progress Bar Card */}
      <Card className="border-border/80 bg-card shadow-2xs">
        <CardContent className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span>ক্রেডিট ব্যবহার প্রগ্রেস:</span>
              <span className="font-mono text-primary">{usagePercent}%</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              ব্যবহৃত: {wallet?.usedCredits ?? 0} / {wallet?.totalAllocatedCredits ?? 50} টি রিপ্লাই
            </span>
          </div>

          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExhausted ? "bg-rose-500" : isLowBalance ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>ফ্রি ট্রায়াল (৫০ টি)</span>
            <span>রিচার্জড ক্রেডিট</span>
            <span>{isExhausted ? "ব্যালেন্স শেষ" : "সক্রিয়"}</span>
          </div>
        </CardContent>
      </Card>

      {/* ==================== 3. RECHARGE PACKS SECTION ==================== */}
      <div id="recharge-packs" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>সাশ্রয়ী রিচার্জ প্যাক সমূহ (বিকাশ)</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              কোনো ফিক্সড মাসিক ফি নেই। যত প্রয়োজন তত রিচার্জ করুন, প্রতি রিপ্লাই মাত্র ৫০ পয়সা।
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>১ ক্লিকে তাৎক্ষণিক অ্যাক্টিভেশন</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {packs.map((p) => (
            <Card
              key={p.id}
              className={`relative flex flex-col justify-between border transition-all duration-200 ${
                p.popular
                  ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                  : "border-border/80 bg-card hover:border-primary/40 shadow-2xs"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-2.5 right-4">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 shadow-2xs">
                    সবচেয়ে জনপ্রিয়
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold text-foreground">
                    {p.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {p.description}
                  </CardDescription>
                </div>

                <div className="pt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-foreground font-mono">
                    ৳{p.price.toLocaleString("bn-BD")}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    / {p.replies} রিপ্লাই
                  </span>
                </div>

                {p.bonus && (
                  <div className="pt-1">
                    <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      🎁 {p.bonus}
                    </Badge>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3">
                  <Link href={`/checkout?plan=${p.id}`} className="block">
                    <Button
                      size="sm"
                      className={`w-full text-xs h-9 gap-1.5 font-medium shadow-2xs ${
                        p.popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-card text-foreground border border-border hover:bg-muted"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>বিকাশ দিয়ে রিচার্জ করুন</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ==================== 4. PAYMENT & RECHARGE HISTORY TABLE ==================== */}
      <Card className="border-border/80 bg-card shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <span>রিচার্জ ও পেমেন্ট হিস্ট্রি</span>
            </CardTitle>
            <CardDescription className="text-xs">
              আপনার একাউন্টের সাম্প্রতিক বিকাশ (bKash) লেনদেন সমূহ
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {payments.length} টি লেনদেন
          </Badge>
        </CardHeader>

        <CardContent className="pt-1">
          {loading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/10">
              <Receipt className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-foreground">এখনও কোনো রিচার্জ রেকর্ড পাওয়া যায়নি</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                উপরে যেকোনো প্যাক বেছে নিয়ে বিকাশ দিয়ে রিচার্জ করলেই লেনদেনের রসিদ এখানে যুক্ত হবে।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {payments.map((p) => (
                <div
                  key={p._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-lg hover:bg-muted/30 transition-colors -mx-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          ৳{Number(p.amount).toLocaleString("bn-BD")}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${
                            p.transactionStatus === "Completed"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {p.transactionStatus === "Completed" ? "সফল (Success)" : p.transactionStatus || "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        <span className="font-mono text-[10px]">TrxID: {p.trxID || p.paymentID || "N/A"}</span>
                        <span>•</span>
                        <span>{new Date(p.createdAt).toLocaleDateString("bn-BD")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    <span>+{Math.round(Number(p.amount) / 0.50)} টি রিপ্লাই</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== 5. BILLING & RECHARGE FAQ ==================== */}
      <Card className="border-border/80 bg-card shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>বিলিং ও রিচার্জ সংক্রান্ত সচরাচর জিজ্ঞাসা</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
            <h4 className="font-semibold text-foreground">১. ৫০ পয়সা প্রতি রিপ্লাই কীভাবে কাটে?</h4>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              আপনার ফেসবুক পেজে যখন কোনো কাস্টমার মেসেজ পাঠায় এবং AI সফলভাবে শপের নিয়ম বা ক্যাটালগ পড়ে কাস্টমারকে উত্তর দেয়, তখন ওয়ালেট থেকে মাত্র ৫০ পয়সা (৳০.৫০) কর্তন করা হয়। হিউম্যান এজেন্ট নিজে মেসেজ পাঠালে কোনো চার্জ কাটে না।
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
            <h4 className="font-semibold text-foreground">২. রিচার্জ করা ব্যালেন্সের কি কোনো মেয়াদ বা এক্সপায়ারি আছে?</h4>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              না! ChatTime AI-তে রিচার্জকৃত ক্রেডিটের কোনো মেয়াদ সীমাবদ্ধতা নেই। এটি আজীবনের জন্য আপনার ওয়ালেটে সংরক্ষিত থাকবে।
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
            <h4 className="font-semibold text-foreground">৩. বিকাশ দিয়ে রিচার্জ করার কতক্ষণ পর ব্যালেন্স যোগ হয়?</h4>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              বিকাশ পেমেন্ট সম্পন্ন হওয়ার সাথে সাথেই স্বয়ংক্রিয়ভাবে সেকেন্ডের মধ্যে ওয়ালেটে ব্যালেন্স জমা হয় এবং স্থগিত থাকা AI অটো-রিপ্লাই সঙ্গে সঙ্গে সচল হয়ে যায়।
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
            <h4 className="font-semibold text-foreground">৪. আমি কি একাধিক ফেসবুক পেজ যুক্ত করতে পারব?</h4>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              হ্যাঁ! ChatTime AI-তে পেজ সংখ্যার কোনো সীমাবদ্ধতা নেই। আপনি আনলিমিটেড ফেসবুক পেজ (Unlimited FB Pages) একই ড্যাশবোর্ড থেকে সম্পূর্ণ ফ্রিতে কানেক্ট করতে পারবেন এবং প্রতিটির জন্য আলাদা ক্যাটালগ ও রুলস সেট করতে পারবেন।
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

