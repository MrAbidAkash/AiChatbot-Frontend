"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function Dashboard({ session }: DashboardProps) {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [pages, setPages] = useState<ConnectedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "conversations" | "setup">("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
    toast.success(`${fieldName} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  স্বাগতম, {session.user.name || "Merchant"} 👋
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  আপনার F-Commerce AI সেলস এজেন্ট ও মেসেঞ্জার পারফর্ম্যান্স ড্যাশবোর্ড
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="gap-2 text-xs h-9"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                <Link href="/dashboard/training">
                  <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    AI ট্রেনিং ও নিয়ম
                  </Button>
                </Link>

                <Link href="/inbox">
                  <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                    Customer Inbox
                  </Button>
                </Link>

                <Link href="/connect">
                  <Button
                    size="sm"
                    className="gap-2 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Connect Page
                  </Button>
                </Link>
              </div>
            </div>

            {/* View Tabs */}
            <div className="mt-6 flex flex-wrap gap-1.5 border-b border-border pb-3">
              {[
                { id: "overview", label: "Overview ড্যাশবোর্ড" },
                { id: "pages", label: `কানেক্টেড পেজ (${pages.length})` },
                { id: "conversations", label: `সাম্প্রতিক কথোপকথন (${stats?.recentConversations?.length || 0})` },
                { id: "setup", label: "Meta Webhook সেটিংস" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Onboarding Checklist / Setup Reminder (Shown only when setup is incomplete) */}
          {pages.length === 0 && !loading && (
            <Card className="mb-8 border-primary/30 bg-primary/5 shadow-md">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary mt-0.5">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      আপনার Facebook Page এখনও কানেক্ট করা হয়নি
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      AI স্বয়ংক্রিয়ভাবে মেসেজের উত্তর দিতে এবং COD অর্ডার নিতে আপনার ফেসবুক পেজটি কানেক্ট করুন। সময় লাগবে মাত্র ২ মিনিট।
                    </p>
                  </div>
                </div>
                <Link href="/connect" className="shrink-0 w-full sm:w-auto">
                  <Button size="sm" className="w-full gap-2 bg-primary text-primary-foreground">
                    <Facebook className="h-4 w-4" />
                    পেজ কানেক্ট করুন
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* 4 Focused KPI Metrics */}
          <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-muted-foreground">AI Auto-Replies</p>
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {loading ? "..." : (stats?.totalAiReplies || 0).toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Gemini AI Active</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-muted-foreground">মোট কথোপকথন</p>
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {loading ? "..." : (stats?.totalConversations || 0).toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{stats?.totalMessages || 0} total messages</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-muted-foreground">কানেক্টেড পেজ</p>
                  <div className="rounded-lg bg-pink-500/10 p-2 text-pink-400">
                    <Facebook className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {loading ? "..." : pages.length}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={pages.length > 0 ? "text-green-400 font-medium" : "text-yellow-400"}>
                    {pages.length > 0 ? "সংযুক্ত ও লাইভ" : "কানেকশন নেই"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-muted-foreground">শপের নিয়ম ও ক্যাটালগ</p>
                  <div className="rounded-lg bg-accent/10 p-2 text-accent">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {loading ? "..." : (stats?.totalDocuments || 0)}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Knowledge Base indexed</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Real Connected Pages & Inquiries (8 cols) */}
              <div className="space-y-6 lg:col-span-8">
                {/* Real Connected Pages Card */}
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-400" />
                        আপনার Facebook Pages
                      </CardTitle>
                      <CardDescription className="text-xs">
                        AI যে পেজগুলোতে স্বয়ংক্রিয়ভাবে মেসেজ ও কমেন্ট রিপ্লাই দিচ্ছে
                      </CardDescription>
                    </div>
                    <Link href="/connect">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                        <Plus className="h-3.5 w-3.5" />
                        নতুন পেজ
                      </Button>
                    </Link>
                  </CardHeader>

                  <CardContent className="pt-2">
                    {pages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Facebook className="h-6 w-6" />
                        </div>
                        <h4 className="mt-3 text-sm font-semibold text-foreground">
                          কোনো Facebook Page পাওয়া যায়নি
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                          ফেসবুক পেজ কানেক্ট করলে AI কাস্টমারের দাম, সাইজ, স্টক ও ক্যাশ অন ডেলিভারি অর্ডার স্বয়ংক্রিয়ভাবে হ্যান্ডেল করবে।
                        </p>
                        <Link href="/connect" className="inline-block mt-4">
                          <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
                            <Plus className="h-4 w-4" />
                            ফেসবুক পেজ কানেক্ট করুন
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pages.map((page) => (
                          <div
                            key={page.pageId}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3.5 transition-colors hover:border-primary/40"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
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
                                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                                        : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                                    }`}
                                  >
                                    {page.isActive ? "সক্রিয় (Active)" : "বিরত (Paused)"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  <span className="font-mono text-[11px]">ID: {page.pageId}</span>
                                  <span>•</span>
                                  <span>টোন: {page.botTone || "Friendly"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <Link href={`/connect`}>
                                <Button variant="ghost" size="sm" className="text-xs h-8">
                                  Manage
                                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Real Recent Inquiries Card */}
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        সাম্প্রতিক কাস্টমার ইনকোয়ারি
                      </CardTitle>
                      <CardDescription className="text-xs">
                        আপনার পেজে আসা সাম্প্রতিক গ্রাহক বার্তা ও AI এর উত্তর
                      </CardDescription>
                    </div>
                    <Link href="/inbox">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                        সব দেখুন Inbox
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardHeader>

                  <CardContent className="pt-2">
                    {stats?.recentConversations && stats.recentConversations.length > 0 ? (
                      <div className="divide-y divide-border">
                        {stats.recentConversations.map((conv) => (
                          <Link
                            key={conv._id}
                            href={`/inbox?id=${conv._id}`}
                            className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-muted/30 px-2 rounded-lg -mx-2"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {(conv.customerName || "Customer").slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {conv.customerName || "Messenger User"}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${
                                      conv.status === "ai_replied"
                                        ? "border-green-500/30 text-green-400"
                                        : conv.status === "human_replied"
                                          ? "border-blue-500/30 text-blue-400"
                                          : "border-yellow-500/30 text-yellow-400"
                                    }`}
                                  >
                                    {conv.status === "ai_replied" ? "AI Replied" : conv.status === "human_replied" ? "Human" : "Pending"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                                  {conv.lastMessage || "No messages yet"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
                        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/60" />
                        <h4 className="mt-2 text-sm font-medium text-foreground">
                          কোনো মেসেজ নেই
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          আপনার পেজে কাস্টমাররা মেসেজ পাঠালে এখানে লাইভ দেখতে পাবেন।
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: AI Engine Health & Quick Actions (4 cols) */}
              <div className="space-y-6 lg:col-span-4">
                {/* AI System Status */}
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-400" />
                      AI সিস্টেম স্ট্যাটাস
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-muted-foreground">AI মডেল:</span>
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Gemini 2.5 Flash
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-muted-foreground">ভাষা সমর্থন:</span>
                      <span className="font-medium text-foreground">বাংলা, Banglish, English</span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                      <span className="text-muted-foreground">ছবি ও ভিশন AI:</span>
                      <span className="text-green-400 font-medium">সক্রিয় (Active)</span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-muted-foreground">Meta Webhook:</span>
                      <span className={pages.length > 0 ? "text-green-400 font-medium" : "text-yellow-400 font-medium"}>
                        {pages.length > 0 ? "Connected" : "Waiting for setup"}
                      </span>
                    </div>

                    <div className="pt-2">
                      <Link href="/connect">
                        <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1.5">
                          <Sliders className="h-3.5 w-3.5" />
                          AI টেস্ট প্লেগ্রাউন্ড
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Pay-as-you-go Balance Card */}
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      পে-অ্যাজ-ইউ-গো একাউন্ট
                    </CardTitle>
                    <CardDescription className="text-xs">
                      বিকাশ বা নগদ দিয়ে সহজে রিচার্জ করুন
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">ফ্রি ট্রায়াল ব্যালেন্স:</span>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[11px]">
                          সক্রিয় (Active)
                        </Badge>
                      </div>
                      <p className="mt-2 text-xl font-bold text-foreground">৳৫০.০০</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        ৭ দিন সব ফিচারে আনলিমিটেড অ্যাক্সেস
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <span>পেমেন্ট মাধ্যম:</span>
                      <span className="text-foreground font-medium">bKash 🟢</span>
                      <span className="text-foreground font-medium">Nagad 🔵</span>
                    </div>

                    <Link href="/pricing" className="block pt-1">
                      <Button size="sm" className="w-full text-xs h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Sparkles className="h-3.5 w-3.5" />
                        ব্যালেন্স রিচার্জ করুন
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Quick Shortcuts */}
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      প্রয়োজনীয় লিংক
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 pt-0">
                    <Link
                      href="/dashboard/training"
                      className="flex items-center justify-between rounded-md p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        শপের ক্যাটালগ ও নিয়মাবলী
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/inbox"
                      className="flex items-center justify-between rounded-md p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                        গ্রাহকদের মেসেঞ্জার ইনবক্স
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/connect"
                      className="flex items-center justify-between rounded-md p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Share2 className="h-3.5 w-3.5 text-pink-400" />
                        ফেসবুক পেজ সেটিংস
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTED PAGES */}
          {activeTab === "pages" && (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">আপনার সংযুক্ত ফেসবুক পেজসমূহ</CardTitle>
                  <CardDescription>
                    প্রতিটি পেজের বট স্ট্যাটাস, রেসপন্স টোন এবং কাস্টম ইন্সট্রাকশন
                  </CardDescription>
                </div>
                <Link href="/connect">
                  <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
                    <Plus className="h-4 w-4" />
                    নতুন পেজ কানেক্ট করুন
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {pages.length === 0 ? (
                  <div className="text-center py-12">
                    <Facebook className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-3 text-base font-semibold text-foreground">কোনো পেজ কানেক্ট করা নেই</h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                      AI সক্রিয় করতে আপনার ফেসবুক পেজের Access Token দিয়ে কানেক্ট করুন।
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
                        className="rounded-xl border border-border bg-muted/20 p-5 space-y-4 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                              <Facebook className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{p.pageName}</h4>
                              <p className="font-mono text-xs text-muted-foreground">Page ID: {p.pageId}</p>
                            </div>
                          </div>
                          <Badge
                            className={
                              p.isActive
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                            }
                          >
                            {p.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>

                        <div className="space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>বট রেসপন্স টোন:</span>
                            <span className="font-medium text-foreground capitalize">{p.botTone || "Friendly"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>সংযুক্তির তারিখ:</span>
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
                            <Button size="sm" className="w-full text-xs bg-primary text-primary-foreground">
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

          {/* TAB 3: CONVERSATIONS */}
          {activeTab === "conversations" && (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">গ্রাহকদের বার্তা ও চ্যাট হিস্ট্রি</CardTitle>
                  <CardDescription>
                    ফেসবুক মেসেঞ্জারে আসা সাম্প্রতিক কথোপকথন
                  </CardDescription>
                </div>
                <Link href="/inbox">
                  <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
                    <MessageSquare className="h-4 w-4" />
                    সম্পূর্ণ ইনবক্স খুলুন
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {stats?.recentConversations && stats.recentConversations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {stats.recentConversations.map((conv) => (
                      <Link
                        key={conv._id}
                        href={`/inbox?id=${conv._id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 font-semibold text-xs">
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
                                    ? "border-green-500/30 text-green-400"
                                    : "border-blue-500/30 text-blue-400"
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

                        <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-muted-foreground">
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
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                      ফেসবুক পেজে কেউ মেসেজ পাঠালে AI স্বয়ংক্রিয়ভাবে উত্তর দেবে এবং এখানে লিস্ট আপডেট হবে।
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 4: SETUP / META WEBHOOK */}
          {activeTab === "setup" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Radio className="h-5 w-5 text-primary" />
                    Meta Webhook কনফিগারেশন
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Meta Developers কনসোলে আপনার Webhook সেটআপ করার তথ্য
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Callback URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        readOnly
                        value={webhookUrl}
                        className="flex-1 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                        className="h-8 w-8 shrink-0"
                      >
                        {copiedField === "Webhook URL" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Verify Token</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        readOnly
                        value="my_secret_token_123"
                        className="flex-1 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard("my_secret_token_123", "Verify Token")}
                        className="h-8 w-8 shrink-0"
                      >
                        {copiedField === "Verify Token" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5">
                    <p className="font-semibold text-foreground">প্রয়োজনীয় Webhook ফিল্ডস (Meta App):</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["messages", "messaging_postbacks", "feed"].map((field) => (
                        <Badge key={field} variant="outline" className="font-mono text-[11px]">
                          ✓ {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">সহজ ৩-ধাপ সেটআপ গাইড</CardTitle>
                  <CardDescription className="text-xs">
                    কীভাবে ফেসবুক পেজ দ্রুত চালু করবেন
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
                        <Link href="/connect" className="text-primary hover:underline">Facebook Connect</Link> পেইজে গিয়ে আপনার পেজের নাম, Page ID এবং Page Access Token বসিয়ে সেভ করুন।
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
                        <Link href="/dashboard/training" className="text-primary hover:underline">Documents & Knowledge</Link> পেইজে আপনার প্রোডাক্টের দাম, ডেলিভারি চার্জ এবং রিটার্ন পলিসি লিখে দিন।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      ৩
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground">AI টেস্ট করুন</h5>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        আপনার পেজের ইনবক্সে কাস্টমার হিসেবে যেকোনো প্রশ্ন করে দেখুন অথবা Connect পেজের টেস্ট কনসোলে সরাসরি ট্রাই করুন।
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
