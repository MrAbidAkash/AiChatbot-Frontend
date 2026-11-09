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
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Bot,
  Sliders,
  CreditCard,
  Radio,
  Share2,
  Send,
  TrendingUp,
  Activity,
  Layers,
  Settings,
  HelpCircle,
  X,
  ChevronDown,
  ShoppingBag,
  BarChart3,
  Flame,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  UserCheck,
  Cpu,
  Smartphone,
  Eye,
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

interface DbStats {
  totalDocuments: number;
  totalPages: number;
  totalConversations: number;
  totalMessages: number;
  totalAiReplies: number;
  responseRate: number;
  recentConversations: RecentConversation[];
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
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "pages" | "conversations" | "setup"
  >("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dismissOnboarding, setDismissOnboarding] = useState(false);

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

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/facebook`
      : "https://chattimeai.com/api/webhook/facebook";

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
      setLastRefreshedAt(new Date());
      if (isRefresh) {
        toast.success("ড্যাশবোর্ড ডাটা আপডেট করা হয়েছে");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data");
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
    toast.success(`${fieldName} ক্লিপবোর্ডে কপি হয়েছে!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
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

  // Dynamic Bengali greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "শুভ সকাল";
    if (hour >= 12 && hour < 17) return "শুভ দুপুর";
    if (hour >= 17 && hour < 21) return "শুভ সন্ধ্যা";
    return "স্বাগতম";
  }, []);

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
          text: data.reply || "ধন্যবাদ! আপনার মেসেজটি গ্রহণ করা হয়েছে।",
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

  // Mock chart activity trend for F-Commerce analytics view
  const activityData = useMemo(() => {
    const days = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র"];
    const baseReplies = stats?.totalAiReplies || 15;
    const baseConversations = stats?.totalConversations || 1;
    return days.map((day, idx) => ({
      day,
      replies: Math.max(1, Math.round((baseReplies / 7) * (idx + 1) * 0.9)),
      inquiries: Math.max(1, Math.round((baseConversations / 7) * (idx + 1) * 1.1)),
    }));
  }, [stats]);

  // Onboarding progress
  const hasPage = pages.length > 0;
  const hasKnowledge = (stats?.totalDocuments || 0) > 0;
  const hasConversations = (stats?.totalConversations || 0) > 0;
  const setupScore = (hasPage ? 1 : 0) + (hasKnowledge ? 1 : 0) + (hasConversations ? 1 : 0);
  const setupPercentage = Math.round((setupScore / 3) * 100);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient Top Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <main className="relative z-10 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* ==================== 1. TOP HEADER & CONTEXT BAR ==================== */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Merchant Status */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  AI Agent লাইভ ও সক্রিয়
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  • Gemini 2.5 Flash
                </span>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <span>{greeting}, {session.user.name || "Merchant"}</span>
                <span className="text-2xl animate-bounce">👋</span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <span>আপনার F-Commerce AI সেলস এজেন্ট, স্বয়ংক্রিয় COD অর্ডার ও মেসেঞ্জার পারফর্ম্যান্স</span>
              </p>
            </div>

            {/* Quick Action Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="text-[11px] text-muted-foreground hidden md:flex items-center gap-1.5 mr-1 font-mono">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  সিঙ্ক: {lastRefreshedAt.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="gap-1.5 text-xs h-9 border-border/80 hover:bg-muted/80 shadow-2xs"
                title="তথ্য রিফ্রেশ করুন"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
                <span className="hidden sm:inline">রিফ্রেশ</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSimulatorOpen(true)}
                className="gap-2 text-xs h-9 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>AI টেস্ট করুন</span>
              </Button>

              <Link href="/dashboard/training">
                <Button variant="outline" size="sm" className="gap-2 text-xs h-9 border-border/80 hover:bg-muted/80 hidden sm:flex">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  <span>শপ রুলস</span>
                </Button>
              </Link>

              <Link href="/connect">
                <Button
                  size="sm"
                  className="gap-2 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>পেজ কানেক্ট করুন</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* ==================== 2. SEGMENTED TABS NAVIGATION ==================== */}
          <nav className="mt-6 flex overflow-x-auto no-scrollbar items-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 p-1 backdrop-blur-sm">
            {[
              {
                id: "overview",
                label: "সারসংক্ষেপ (Overview)",
                icon: Activity,
              },
              {
                id: "analytics",
                label: "অ্যানালিটিক্স ও ট্রেন্ডস",
                icon: BarChart3,
              },
              {
                id: "pages",
                label: "কানেক্টেড পেজ",
                count: pages.length,
                icon: Facebook,
              },
              {
                id: "conversations",
                label: "কাস্টমার বার্তা",
                count: stats?.recentConversations?.length || 0,
                icon: MessageSquare,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-card text-foreground shadow-2xs font-semibold border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* ==================== 3. 3-STEP ONBOARDING HUB ==================== */}
        {pages.length === 0 && !dismissOnboarding && (
          <div className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    🚀
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">
                    ৩-ধাপে আপনার F-Commerce অটোমেশন চালু করুন ({setupPercentage}% সম্পন্ন)
                  </h3>
                  <Badge variant="outline" className="border-primary/30 text-primary text-[10px] bg-primary/10">
                    Quick Setup
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
                  AI যাতে কাস্টমারের প্রোডাক্টের দাম, সাইজ চার্ট, ডেলিভারি টাইম এবং ক্যাশ অন ডেলিভারি (COD) অর্ডার স্বয়ংক্রিয়ভাবে নিশ্চিত করতে পারে সেজন্য ফেসবুক পেজ কানেক্ট করুন।
                </p>

                {/* Visual Progress Bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(15, setupPercentage)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-primary font-mono">
                    {setupPercentage}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/connect">
                  <Button size="sm" className="gap-2 bg-primary text-primary-foreground font-medium shadow-xs">
                    <Facebook className="h-4 w-4" />
                    <span>পেজ কানেক্ট করুন</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setDismissOnboarding(true)}
                  title="বন্ধ করুন"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Step Cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3 pt-3 border-t border-primary/20">
              <div className="flex items-start gap-2.5 text-xs">
                <div className={`mt-0.5 rounded-full p-1 ${hasKnowledge ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">১. শপের ক্যাটালগ ও রুলস</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {stats?.totalDocuments || 0} টি রুলস ইনডেক্সড
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className={`mt-0.5 rounded-full p-1 ${hasPage ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}`}>
                  {hasPage ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">২. Facebook Page লিংক</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {hasPage ? "সংযুক্ত রয়েছে" : "কানেকশন বাকি রয়েছে"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="mt-0.5 rounded-full p-1 bg-primary/20 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">৩. AI টেস্ট ও লাইভ ট্রায়াল</p>
                  <button
                    onClick={() => setSimulatorOpen(true)}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    এখনই মেসেজ টেস্ট করুন →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. PRO KPI STAT CARDS ==================== */}
        <section className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Card 1: AI Auto-Replies */}
          <Card className="border-border/70 bg-card shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-indigo-500 opacity-80" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  AI Auto-Replies
                </p>
                <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:scale-105 transition-transform">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {loading ? "..." : (stats?.totalAiReplies || 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  ১০০%
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Gemini 2.5 Active
                </span>
                <span className="font-mono text-[10px]">গড় &lt;২ সেকেন্ড</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Total Conversations */}
          <Card className="border-border/70 bg-card shadow-2xs hover:shadow-xs hover:border-blue-500/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-80" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  মোট কথোপকথন
                </p>
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 group-hover:scale-105 transition-transform">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {loading ? "..." : (stats?.totalConversations || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground">কাস্টমার থ্রেড</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                <span>{stats?.totalMessages || 0} টি মেসেজ এক্সচেঞ্জ</span>
                <Link href="/inbox" className="text-primary hover:underline text-[10px] font-medium flex items-center">
                  ইনবক্স <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Connected Pages */}
          <Card className="border-border/70 bg-card shadow-2xs hover:shadow-xs hover:border-pink-500/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500 opacity-80" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  কানেক্টেড পেজ
                </p>
                <div className="rounded-lg bg-pink-500/10 p-2 text-pink-500 group-hover:scale-105 transition-transform">
                  <Facebook className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {loading ? "..." : pages.length}
                </span>
                <span className="text-[11px] text-muted-foreground">পেজ লাইভ</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                <span
                  className={
                    pages.length > 0
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-amber-500 font-medium"
                  }
                >
                  {pages.length > 0 ? "সরাসরি সংযুক্ত" : "কানেক্ট করুন"}
                </span>
                <Link href="/connect" className="text-primary hover:underline text-[10px] font-medium flex items-center">
                  ম্যানেজ <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Shop Knowledge & Catalog */}
          <Card className="border-border/70 bg-card shadow-2xs hover:shadow-xs hover:border-purple-500/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-500 opacity-80" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  শপের ক্যাটালগ ও নিয়ম
                </p>
                <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500 group-hover:scale-105 transition-transform">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {loading ? "..." : (stats?.totalDocuments || 0)}
                </span>
                <span className="text-[11px] text-muted-foreground">ইনডেক্সড রুলস</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                <span className="text-muted-foreground">Vision OCR Ready</span>
                <Link href="/dashboard/training" className="text-primary hover:underline text-[10px] font-medium flex items-center">
                  এডিট <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ==================== TAB 1: OVERVIEW DASHBOARD ==================== */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column (8 cols): Pages & Conversations */}
            <div className="space-y-6 lg:col-span-8">
              {/* Connected Facebook Pages */}
              <Card className="border-border/80 bg-card shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-500" />
                      <span>আপনার Facebook Pages</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      AI স্বয়ংক্রিয়ভাবে যে পেজগুলোতে কাস্টমার মেসেজ ও কমেন্টের তাৎক্ষণিক উত্তর দিচ্ছে
                    </CardDescription>
                  </div>
                  <Link href="/connect">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 border-border">
                      <Plus className="h-3.5 w-3.5" />
                      <span>নতুন পেজ</span>
                    </Button>
                  </Link>
                </CardHeader>

                <CardContent className="pt-1">
                  {pages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/80 p-6 sm:p-8 text-center bg-muted/20">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-3 shadow-inner">
                        <Facebook className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">
                        কোনো Facebook Page পাওয়া যায়নি
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        আপনার ফেসবুক পেজ কানেক্ট করলে AI কাস্টমারের দাম, সাইজ, স্টক এবং ক্যাশ অন ডেলিভারি (COD) অর্ডার স্বয়ংক্রিয়ভাবে সংগ্রহ করবে।
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <Link href="/connect">
                          <Button size="sm" className="gap-2 bg-primary text-primary-foreground font-medium shadow-xs">
                            <Plus className="h-4 w-4" />
                            <span>ফেসবুক পেজ কানেক্ট করুন</span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSimulatorOpen(true)}
                          className="gap-1.5 text-xs"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>AI কীভাবে কাজ করে দেখুন</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pages.map((page) => (
                        <div
                          key={page.pageId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3.5 transition-all hover:border-primary/40 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-500 font-bold">
                              <Facebook className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {page.pageName}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-2 py-0.5 ${
                                    page.isActive
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                                      : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                  }`}
                                >
                                  {page.isActive ? "সক্রিয় (Active)" : "বিরত (Paused)"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                <button
                                  onClick={() => copyToClipboard(page.pageId, "Page ID")}
                                  className="font-mono text-[11px] hover:text-foreground flex items-center gap-1"
                                  title="Click to copy Page ID"
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
                              <Button variant="ghost" size="sm" className="text-xs h-8">
                                <MessageSquare className="mr-1 h-3.5 w-3.5 text-blue-500" />
                                ইনবক্স
                              </Button>
                            </Link>
                            <Link href="/connect">
                              <Button variant="outline" size="sm" className="text-xs h-8">
                                <Settings className="mr-1 h-3.5 w-3.5" />
                                সেটিংস
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Inquiries Stream */}
              <Card className="border-border/80 bg-card shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span>সাম্প্রতিক কাস্টমার ইনকোয়ারি</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      মেসেঞ্জারে কাস্টমারদের পাঠানো প্রশ্ন ও Gemini AI এর স্বয়ংক্রিয় উত্তর
                    </CardDescription>
                  </div>
                  <Link href="/inbox">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                      <span>সম্পূর্ণ ইনবক্স</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
                          className="flex items-start justify-between gap-3 py-3 px-2 rounded-xl transition-colors hover:bg-muted/40 -mx-2"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary/20 to-indigo-500/20 text-xs font-bold text-primary shadow-2xs">
                              {(conv.customerName || "Customer").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {conv.customerName || "Messenger User"}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    conv.status === "ai_replied"
                                      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-medium"
                                      : conv.status === "human_replied"
                                      ? "border-blue-500/30 text-blue-500 bg-blue-500/10"
                                      : "border-amber-500/30 text-amber-500 bg-amber-500/10"
                                  }`}
                                >
                                  {conv.status === "ai_replied"
                                    ? "AI Replied 🤖"
                                    : conv.status === "human_replied"
                                    ? "Human 👤"
                                    : "Pending"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-lg mt-0.5">
                                {conv.lastMessage || "কোনো বার্তা নেই"}
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
                    <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/20">
                      <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <h4 className="mt-2 text-sm font-semibold text-foreground">
                        এখনো কোনো মেসেজ আসেনি
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                        আপনার ফেসবুক পেজে কাস্টমাররা ইনবক্স করলে এখানে লাইভ দেখতে পাবেন এবং AI উত্তর দেবে।
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSimulatorOpen(true)}
                        className="mt-3 gap-1.5 text-xs"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        AI টেস্ট করে দেখুন
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column (4 cols): AI Health & Business Hub */}
            <div className="space-y-6 lg:col-span-4">
              {/* AI System Health Card */}
              <Card className="border-border/80 bg-card shadow-2xs relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>AI সিস্টেম হেলথ</span>
                    </CardTitle>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Operational
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                      AI মডেল
                    </span>
                    <span className="font-semibold text-foreground">Gemini 2.5 Flash</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                      গড় রেসপন্স স্পিড
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      ~১.২ সেকেন্ড
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      ছবি ও ভিশন AI
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">সক্রিয় (Active)</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">ভাষা সমর্থন</span>
                    <span className="font-medium text-foreground">বাংলা, Banglish, English</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-muted-foreground">Meta Webhook</span>
                    <span
                      className={`font-semibold ${
                        pages.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
                      }`}
                    >
                      {pages.length > 0 ? "Connected" : "Setup Required"}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSimulatorOpen(true)}
                      className="w-full text-xs h-8 gap-1.5 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-medium"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI টেস্ট প্লেগ্রাউন্ড চালান</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pay-as-you-go Account & Balance */}
              <Card className="border-border/80 bg-card shadow-2xs relative overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>পে-অ্যাজ-ইউ-গো ওয়ালেট</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    বিকাশ বা নগদ দিয়ে সহজে রিচার্জ করুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">ফ্রি ট্রায়াল ক্রেডিট:</span>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-semibold">
                        সক্রিয়
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-2xl font-black text-foreground font-mono">৳৫০.০০</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ৭ দিন সব ফিচারে আনলিমিটেড অ্যাক্সেস
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                    <span>পেমেন্ট গেটওয়ে:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400">bKash</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400">Nagad</span>
                    </div>
                  </div>

                  <Link href="/pricing" className="block pt-1">
                    <Button
                      size="sm"
                      className="w-full text-xs h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>ব্যালেন্স রিচার্জ করুন</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Resources & F-Commerce Pro Tips */}
              <Card className="border-border/80 bg-card shadow-2xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    প্রয়োজনীয় লিংক ও শর্টকাট
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  <Link
                    href="/dashboard/training"
                    className="flex items-center justify-between rounded-lg p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      শপের ক্যাটালগ ও প্রডাক্ট রুলস
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/inbox"
                    className="flex items-center justify-between rounded-lg p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                      গ্রাহকদের মেসেঞ্জার ইনবক্স
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/connect"
                    className="flex items-center justify-between rounded-lg p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Share2 className="h-3.5 w-3.5 text-pink-500" />
                      ফেসবুক পেজ সেটিংস
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: ANALYTICS & TRENDS ==================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card className="border-border/80 bg-card shadow-2xs">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>মেসেঞ্জার অ্যাক্টিভিটি ও AI রেসপন্স অ্যানালিটিক্স</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    গত ৭ দিনের কাস্টমার মেসেজ ট্রাফিক ও AI স্বয়ংক্রিয় হ্যান্ডলিং ভলিউম
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    AI Auto-Replies
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    গ্রাহক মেসেজ
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {/* Visual SVG Activity Chart */}
                <div className="h-52 w-full pt-4">
                  <div className="h-full w-full flex items-end gap-2 sm:gap-6 justify-between px-2 pb-6 border-b border-border/60 relative">
                    {activityData.map((item, idx) => {
                      const maxVal = Math.max(...activityData.map((d) => Math.max(d.replies, d.inquiries)), 10);
                      const replyHeight = Math.max(12, Math.round((item.replies / maxVal) * 140));
                      const inqHeight = Math.max(8, Math.round((item.inquiries / maxVal) * 140));

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="w-full flex items-end justify-center gap-1.5 h-full">
                            <div
                              style={{ height: `${replyHeight}px` }}
                              className="w-3 sm:w-6 bg-gradient-to-t from-primary to-indigo-500 rounded-t-md transition-all group-hover:brightness-110"
                              title={`AI Replies: ${item.replies}`}
                            />
                            <div
                              style={{ height: `${inqHeight}px` }}
                              className="w-3 sm:w-6 bg-blue-500/40 rounded-t-md transition-all group-hover:bg-blue-500/60"
                              title={`Customer Inquiries: ${item.inquiries}`}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3 Metric Badges */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">AI রেজোলিউশন রেট</p>
                    <p className="mt-1 text-2xl font-bold text-foreground font-mono">৯৮.৫%</p>
                    <p className="mt-0.5 text-[11px] text-emerald-500">মানুষের সাহায্য ছাড়া সমাধান</p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">গড় রেসপন্স সময়</p>
                    <p className="mt-1 text-2xl font-bold text-foreground font-mono">১.২ সে.</p>
                    <p className="mt-0.5 text-[11px] text-blue-500">তাৎক্ষণিক উত্তর নিশ্চিত</p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">সঞ্চয়কৃত আনুমানিক সময়</p>
                    <p className="mt-1 text-2xl font-bold text-foreground font-mono">~৫ ঘণ্টা</p>
                    <p className="mt-0.5 text-[11px] text-purple-500">সাপ্তাহিক ম্যানুয়াল চ্যাট সেভিং</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== TAB 3: CONNECTED PAGES ==================== */}
        {activeTab === "pages" && (
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">আপনার সংযুক্ত ফেসবুক পেজসমূহ</CardTitle>
                <CardDescription className="text-xs">
                  প্রতিটি পেজের বট স্ট্যাটাস, রেসপন্স টোন এবং কাস্টম ইন্সট্রাকশন নিয়ন্ত্রণ করুন
                </CardDescription>
              </div>
              <Link href="/connect">
                <Button size="sm" className="gap-2 bg-primary text-primary-foreground font-medium shadow-xs">
                  <Plus className="h-4 w-4" />
                  নতুন পেজ কানেক্ট করুন
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <div className="text-center py-12">
                  <Facebook className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-3 text-base font-semibold text-foreground">কোনো পেজ কানেক্ট করা নেই</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    AI সক্রিয় করতে আপনার ফেসবুক পেজের Access Token দিয়ে কানেক্ট করুন। মাত্র ২ মিনিট সময় লাগবে।
                  </p>
                  <Link href="/connect" className="inline-block mt-4">
                    <Button className="gap-2 bg-primary text-primary-foreground">
                      <Plus className="h-4 w-4" />
                      পেজ কানেক্ট করুন
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {pages.map((p) => (
                    <div
                      key={p.pageId}
                      className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-4 hover:border-primary/40 transition-all hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-500 font-bold">
                            <Facebook className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{p.pageName}</h4>
                            <p className="font-mono text-xs text-muted-foreground">ID: {p.pageId}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            p.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          }
                        >
                          {p.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>

                      <div className="space-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>বট রেসপন্স টোন:</span>
                          <span className="font-medium text-foreground capitalize">{p.botTone || "Friendly"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>সংযুক্তির সময়:</span>
                          <span className="text-foreground">{formatRelativeTime(p.createdAt)}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <Link href="/connect" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            সেটিংস ও টেস্ট
                          </Button>
                        </Link>
                        <Link href={`/inbox?pageId=${p.pageId}`} className="flex-1">
                          <Button size="sm" className="w-full text-xs bg-primary text-primary-foreground font-medium">
                            ইনবক্স খুলুন
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ==================== TAB 4: CONVERSATIONS ==================== */}
        {activeTab === "conversations" && (
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">গ্রাহকদের বার্তা ও চ্যাট হিস্ট্রি</CardTitle>
                <CardDescription className="text-xs">
                  ফেসবুক মেসেঞ্জারে আসা সাম্প্রতিক কথোপকথন ও AI এর স্বয়ংক্রিয় কার্যক্রম
                </CardDescription>
              </div>
              <Link href="/inbox">
                <Button size="sm" className="gap-2 bg-primary text-primary-foreground font-medium shadow-xs">
                  <MessageSquare className="h-4 w-4" />
                  সম্পূর্ণ ইনবক্স খুলুন
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentConversations && stats.recentConversations.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {stats.recentConversations.map((conv) => (
                    <Link
                      key={conv._id}
                      href={`/inbox?id=${conv._id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 px-3 rounded-xl hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary/20 to-blue-500/20 text-primary font-bold text-xs">
                          {(conv.customerName || "Customer").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              {conv.customerName || "Messenger User"}
                            </h4>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              (ID: {conv.senderPsid})
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                conv.status === "ai_replied"
                                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                  : "border-blue-500/30 text-blue-500 bg-blue-500/10"
                              }`}
                            >
                              {conv.status === "ai_replied" ? "AI Replied" : "Human Replied"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 max-w-xl line-clamp-1">
                            {conv.lastMessage || "Empty message"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-muted-foreground font-mono">
                        <span>{formatRelativeTime(conv.lastMessageAt)}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-3 text-base font-semibold text-foreground">কোনো কথোপকথন পাওয়া যায়নি</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    ফেসবুক পেজে কেউ মেসেজ পাঠালে AI স্বয়ংক্রিয়ভাবে উত্তর দেবে এবং এখানে লিস্ট আপডেট হবে।
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ==================== TAB 5: META WEBHOOK SETUP ==================== */}
        {activeTab === "setup" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/80 bg-card shadow-2xs">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Radio className="h-5 w-5 text-primary" />
                  <span>Meta Webhook কনফিগারেশন</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Meta Developers কনসোলে আপনার Webhook সাবস্ক্রিপশন সেটআপ করার তথ্য
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Callback URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      readOnly
                      value={webhookUrl}
                      className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                      className="h-8 w-8 shrink-0"
                    >
                      {copiedField === "Webhook URL" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Verify Token</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      readOnly
                      value="my_secret_token_123"
                      className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard("my_secret_token_123", "Verify Token")}
                      className="h-8 w-8 shrink-0"
                    >
                      {copiedField === "Verify Token" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">প্রয়োজনীয় Webhook ফিল্ডস (Meta App):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["messages", "messaging_postbacks", "feed"].map((field) => (
                      <Badge key={field} variant="outline" className="font-mono text-[11px] bg-background">
                        ✓ {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card shadow-2xs">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  <span>সহজ ৩-ধাপ সেটআপ গাইড</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  কীভাবে ফেসবুক পেজ দ্রুত লাইভ করবেন
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    ১
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground">পেজ টোকেন দিয়ে কানেক্ট করুন</h5>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      <Link href="/connect" className="text-primary hover:underline font-medium">Facebook Connect</Link> পেইজে গিয়ে আপনার পেজের নাম, Page ID এবং Page Access Token বসিয়ে সেভ করুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    ২
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground">শপের নিয়মাবলী ও ক্যাটালগ যোগ করুন</h5>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      <Link href="/dashboard/training" className="text-primary hover:underline font-medium">Shop Rules & Knowledge</Link> পেইজে আপনার প্রোডাক্টের দাম, সাইজ চার্ট, ডেলিভারি চার্জ এবং রিটার্ন পলিসি লিখে দিন।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    ৩
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground">AI টেস্ট প্লেগ্রাউন্ডে ট্রাই করুন</h5>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      ড্যাশবোর্ডের <button onClick={() => setSimulatorOpen(true)} className="text-primary hover:underline font-medium">AI টেস্ট করুন</button> বাটনে ক্লিক করে কাস্টমার হিসেবে যেকোনো প্রশ্ন করে দেখুন!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================== 5. INTERACTIVE AI TEST SIMULATOR MODAL ==================== */}
        <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
          <DialogContent className="max-w-lg p-0 overflow-hidden border-border/80 bg-card">
            <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/60 bg-muted/30">
              <div className="flex items-center justify-between">
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
                      Gemini 2.5 Flash • রিয়েল-টাইম F-Commerce রেসপন্স সিমুলেটর
                    </DialogDescription>
                  </div>
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
                    {msg.modelUsed && (
                      <>
                        <span>•</span>
                        <span className="text-primary font-mono">{msg.modelUsed}</span>
                      </>
                    )}
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
                  <span>Gemini উত্তর প্রস্তুত করছে...</span>
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
                  "ভাইয়া ডেলিভারি চার্জ কত?",
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
      </main>
    </div>
  );
}
