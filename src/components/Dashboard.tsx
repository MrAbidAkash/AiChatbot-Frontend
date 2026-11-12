"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Zap,
  BookOpen,
  Facebook,
  Plus,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Bot,
  CreditCard,
  Send,
  Cpu,
  Eye,
  X,
  MessageCircle,
  ExternalLink,
  Upload,
  AlertTriangle,
  Truck,
  ShoppingBag,
  Phone,
  MapPin,
  Package,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import DashboardSkeleton from "@/components/DashboardSkeleton";

interface DashboardProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    session: {
      id: string;
      expiresAt: Date;
    };
  };
}

interface ConnectedPage {
  _id?: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  isActive: boolean;
  botTone?: "friendly" | "professional" | "casual";
  fallbackMessage?: string;
  customInstructions?: string;
  createdAt?: string;
}

interface RecentConversation {
  _id: string;
  pageId: string;
  pageName?: string;
  senderPsid: string;
  customerName?: string;
  lastMessage: string;
  lastMessageAt: string;
  status: "ai_replied" | "pending" | "human_replied";
  unread?: boolean;
}

interface WalletStats {
  totalAllocatedCredits: number;
  remainingBalance: number;
  remainingReplies?: number;
  costPerReply?: number;
  usedCredits: number;
  totalRechargedAmount: number;
  isPaidUser: boolean;
  planTitle: string;
  isActive: boolean;
}

interface RecentOrder {
  _id: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  productName: string;
  quantity: number;
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
  stockDecremented?: boolean;
  stockDeductionMessage?: string | null;
  stockCell?: string | null;
  createdAt: string;
}

interface DbStats {
  totalDocuments: number;
  totalPages: number;
  totalConversations: number;
  totalMessages: number;
  totalAiReplies: number;
  totalOrders?: number;
  responseRate: number;
  wallet?: WalletStats;
  recentConversations: RecentConversation[];
  recentOrders?: RecentOrder[];
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  modelUsed?: string;
  hasKnowledge?: boolean;
}

export default function Dashboard({ session }: DashboardProps) {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [pages, setPages] = useState<ConnectedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dismissOnboarding, setDismissOnboarding] = useState(false);
  const [syncingOrders, setSyncingOrders] = useState(false);

  // AI Simulator Modal state
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "স্বাগতম! আমি আপনার শপের AI সেলস অ্যাসিস্ট্যান্ট। আপনার শপের নিয়মাবলী বা ক্যাটালগ অনুযায়ী আমাকে যেকোনো প্রশ্ন করে পরীক্ষা করতে পারেন।",
      timestamp: "এইমাত্র",
      modelUsed: "Gemini 2.5 Flash",
      hasKnowledge: true,
    },
  ]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, pagesRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/facebook/pages"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        setPages(pagesData.pages || []);
      }
      if (isRefresh) {
        toast.success("ড্যাশবোর্ড রিফ্রেশ হয়েছে");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      toast.error("ডাটা লোড হতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} কপি হয়েছে`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSyncOrders = async () => {
    setSyncingOrders(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_conversations" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "চ্যাট হিস্ট্রি থেকে অর্ডার সিঙ্ক সফল হয়েছে!");
        await fetchData(true);
      } else {
        toast.error(data.error || "সিঙ্ক করতে ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      toast.error("সিঙ্ক এরর: " + err.message);
    } finally {
      setSyncingOrders(false);
    }
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "এইমাত্র";
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "এইমাত্র";
      if (diffMins < 60) return `${diffMins} মি. আগে`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
      return date.toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
    } catch {
      return "সম্প্রতি";
    }
  };

  // Quick test question handler
  const handleSendTestMessage = async (textToSend?: string) => {
    const query = (textToSend || testInput).trim();
    if (!query || testLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: "এখন",
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setTestInput("");
    setTestLoading(true);

    try {
      const res = await fetch("/api/facebook/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          pageId: pages.length > 0 ? pages[0].pageId : undefined,
          botTone: pages.length > 0 ? pages[0].botTone : "friendly",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply || "ধন্যবাদ! আপনার মেসেজটি পেয়েছি।",
          timestamp: "এইমাত্র",
          modelUsed: data.modelUsed || "Gemini 2.5 Flash",
          hasKnowledge: data.hasKnowledge,
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      } else {
        toast.error("AI রেসপন্স পাওয়া যায়নি");
      }
    } catch (error) {
      console.error("Test AI error:", error);
      toast.error("AI টেস্টের সময় সমস্যা হয়েছে");
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ==================== 1. CLEAN EXECUTIVE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>স্বাগতম, {session.user.name || "Merchant"}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            আপনার F-Commerce AI সেলস ও মেসেঞ্জার পারফর্ম্যান্স ড্যাশবোর্ড
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground border-border/80"
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>রিফ্রেশ</span>
          </Button>

          <Link href="/documents">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 text-foreground border-border/80 hover:bg-muted font-medium"
            >
              <Upload className="h-3 w-3 text-primary" />
              <span>ডকুমেন্ট আপলোড</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimulatorOpen(true)}
            className="gap-1.5 text-xs h-8 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 font-medium"
          >
            <Sparkles className="h-3 w-3" />
            <span>AI টেস্ট</span>
          </Button>

          <Link href="/connect">
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>পেজ কানেক্ট</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ==================== 2. SLIM SETUP REMINDER (Shown only if 0 pages) ==================== */}
      {pages.length === 0 && !dismissOnboarding && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Facebook className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground">
                আপনার Facebook Page এখনও কানেক্ট করা হয়নি
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                AI স্বয়ংক্রিয়ভাবে মেসেজের উত্তর দিতে এবং COD অর্ডার নিতে পেজটি যুক্ত করুন (সময় লাগবে ১ মিনিট)।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Link href="/connect">
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-medium">
                পেজ কানেক্ট করুন →
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setDismissOnboarding(true)}
              title="বন্ধ করুন"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ==================== CRITICAL RECHARGE BANNER IF BALANCE IS 0 ==================== */}
      {stats?.wallet && stats.wallet.remainingReplies !== undefined && stats.wallet.remainingReplies <= 0 && (
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
                আপনার বরাদ্দকৃত ৫০টি ফ্রি ট্রায়াল ক্রেডিট শেষ হয়েছে (মোট ব্যবহৃত: {stats.wallet.usedCredits} টি)। 
                ফেসবুক পেজে কাস্টমারদের তাৎক্ষণিক উত্তর দিতে এবং সেলস সচল রাখতে এখনই বিকাশ দিয়ে রিচার্জ করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Link href="/wallet">
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-2xs">
                <CreditCard className="h-3.5 w-3.5" />
                <span>এখনই রিচার্জ করুন (bKash) →</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Low balance warning */}
      {stats?.wallet && stats.wallet.remainingReplies !== undefined && stats.wallet.remainingReplies > 0 && stats.wallet.remainingReplies <= 5 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-3.5 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs font-medium text-foreground">
              ⚠️ আপনার AI ব্যালেন্স প্রায় শেষ! মাত্র{" "}
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                {stats.wallet.remainingReplies}
              </strong>{" "}
              টি রিপ্লাই বাকি আছে। নিরবচ্ছিন্ন সার্ভিসের জন্য এখনই রিচার্জ করুন।
            </p>
          </div>
          <Link href="/wallet">
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
              রিচার্জ করুন →
            </Button>
          </Link>
        </div>
      )}

      {/* ==================== 3. 5 CLEAN, CALM KPI CARDS ==================== */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">AI Auto-Replies</p>
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {(stats?.totalAiReplies || 0).toLocaleString()}
            </p>
            {stats?.wallet && stats.wallet.remainingReplies !== undefined && stats.wallet.remainingReplies <= 0 ? (
              <Link
                href="/wallet"
                className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 hover:underline"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>AI স্থগিত • রিচার্জ →</span>
              </Link>
            ) : (
              <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AI সক্রিয় (Active)
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">কনফার্মড অর্ডারসমূহ</p>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {(stats?.totalOrders || 0).toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">মেসেঞ্জার সেলস</span>
              <Link
                href="/orders"
                className="text-primary hover:underline font-semibold flex items-center gap-0.5"
              >
                সব দেখুন →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">মোট কথোপকথন</p>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {(stats?.totalConversations || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {stats?.totalMessages || 0} টি মেসেজ এক্সচেঞ্জ
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">কানেক্টেড পেজ</p>
              <div className="h-7 w-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <Facebook className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {pages.length}
            </p>
            <p className={`mt-1 text-[11px] font-medium ${pages.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
              {pages.length > 0 ? "সরাসরি লাইভ" : "কানেকশন বাকি"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">ডকুমেন্টস ও নলেজ</p>
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {stats?.totalDocuments || 0}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">ইনডেক্সড ফাইলস</span>
              <Link
                href="/documents"
                className="text-primary hover:underline font-semibold flex items-center gap-0.5"
              >
                আপলোড করুন →
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ==================== 4. MAIN 2-COLUMN WORKSPACE ==================== */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Pages & Recent Inquiries */}
        <div className="space-y-6 lg:col-span-8">
          {/* Connected Facebook Pages */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-500" />
                  <span>আপনার Facebook Pages</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  AI স্বয়ংক্রিয়ভাবে যে পেজগুলোতে কাস্টমার মেসেজের উত্তর দিচ্ছে
                </CardDescription>
              </div>
              <Link href="/connect">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 border-border">
                  <Plus className="h-3 w-3" />
                  <span>নতুন পেজ</span>
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="pt-1">
              {pages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-6 text-center bg-muted/20">
                  <Facebook className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                  <h4 className="text-xs font-semibold text-foreground">
                    কোনো Facebook Page পাওয়া যায়নি
                  </h4>
                  <p className="mt-0.5 text-[11px] text-muted-foreground max-w-xs mx-auto">
                    ফেসবুক পেজ যুক্ত করলে AI কাস্টমারের দাম, সাইজ ও COD অর্ডার সংগ্রহ করবে।
                  </p>
                  <Link href="/connect" className="inline-block mt-3">
                    <Button size="sm" className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-medium">
                      <Plus className="h-3.5 w-3.5" />
                      <span>পেজ কানেক্ট করুন</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pages.map((page) => (
                    <div
                      key={page.pageId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-500 font-bold">
                          <Facebook className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-foreground">
                              {page.pageName}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                page.isActive
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {page.isActive ? "সক্রিয়" : "বিরত"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            <button
                              onClick={() => copyToClipboard(page.pageId, "Page ID")}
                              className="font-mono hover:text-foreground flex items-center gap-1"
                              title="Click to copy"
                            >
                              ID: {page.pageId}
                              {copiedField === "Page ID" ? (
                                <Check className="h-2.5 w-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-2.5 w-2.5 text-muted-foreground/60" />
                              )}
                            </button>
                            <span>•</span>
                            <span>টোন: {page.botTone || "Friendly"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Link href={`/inbox?pageId=${page.pageId}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                            ইনবক্স
                          </Button>
                        </Link>
                        <Link href="/connect">
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2">
                            ম্যানেজ
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ==================== Recent Confirmed Orders ==================== */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </div>
                  <span>সাম্প্রতিক কনফার্মড অর্ডারসমূহ</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  মেসেঞ্জারে AI অ্যাসিস্ট্যান্ট দ্বারা সংগৃহীত কাস্টমার অর্ডার ও শিট স্টক
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncOrders}
                  disabled={syncingOrders}
                  className="gap-1 text-xs h-7 border-border text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className={`h-3 w-3 text-primary ${syncingOrders ? "animate-spin" : ""}`} />
                  <span>{syncingOrders ? "সিঙ্ক..." : "চ্যাট থেকে সিঙ্ক"}</span>
                </Button>
                <Link href="/orders">
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 font-medium">
                    <span>সব অর্ডার ({stats?.totalOrders || 0})</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-1">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {stats.recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-lg transition-colors hover:bg-muted/30 -mx-2"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {order.customerName}
                          </span>
                          <span className="px-1.5 py-0 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            কনফার্মড
                          </span>
                          {order.stockDecremented ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                              <FileSpreadsheet className="h-2.5 w-2.5" />
                              <span>শিট স্টক আপডেট ({order.stockCell || "Sheet"})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <FileSpreadsheet className="h-2.5 w-2.5" />
                              <span>{order.stockDeductionMessage || "শিট পেন্ডিং"}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                          <Package className="h-3 w-3 text-primary" />
                          <span>{order.productName}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">({order.quantity} টি)</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          {order.customerPhone && (
                            <span className="flex items-center gap-1 font-mono text-foreground">
                              <Phone className="h-2.5 w-2.5 text-emerald-500" />
                              {order.customerPhone}
                            </span>
                          )}
                          {order.deliveryAddress && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5 text-rose-500" />
                              {order.deliveryAddress}
                            </span>
                          )}
                          <span className="font-mono">{formatRelativeTime(order.createdAt)}</span>
                        </div>
                      </div>

                      {/* Send to Steadfast Courier (Commented out per user request)
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/courier?name=${encodeURIComponent(order.customerName)}&phone=${encodeURIComponent(
                            order.customerPhone || "",
                          )}&address=${encodeURIComponent(order.deliveryAddress || "")}`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-medium"
                          >
                            <Truck className="h-3 w-3" />
                            <span>কুরিয়ারে পাঠান</span>
                          </Button>
                        </Link>
                      </div>
                      */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-6 text-center bg-muted/20">
                  <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                  <h4 className="text-xs font-semibold text-foreground">
                    এখনো কোনো অর্ডার রেকর্ড হয়নি
                  </h4>
                  <p className="mt-0.5 text-[11px] text-muted-foreground max-w-sm mx-auto">
                    মেসেঞ্জারে কাস্টমার অর্ডার কনফার্ম করলে AI স্বয়ংক্রিয়ভাবে এখানে অর্ডার রেকর্ড করবে এবং গুগল শিট স্টক কমাবে।
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSyncOrders}
                      disabled={syncingOrders}
                      className="text-xs h-7 gap-1.5"
                    >
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span>{syncingOrders ? "সিঙ্ক হচ্ছে..." : "আগের চ্যাট থেকে সিঙ্ক করুন"}</span>
                    </Button>
                    <Link href="/orders">
                      <Button size="sm" className="text-xs h-7 gap-1.5 font-medium">
                        <Plus className="h-3 w-3" />
                        <span>অর্ডার ম্যানেজার</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Inquiries Feed */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>সাম্প্রতিক কাস্টমার বার্তা</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  মেসেঞ্জারে আসা সাম্প্রতিক কাস্টমার প্রশ্ন ও AI এর উত্তর
                </CardDescription>
              </div>
              <Link href="/inbox">
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7 text-muted-foreground hover:text-foreground">
                  <span>সব দেখুন</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="pt-1">
              {stats?.recentConversations && stats.recentConversations.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {stats.recentConversations.map((conv) => (
                    <Link
                      key={conv._id}
                      href={`/inbox?id=${conv._id}`}
                      className="flex items-start justify-between gap-3 py-3 px-2 rounded-lg transition-colors hover:bg-muted/40 -mx-2"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {(conv.customerName || "Customer").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {conv.customerName || "Messenger User"}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                conv.status === "ai_replied"
                                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                  : "border-blue-500/30 text-blue-500 bg-blue-500/10"
                              }`}
                            >
                              {conv.status === "ai_replied" ? "AI Replied" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                            {conv.lastMessage || "বার্তা নেই"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5 font-mono">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-6 text-center bg-muted/20">
                  <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground/40 mb-1" />
                  <p className="text-xs font-medium text-foreground">এখনও কোনো বার্তা আসেনি</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    পেজে কাস্টমাররা মেসেজ পাঠালে এখানে লাইভ দেখতে পাবেন।
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Wallet Card FIRST (High Visibility) & AI Health */}
        <div className="space-y-6 lg:col-span-4">
          {/* Wallet Card - Positioned at top of sidebar for immediate visibility */}
          <Card className={`border shadow-2xs ${
            stats?.wallet && stats.wallet.remainingReplies !== undefined && stats.wallet.remainingReplies <= 0
              ? "border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/20"
              : "border-border/80 bg-card"
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>ব্যালেন্স ও ওয়ালেট</span>
                </span>
                <Link
                  href="/wallet"
                  className="text-[10px] text-primary hover:underline font-medium flex items-center gap-0.5 normal-case"
                >
                  <span>ডিটেইলস পেজ</span>
                  <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    {stats?.wallet?.planTitle || "ফ্রি ট্রায়াল ব্যালেন্স"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      (stats?.wallet?.remainingReplies ?? 35) > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    }`}
                  >
                    {(stats?.wallet?.remainingReplies ?? 35) > 0 ? "সক্রিয় (Active)" : "ব্যালেন্স শেষ"}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-foreground font-mono">
                      ৳{(stats?.wallet?.remainingBalance ?? 17.5).toFixed(2)}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      (৫০ পয়সা / রিপ্লাই)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {stats?.wallet?.remainingReplies ?? 35} টি AI রিপ্লাই অবশিষ্ট আছে (ব্যবহৃত: {stats?.wallet?.usedCredits ?? stats?.totalAiReplies ?? 15} টি)
                  </p>
                </div>

                {/* Usage Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>ক্রেডিট ব্যবহার</span>
                    <span className="font-mono">
                      {Math.min(
                        100,
                        Math.round(
                          ((stats?.wallet?.usedCredits ?? 15) /
                            Math.max(1, stats?.wallet?.totalAllocatedCredits ?? 50)) *
                            100
                        )
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-primary/15 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (stats?.wallet?.remainingReplies ?? 35) <= 0
                          ? "bg-rose-500"
                          : "bg-primary"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((stats?.wallet?.usedCredits ?? 15) /
                              Math.max(1, stats?.wallet?.totalAllocatedCredits ?? 50)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-0.5">
                <Link href="/wallet" className="block">
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-2xs"
                  >
                    <CreditCard className="h-3 w-3" />
                    <span>বিকাশ দিয়ে রিচার্জ করুন</span>
                  </Button>
                </Link>

                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                    বিকাশ
                  </span>
                  <span>•</span>
                  <span>কোনো মেয়াদের সীমাবদ্ধতা নেই</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Health Card */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>AI সিস্টেম হেলথ</span>
                </CardTitle>
                {stats?.wallet && stats.wallet.remainingReplies !== undefined && stats.wallet.remainingReplies <= 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Paused
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Operational
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">AI স্ট্যাটাস</span>
                {stats?.wallet && stats.wallet.remainingReplies !== undefined && stats.wallet.remainingReplies <= 0 ? (
                  <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    স্থগিত (ব্যালেন্স শেষ)
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    সক্রিয় (Active)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">রেসপন্স স্পিড</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  &lt; ২ সেকেন্ড
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">ছবি ও ভিশন AI</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">সক্রিয় (Active)</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">ভাষা সমর্থন</span>
                <span className="font-medium text-foreground">বাংলা, Banglish, English</span>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSimulatorOpen(true)}
                  className="w-full text-xs h-8 gap-1.5 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-medium"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI টেস্ট কনসোল চালান</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Steadfast Courier Quick Action Card */}
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Steadfast কুরিয়ার</span>
                </CardTitle>
                <Link
                  href="/courier"
                  className="text-[10px] text-primary hover:underline font-medium flex items-center gap-0.5"
                >
                  <span>ম্যানেজ করুন</span>
                  <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <p className="text-[11px] text-muted-foreground">
                ড্যাশবোর্ড হতে সরাসরি Steadfast কুরিয়ারে ১-ক্লিকে পার্সেল পাঠান ও লাইভ ট্র্যাকিং করুন।
              </p>
              <div className="flex items-center gap-2">
                <Link href="/courier" className="flex-1">
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
                  >
                    <Plus className="h-3 w-3" />
                    <span>নতুন পার্সেল তৈরি করুন</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ==================== 5. INTERACTIVE AI TEST SIMULATOR MODAL ==================== */}
      <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-border/80 bg-card">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>ChatTime AI টেস্ট কনসোল</span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </DialogTitle>
                <DialogDescription className="text-[11px]">
                  রিয়েল-টাইম F-Commerce রেসপন্স সিমুলেটর
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Chat Messages Body */}
          <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto text-xs bg-background/50">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-xs"
                      : "bg-muted/80 text-foreground border border-border/60 rounded-bl-xs"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                  <span>{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {testLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl w-fit">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                </div>
                <span>AI উত্তর প্রস্তুত করছে...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts Pills */}
          <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">
              কুইক স্যাম্পল প্রশ্ন:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "ভাইয়া ডেলিভারি চার্জ কত?",
                "ক্যাশ অন ডেলিভারিতে অর্ডার করতে চাই",
                "প্রডাক্টের রিটার্ন পলিসি কী?",
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendTestMessage(prompt)}
                  disabled={testLoading}
                  className="text-[11px] rounded-full border border-border/80 bg-background px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendTestMessage();
            }}
            className="p-3 border-t border-border/60 bg-card flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="কাস্টমার হিসেবে যেকোনো প্রশ্ন লিখুন..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              disabled={testLoading}
              className="flex-1 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              size="sm"
              disabled={testLoading || !testInput.trim()}
              className="h-8 w-8 rounded-xl p-0 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
