"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Facebook,
  BookOpen,
  MessageSquare,
  CreditCard,
  Settings,
  RefreshCw,
  LogOut,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Trash2,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Send,
  Sliders,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Database,
  Globe,
  Radio,
  User,
  UserCheck,
  Filter,
  X,
  FileText,
  Clock,
  ArrowUpRight,
  BadgeAlert,
  Bot,
  Gift,
  Coins,
  Wallet,
  PlusCircle,
  History,
  Award,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AdminDashboardProps {
  adminEmail: string;
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "credits" | "pages" | "documents" | "conversations" | "payments" | "developer"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Global / Tab Merchant Filter
  const [userFilter, setUserFilter] = useState<string>("all");

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Search filters
  const [userSearch, setUserSearch] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [convSearch, setConvSearch] = useState("");

  // Inspect modals
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);

  // User 360 Deep Inspection State
  const [inspectingUserId, setInspectingUserId] = useState<string | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailData, setUserDetailData] = useState<any | null>(null);
  const [userModalTab, setUserModalTab] = useState<"pages" | "conversations" | "documents" | "payments">("pages");
  const [userModalSelectedConv, setUserModalSelectedConv] = useState<any | null>(null);

  // Developer AI test state
  const [aiTestPrompt, setAiTestPrompt] = useState("");
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<any | null>(null);

  // Credit Management state
  const [creditsMerchants, setCreditsMerchants] = useState<any[]>([]);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [creditStats, setCreditStats] = useState<any>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [selectedCreditUser, setSelectedCreditUser] = useState<string>("");
  const [grantCreditsAmount, setGrantCreditsAmount] = useState<string>("100");
  const [grantCreditsNote, setGrantCreditsNote] = useState<string>("ফ্রি প্রমোশনাল বোনাস");
  const [grantingCredit, setGrantingCredit] = useState(false);
  const [creditSearch, setCreditSearch] = useState("");
  const [creditFilter, setCreditFilter] = useState<"all" | "zero" | "trial" | "paid">("all");

  // Fetch credits data from API
  const fetchCreditsData = useCallback(async () => {
    try {
      setCreditLoading(true);
      const res = await fetch("/api/admin/credits");
      if (res.ok) {
        const data = await res.json();
        setCreditsMerchants(data.merchants || []);
        setCreditHistory(data.history || []);
        setCreditStats(data.stats || null);
        if (data.merchants && data.merchants.length > 0) {
          setSelectedCreditUser((prev) => prev || data.merchants[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load credits data:", err);
    } finally {
      setCreditLoading(false);
    }
  }, []);

  // Grant credits handler
  const handleGrantCredit = async (overrideUserId?: string, overrideAmount?: number) => {
    const targetUserId = overrideUserId || selectedCreditUser;
    const amount = overrideAmount || parseInt(grantCreditsAmount, 10);

    if (!targetUserId) {
      toast.error("অনুগ্রহ করে একজন মার্চেন্ট সিলেক্ট করুন");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error("সঠিক ক্রেডিট সংখ্যা দিন (০ এর বেশি)");
      return;
    }

    try {
      setGrantingCredit(true);
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          credits: amount,
          note: grantCreditsNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ক্রেডিট যোগ করতে সমস্যা হয়েছে");

      toast.success(data.message || `${amount} টি ক্রেডিট সফলভাবে যুক্ত হয়েছে!`);
      // Refresh credits data & stats
      fetchCreditsData();
      fetchStats();
      fetchTabData("users");
    } catch (err: any) {
      toast.error(err.message || "ক্রেডিট যোগ ব্যর্থ হয়েছে");
    } finally {
      setGrantingCredit(false);
    }
  };

  // Fetch core stats
  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setStats(data);
      if (isRefresh) toast.success("Platform statistics updated");
    } catch (err: any) {
      toast.error("Failed to load admin stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // Fetch specific tab data on demand, supporting optional user filtering
  const fetchTabData = useCallback(async (tabName: string, filterUid?: string) => {
    try {
      const filterParam = filterUid && filterUid !== "all" ? `&userId=${filterUid}` : "";
      const res = await fetch(`/api/admin/data?type=${tabName}${filterParam}`);
      if (res.ok) {
        const data = await res.json();
        if (tabName === "users") setUsers(data.users || []);
        if (tabName === "pages") setPages(data.pages || []);
        if (tabName === "documents") setDocuments(data.documents || []);
        if (tabName === "conversations") setConversations(data.conversations || []);
        if (tabName === "payments") setPayments(data.payments || []);
      }
    } catch (err) {
      console.error(`Error loading ${tabName}:`, err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchTabData("users"); // Always load user directory for merchant filtering
    fetchCreditsData(); // Pre-load credit stats
  }, [fetchStats, fetchTabData, fetchCreditsData]);

  // When active tab or user filter changes, fetch updated dataset
  useEffect(() => {
    if (activeTab === "credits") {
      fetchCreditsData();
    } else if (activeTab !== "overview" && activeTab !== "developer") {
      fetchTabData(activeTab, userFilter);
    }
  }, [activeTab, userFilter, fetchTabData, fetchCreditsData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      toast.success("Logged out from Master Admin");
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Inspect User 360 Action
  const handleInspectUser = async (userId: string) => {
    setInspectingUserId(userId);
    setUserDetailLoading(true);
    setUserModalTab("pages");
    setUserModalSelectedConv(null);

    try {
      const res = await fetch(`/api/admin/data?type=user-detail&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserDetailData(data);
      } else {
        toast.error("Failed to load merchant dossier");
      }
    } catch (err) {
      toast.error("Error retrieving user details");
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleFilterByUser = (userId: string, targetTab?: "pages" | "documents" | "conversations") => {
    setUserFilter(userId);
    if (targetTab) {
      setActiveTab(targetTab);
    }
    setInspectingUserId(null);
    const targetUser = users.find((u) => u.id === userId);
    toast.info(`Filtered view to merchant: ${targetUser?.name || targetUser?.email || userId}`);
  };

  const handleClearUserFilter = () => {
    setUserFilter("all");
    toast.success("Showing all merchants' data");
  };

  const handleTogglePage = async (id: string) => {
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-page", id }),
      });
      if (res.ok) {
        toast.success("Page status updated");
        fetchTabData("pages", userFilter);
        fetchStats();
        // Also update local userDetailData if inspecting this user
        if (userDetailData && userDetailData.pages) {
          setUserDetailData({
            ...userDetailData,
            pages: userDetailData.pages.map((p: any) =>
              p.id === id ? { ...p, isActive: !p.isActive } : p,
            ),
          });
        }
      }
    } catch {
      toast.error("Failed to update page");
    }
  };

  const handleDeletePage = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to unlink and remove page "${name}"?`)) return;
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-page", id }),
      });
      if (res.ok) {
        toast.success("Page deleted");
        fetchTabData("pages", userFilter);
        fetchStats();
        if (userDetailData && userDetailData.pages) {
          setUserDetailData({
            ...userDetailData,
            pages: userDetailData.pages.filter((p: any) => p.id !== id),
          });
        }
      }
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Delete document "${title}" from platform?`)) return;
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-doc", id }),
      });
      if (res.ok) {
        toast.success("Document removed");
        fetchTabData("documents", userFilter);
        fetchStats();
        if (userDetailData && userDetailData.documents) {
          setUserDetailData({
            ...userDetailData,
            documents: userDetailData.documents.filter((d: any) => d.id !== id),
          });
        }
      }
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const handleTestAi = async () => {
    if (!aiTestPrompt.trim() || aiTestLoading) return;
    setAiTestLoading(true);
    setAiTestResult(null);

    const startTime = Date.now();
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test-ai",
          data: { message: aiTestPrompt },
        }),
      });

      const data = await res.json();
      const latency = Date.now() - startTime;

      if (res.ok) {
        setAiTestResult({ ...data, latency });
        toast.success(`AI Response generated in ${latency}ms`);
      } else {
        toast.error(data.error || "AI Generation failed");
      }
    } catch (err: any) {
      toast.error("AI sandbox request error");
    } finally {
      setAiTestLoading(false);
    }
  };

  // Helper for active filtered user object
  const activeFilteredUser = userFilter !== "all" ? users.find((u) => u.id === userFilter) : null;

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white relative">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[360px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/60 bg-[#080b11]/80 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                ChatTime AI <span className="text-emerald-400 font-semibold">Master Admin</span>
              </h1>
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Super Admin
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Confidential SaaS Management & Operations Suite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {activeFilteredUser && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
              <Filter className="h-3 w-3" />
              <span>Merchant:</span>
              <span className="font-semibold">{activeFilteredUser.name || activeFilteredUser.email}</span>
              <button
                onClick={handleClearUserFilter}
                className="ml-1 hover:text-white"
                title="Clear filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">{adminEmail}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats(true);
              if (activeTab === "credits") {
                fetchCreditsData();
              } else if (activeTab !== "overview" && activeTab !== "developer") {
                fetchTabData(activeTab, userFilter);
              }
            }}
            disabled={refreshing}
            className="h-8 gap-1.5 text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-8 gap-1.5 text-xs bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-1">
          {[
            { id: "overview", label: "Executive Overview", icon: Activity, count: null },
            { id: "users", label: "Registered Users", icon: Users, count: stats?.metrics?.totalUsers },
            { id: "credits", label: "Free Credits & Wallets", icon: Gift, count: creditStats?.totalGrantsCount || null },
            { id: "pages", label: "Connected Pages", icon: Facebook, count: stats?.metrics?.totalPages },
            { id: "documents", label: "Knowledge Base", icon: BookOpen, count: stats?.metrics?.totalDocuments },
            { id: "conversations", label: "Live Conversations", icon: MessageSquare, count: stats?.metrics?.totalConversations },
            { id: "payments", label: "bKash Payments", icon: CreditCard, count: stats?.metrics?.totalPaymentsCount },
            { id: "developer", label: "Webhook & System", icon: Settings, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800/90 text-white border border-slate-700/80 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1 rounded-lg ${isActive ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== null && tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Active Filter Pill in Sidebar */}
          {userFilter !== "all" && (
            <div className="pt-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="flex items-center justify-between text-emerald-400 mb-1 font-semibold">
                  <span className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    Filtered View
                  </span>
                  <button onClick={handleClearUserFilter} className="text-slate-400 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-white font-medium truncate">{activeFilteredUser?.name || "Merchant"}</p>
                <p className="text-[11px] text-slate-400 truncate">{activeFilteredUser?.email}</p>
                <div className="mt-2 pt-2 border-t border-emerald-500/20 flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInspectUser(userFilter)}
                    className="h-6 text-[10px] px-2 text-emerald-300 hover:bg-emerald-500/20 w-full"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Inspect 360°
                  </Button>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Active Global User Filter Notification Banner */}
          {userFilter !== "all" && activeFilteredUser && activeTab !== "overview" && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Viewing Merchant Scoped Data:</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      {activeFilteredUser.name || "Merchant"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeFilteredUser.email} • ID: <span className="font-mono text-slate-300">{activeFilteredUser.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInspectUser(userFilter)}
                  className="h-7 text-xs bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View 360° Dossier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearUserFilter}
                  className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Reset to All
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Metric KPI Cards */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                <Card className="bg-slate-900/60 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Total Registered Users</span>
                      <Users className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-white">
                      {loading ? "..." : stats?.metrics?.totalUsers || 0}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">Platform merchants</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Connected Pages</span>
                      <Facebook className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-white">
                      {loading ? "..." : stats?.metrics?.totalPages || 0}
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-400 font-medium">
                      {stats?.metrics?.activePages || 0} Pages Currently Active
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>AI Auto-Replies</span>
                      <Zap className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-white">
                      {loading ? "..." : stats?.metrics?.totalAiReplies || 0}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {stats?.metrics?.totalMessages || 0} Total Messages Logged
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Ingested Documents</span>
                      <BookOpen className="h-4 w-4 text-purple-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-white">
                      {loading ? "..." : stats?.metrics?.totalDocuments || 0}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">AI Knowledge Grounding</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Total Revenue (bKash)</span>
                      <CreditCard className="h-4 w-4 text-pink-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-white">
                      ৳{loading ? "..." : (stats?.metrics?.totalRevenue || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-400 font-medium">
                      {stats?.metrics?.totalPaymentsCount || 0} Completed Transactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>AI Model Engine</span>
                      <Sparkles className="h-4 w-4 text-teal-400" />
                    </div>
                    <p className="mt-2 text-base font-bold font-mono text-emerald-400 truncate">
                      Gemini 3.5 Flash Lite
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">&lt; 1.5s Response Speed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Users */}
                <Card className="bg-slate-900/60 border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-400" />
                        <span>Recently Registered Users</span>
                      </CardTitle>
                      <button
                        onClick={() => setActiveTab("users")}
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        View all <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 divide-y divide-slate-800/60">
                    {stats?.recentUsers?.map((u: any) => (
                      <div
                        key={u.id}
                        onClick={() => handleInspectUser(u.id)}
                        className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/30 px-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-white hover:text-emerald-400 transition-colors">
                            {u.name || "Unnamed User"}
                          </p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
                          </span>
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Platform Conversations */}
                <Card className="bg-slate-900/60 border-slate-800">
                  <CardHeader className="pb-3 border-b border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <span>Recent Customer Conversations</span>
                      </CardTitle>
                      <button
                        onClick={() => setActiveTab("conversations")}
                        className="text-xs text-blue-400 hover:underline flex items-center gap-0.5"
                      >
                        View all <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 divide-y divide-slate-800/60">
                    {stats?.recentConversations?.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedConv(c)}
                        className="py-2.5 flex items-center justify-between text-xs gap-3 hover:bg-slate-800/30 px-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white truncate">{c.customerName || "Customer"}</p>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-700 bg-slate-800 text-slate-300">
                              {c.pageName || "Facebook Page"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-sm">
                            {c.lastMessage || "No message content"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 shrink-0 ${
                            c.status === "ai_replied"
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : "border-blue-500/30 text-blue-400 bg-blue-500/10"
                          }`}
                        >
                          {c.status === "ai_replied" ? "AI Replied" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: REGISTERED USERS (USER-WISE DATA HUB) */}
          {/* ========================================================= */}
          {activeTab === "users" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search users by name, email or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 bg-slate-900 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300">
                    {users.length} Registered Merchants
                  </Badge>
                </div>
              </div>

              <Card className="bg-slate-900/60 border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Merchant User</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3 text-center">Connected Pages</th>
                        <th className="p-3 text-center">Knowledge Docs</th>
                        <th className="p-3 text-center">Conversations</th>
                        <th className="p-3">Registered</th>
                        <th className="p-3 text-right">User Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {users
                        .filter(
                          (u) =>
                            u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.id?.toLowerCase().includes(userSearch.toLowerCase()),
                        )
                        .map((u) => (
                          <tr
                            key={u.id}
                            className={`hover:bg-slate-800/30 transition-colors ${
                              userFilter === u.id ? "bg-emerald-500/5" : ""
                            }`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/20">
                                  {(u.name || u.email || "M").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>{u.name || "Merchant"}</span>
                                    {userFilter === u.id && (
                                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] px-1 py-0">
                                        Filtered
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <span>ID: {u.id.slice(0, 10)}...</span>
                                    <button
                                      onClick={() => copyToClipboard(u.id, "User ID")}
                                      className="hover:text-slate-300"
                                    >
                                      <Copy className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3 font-mono text-[11px] text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <span>{u.email}</span>
                                <button
                                  onClick={() => copyToClipboard(u.email, "Email")}
                                  className="text-slate-500 hover:text-slate-300"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            <td className="p-3 text-center font-mono">
                              <button
                                onClick={() => handleFilterByUser(u.id, "pages")}
                                className="group inline-flex items-center gap-1"
                                title="View this user's pages"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] group-hover:bg-blue-500/20 transition-all cursor-pointer"
                                >
                                  <Facebook className="h-2.5 w-2.5 mr-1" />
                                  {u.pagesCount}
                                  {u.activePagesCount ? ` (${u.activePagesCount} active)` : ""}
                                </Badge>
                              </button>
                            </td>

                            <td className="p-3 text-center font-mono">
                              <button
                                onClick={() => handleFilterByUser(u.id, "documents")}
                                className="group inline-flex items-center gap-1"
                                title="View this user's documents"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] group-hover:bg-purple-500/20 transition-all cursor-pointer"
                                >
                                  <BookOpen className="h-2.5 w-2.5 mr-1" />
                                  {u.docsCount}
                                </Badge>
                              </button>
                            </td>

                            <td className="p-3 text-center font-mono">
                              <button
                                onClick={() => handleFilterByUser(u.id, "conversations")}
                                className="group inline-flex items-center gap-1"
                                title="View this user's conversations"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] group-hover:bg-emerald-500/20 transition-all cursor-pointer"
                                >
                                  <MessageSquare className="h-2.5 w-2.5 mr-1" />
                                  {u.conversationsCount}
                                </Badge>
                              </button>
                            </td>

                            <td className="p-3 text-[11px] text-slate-500 font-mono">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCreditUser(u.id);
                                    setActiveTab("credits");
                                  }}
                                  className="h-7 text-xs bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20 font-medium"
                                  title="মার্চেন্টকে ফ্রি ক্রেডিট উপহার দিন"
                                >
                                  <Gift className="h-3 w-3 mr-1" />
                                  Gift Credits
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleInspectUser(u.id)}
                                  className="h-7 text-xs bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 font-semibold"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Inspect 360°
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: FREE CREDITS & WALLETS (ADMIN GRANT SYSTEM) */}
          {/* ========================================================= */}
          {activeTab === "credits" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/20 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Gift className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      Free Credits & Merchant Wallets
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                        Admin Gift Suite
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      মার্চেন্টদের অ্যাকাউন্টে সরাসরি ফ্রি ক্রেডিট প্রদান করুন এবং তাদের লাইভ ওয়ালেট ও খরচ পর্যবেক্ষণ করুন।
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCreditsData}
                  disabled={creditLoading}
                  className="h-8 text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white shrink-0 gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${creditLoading ? "animate-spin text-amber-400" : ""}`} />
                  <span>ওয়ালেট রিফ্রেশ</span>
                </Button>
              </div>

              {/* 4 Top KPI Stat Cards */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>মোট ফ্রি গিফট ক্রেডিট</span>
                      <Coins className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-white">
                      {creditLoading ? "..." : (creditStats?.totalGiftedCredits || 0).toLocaleString()} টি
                    </p>
                    <p className="mt-1 text-[11px] text-amber-400 font-medium">
                      ৳{((creditStats?.totalGiftedCredits || 0) * 0.5).toFixed(2)} সমমূল্য
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>সফল অনুদান সংখ্যা</span>
                      <Award className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-white">
                      {creditLoading ? "..." : creditStats?.totalGrantsCount || 0} বার
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">অ্যাডমিন কর্তৃক প্রদত্ত</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>মোট সক্রিয় মার্চেন্ট</span>
                      <Users className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-white">
                      {creditsMerchants.length} জন
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {creditsMerchants.filter((m) => m.wallet?.remainingReplies > 0).length} জনের ব্যালেন্স অবশিষ্ট আছে
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>শূন্য ব্যালেন্স মার্চেন্ট</span>
                      <BadgeAlert className="h-4 w-4 text-rose-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold font-mono text-rose-400">
                      {creditsMerchants.filter((m) => m.wallet?.remainingReplies === 0).length} জন
                    </p>
                    <p className="mt-1 text-[11px] text-rose-400/80">রিচার্জ বা ফ্রি ক্রেডিট প্রয়োজন</p>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Section: Quick Grant Card & Merchant Directory */}
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Left: Give Free Credits Card (5 cols) */}
                <div className="lg:col-span-5">
                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl sticky top-20">
                    <CardHeader className="pb-3 border-b border-slate-800/80">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                        <PlusCircle className="h-4 w-4 text-amber-400" />
                        <span>মার্চেন্টকে ফ্রি ক্রেডিট প্রদান (Give Free Credits)</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        যেকোনো মার্চেন্টকে এক ক্লিকে ফ্রি মেসেজ ক্রেডিট দিন
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
                      {/* Target User Selector */}
                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">
                          মার্চেন্ট নির্বাচন করুন:
                        </label>
                        <select
                          value={selectedCreditUser}
                          onChange={(e) => setSelectedCreditUser(e.target.value)}
                          className="w-full h-9 rounded-lg bg-slate-950 border border-slate-800 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="">-- মার্চেন্ট সিলেক্ট করুন --</option>
                          {creditsMerchants.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name || "Merchant"} ({m.email}) — বাকি: {m.wallet?.remainingReplies || 0} টি
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Display current user balance info */}
                      {selectedCreditUser && (() => {
                        const target = creditsMerchants.find((m) => m.id === selectedCreditUser);
                        if (!target) return null;
                        return (
                          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">বর্তমান অবশিষ্ট:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {target.wallet?.remainingReplies || 0} টি রিপ্লাই (৳{target.wallet?.remainingBalance || "0.00"})
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">ব্যবহৃত ক্রেডিট:</span>
                              <span className="font-mono text-slate-300">
                                {target.wallet?.usedCredits || 0} টি
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">প্ল্যান স্ট্যাটাস:</span>
                              <Badge className={`text-[9px] py-0 px-1.5 ${
                                target.wallet?.isPaidUser
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : target.wallet?.remainingReplies > 0
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              }`}>
                                {target.wallet?.planTitle || "Free Trial"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Preset Quick Buttons */}
                      <div>
                        <label className="font-semibold text-slate-300 block mb-1.5">
                          দ্রুত অ্যামাউন্ট সিলেক্ট করুন:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { count: "50", label: "+৫০ টি (৳২৫)" },
                            { count: "100", label: "+১০০ টি (৳৫০)" },
                            { count: "250", label: "+২৫০ টি (৳১২৫)" },
                            { count: "500", label: "+৫০০ টি (৳২৫০)" },
                            { count: "1000", label: "+১,০০০ টি (৳৫০০)" },
                            { count: "2500", label: "+২,৫০০ টি (৳১,২৫০)" },
                          ].map((preset) => (
                            <button
                              key={preset.count}
                              type="button"
                              onClick={() => setGrantCreditsAmount(preset.count)}
                              className={`py-1.5 px-2 rounded-lg border text-center text-[11px] font-medium transition-all ${
                                grantCreditsAmount === preset.count
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold shadow-xs"
                                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Credit Amount Input */}
                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">
                          ক্রেডিট সংখ্যা (Custom Replies):
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            value={grantCreditsAmount}
                            onChange={(e) => setGrantCreditsAmount(e.target.value)}
                            placeholder="যেমন: ১০০"
                            className="bg-slate-950 border-slate-800 text-xs h-9 text-white pl-8 font-mono"
                          />
                          <Coins className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          সমমূল্য আনুমানিক: ৳{(parseInt(grantCreditsAmount || "0", 10) * 0.5).toFixed(2)} (৫০ পয়সা/রিপ্লাই)
                        </p>
                      </div>

                      {/* Note / Reason */}
                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">
                          কারণ / রেফারেন্স নোট:
                        </label>
                        <Input
                          type="text"
                          value={grantCreditsNote}
                          onChange={(e) => setGrantCreditsNote(e.target.value)}
                          placeholder="যেমন: বিশেষ ফ্রি ট্রায়াল বোনাস / সাপোর্ট সৌজন্য"
                          className="bg-slate-950 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={() => handleGrantCredit()}
                        disabled={grantingCredit || !selectedCreditUser}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs h-9 shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        {grantingCredit ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ক্রেডিট প্রদান করা হচ্ছে...
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4 mr-1.5" />
                            মার্চেন্টকে ফ্রি ক্রেডিট প্রদান করুন
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Merchants Wallets Directory (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="pb-3 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                          <Wallet className="h-4 w-4 text-emerald-400" />
                          <span>মার্চেন্ট ওয়ালেট ডিরেক্টরি</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          সকল মার্চেন্টের বর্তমান ক্রেডিট ব্যালেন্স ও ব্যবহারের বিবরণ
                        </CardDescription>
                      </div>

                      {/* Search in Wallets */}
                      <div className="relative w-full sm:w-56">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                        <Input
                          placeholder="মার্চেন্ট খুঁজুন..."
                          value={creditSearch}
                          onChange={(e) => setCreditSearch(e.target.value)}
                          className="pl-8 bg-slate-950 border-slate-800 text-xs h-8 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </CardHeader>

                    {/* Filter Pills */}
                    <div className="p-3 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                      {[
                        { id: "all", label: `সকল মার্চেন্ট (${creditsMerchants.length})` },
                        {
                          id: "zero",
                          label: `ব্যালেন্স শেষ (${creditsMerchants.filter((m) => m.wallet?.remainingReplies === 0).length})`,
                        },
                        {
                          id: "trial",
                          label: `ফ্রি ট্রায়াল (${creditsMerchants.filter((m) => !m.wallet?.isPaidUser).length})`,
                        },
                        {
                          id: "paid",
                          label: `পেইড প্যাক (${creditsMerchants.filter((m) => m.wallet?.isPaidUser).length})`,
                        },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setCreditFilter(f.id as any)}
                          className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap font-medium ${
                            creditFilter === f.id
                              ? "bg-slate-800 text-white border-slate-700 shadow-xs"
                              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="p-3">মার্চেন্ট</th>
                            <th className="p-3 text-center">অবশিষ্ট ক্রেডিট</th>
                            <th className="p-3 text-center">ব্যালেন্স (৳)</th>
                            <th className="p-3 text-center">ব্যবহার</th>
                            <th className="p-3 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {creditsMerchants
                            .filter((m) => {
                              const matchesSearch =
                                m.name?.toLowerCase().includes(creditSearch.toLowerCase()) ||
                                m.email?.toLowerCase().includes(creditSearch.toLowerCase()) ||
                                m.id?.toLowerCase().includes(creditSearch.toLowerCase());
                              if (!matchesSearch) return false;
                              if (creditFilter === "zero") return m.wallet?.remainingReplies === 0;
                              if (creditFilter === "trial") return !m.wallet?.isPaidUser;
                              if (creditFilter === "paid") return Boolean(m.wallet?.isPaidUser);
                              return true;
                            })
                            .map((m) => {
                              const remaining = m.wallet?.remainingReplies ?? 0;
                              const isZero = remaining === 0;
                              const isLow = remaining > 0 && remaining <= 20;

                              return (
                                <tr
                                  key={m.id}
                                  className={`hover:bg-slate-800/30 transition-colors ${
                                    selectedCreditUser === m.id ? "bg-amber-500/5" : ""
                                  }`}
                                >
                                  <td className="p-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/20">
                                        {(m.name || m.email || "M").slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-white truncate max-w-[150px]">
                                          {m.name || "Merchant"}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                                          {m.email}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-3 text-center font-mono">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] font-semibold ${
                                        isZero
                                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                          : isLow
                                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                      }`}
                                    >
                                      {remaining} টি বাকি
                                    </Badge>
                                  </td>

                                  <td className="p-3 text-center font-mono font-semibold text-slate-200">
                                    ৳{m.wallet?.remainingBalance || "0.00"}
                                  </td>

                                  <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                                    <span>{m.wallet?.usedCredits || 0}</span>
                                    <span className="text-slate-600"> / </span>
                                    <span>{m.wallet?.totalAllocatedCredits || 0}</span>
                                  </td>

                                  <td className="p-3 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCreditUser(m.id);
                                        toast.info(`"${m.name || m.email}" সিলেক্ট করা হয়েছে`);
                                      }}
                                      className={`h-7 text-xs ${
                                        selectedCreditUser === m.id
                                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold"
                                          : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                                      }`}
                                    >
                                      <Gift className="h-3 w-3 mr-1" />
                                      ক্রেডিট দিন
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Bottom Card: Gift History Audit Log */}
              <Card className="bg-slate-900/80 border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-800/80">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <History className="h-4 w-4 text-amber-400" />
                    <span>ফ্রি ক্রেডিট অনুদানের ইতিহাস (Gift History Audit Log)</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    সাম্প্রতিক অ্যাডমিন কর্তৃক প্রদত্ত সকল ফ্রি ক্রেডিট ও রেফারেন্স নোট
                  </CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">তারিখ ও সময়</th>
                        <th className="p-3">মার্চেন্ট</th>
                        <th className="p-3 text-center">প্রদত্ত ক্রেডিট</th>
                        <th className="p-3 text-center">সমমূল্য (৳)</th>
                        <th className="p-3">কারণ / নোট</th>
                        <th className="p-3 text-right">প্রদানকারী অ্যাডমিন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {creditHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            এখনো কোনো ফ্রি ক্রেডিট রেকর্ড নেই।
                          </td>
                        </tr>
                      ) : (
                        creditHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-mono text-[11px] text-slate-400">
                              {h.createdAt ? new Date(h.createdAt).toLocaleString("bn-BD") : "N/A"}
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-white">{h.userName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{h.userEmail}</p>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold">
                                +{h.credits} টি
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-mono font-semibold text-slate-200">
                              ৳{(h.amount || h.credits * 0.5).toFixed(2)}
                            </td>
                            <td className="p-3 text-slate-300 max-w-xs truncate">
                              {h.note || "Free Promotional Credit"}
                            </td>
                            <td className="p-3 text-right font-mono text-[11px] text-slate-400">
                              {h.adminEmail || "Admin"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CONNECTED FACEBOOK PAGES */}
          {/* ========================================================= */}
          {activeTab === "pages" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search pages by name or Page ID..."
                      value={pageSearch}
                      onChange={(e) => setPageSearch(e.target.value)}
                      className="pl-9 bg-slate-900 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Merchant Filter Dropdown */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium shrink-0">Merchant:</span>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="bg-transparent border-none text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="all" className="bg-slate-900 text-white">All Merchants ({users.length})</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                          {u.name || "Merchant"} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {userFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearUserFilter}
                      className="h-8 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 border border-amber-500/20"
                    >
                      <span>✕ Clear</span>
                    </Button>
                  )}
                </div>

                <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300 self-start sm:self-auto shrink-0">
                  {pages.length} Pages Configured
                </Badge>
              </div>

              {pages.length === 0 ? (
                <Card className="bg-slate-900/40 border-slate-800 p-8 text-center text-xs text-slate-400">
                  <Facebook className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">No Facebook Pages Found</p>
                  <p className="mt-1">
                    {userFilter !== "all"
                      ? "This merchant has not connected any Facebook pages yet."
                      : "No Facebook pages have been connected on the platform."}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {pages
                    .filter(
                      (p) =>
                        p.pageName?.toLowerCase().includes(pageSearch.toLowerCase()) ||
                        p.pageId?.includes(pageSearch),
                    )
                    .map((p) => (
                      <Card key={p.id} className="bg-slate-900/60 border-slate-800 p-4 hover:border-slate-700/80 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                              <Facebook className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white">{p.pageName}</h3>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    p.isActive
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  }`}
                                >
                                  {p.isActive ? "Active (Replying)" : "Paused"}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-300">
                                  Tone: {p.botTone}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                                <span className="flex items-center gap-1">
                                  Page ID: {p.pageId}
                                  <button onClick={() => copyToClipboard(p.pageId, "Page ID")} className="hover:text-white">
                                    <Copy className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                                <span>•</span>
                                <button
                                  onClick={() => handleInspectUser(p.owner?.id || p.userId)}
                                  className="text-emerald-400 hover:underline flex items-center gap-1 font-sans font-medium"
                                  title="Inspect merchant 360°"
                                >
                                  <User className="h-3 w-3" />
                                  <span>Owner: {p.owner?.name || p.owner?.email || "Merchant"}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTogglePage(p.id)}
                              className="text-xs h-8 bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                            >
                              {p.isActive ? "Pause AI" : "Activate AI"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePage(p.id, p.pageName)}
                              className="text-xs h-8 bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: KNOWLEDGE BASE DOCUMENTS */}
          {/* ========================================================= */}
          {activeTab === "documents" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search documents by title or owner..."
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      className="pl-9 bg-slate-900 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Merchant Filter Dropdown */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium shrink-0">Merchant:</span>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="bg-transparent border-none text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="all" className="bg-slate-900 text-white">All Merchants ({users.length})</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                          {u.name || "Merchant"} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {userFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearUserFilter}
                      className="h-8 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 border border-amber-500/20"
                    >
                      <span>✕ Clear</span>
                    </Button>
                  )}
                </div>

                <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300 self-start sm:self-auto shrink-0">
                  {documents.length} Files Ingested
                </Badge>
              </div>

              {documents.length === 0 ? (
                <Card className="bg-slate-900/40 border-slate-800 p-8 text-center text-xs text-slate-400">
                  <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">No Knowledge Base Documents</p>
                  <p className="mt-1">
                    {userFilter !== "all"
                      ? "This merchant has not uploaded any business documents yet."
                      : "No knowledge files exist on the platform."}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {documents
                    .filter(
                      (d) =>
                        d.title?.toLowerCase().includes(docSearch.toLowerCase()) ||
                        d.owner?.email?.toLowerCase().includes(docSearch.toLowerCase()) ||
                        d.owner?.name?.toLowerCase().includes(docSearch.toLowerCase()),
                    )
                    .map((d) => (
                      <Card key={d.id} className="bg-slate-900/60 border-slate-800 p-4 hover:border-slate-700/80 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-white truncate">{d.title}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1 py-0 uppercase font-mono border-slate-700 text-slate-300">
                                  {d.fileType}
                                </Badge>
                                <span>•</span>
                                <span>{d.charCount?.toLocaleString()} chars</span>
                                <span>•</span>
                                <button
                                  onClick={() => handleInspectUser(d.owner?.id || d.userId)}
                                  className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                                  title="Inspect merchant 360°"
                                >
                                  <User className="h-3 w-3" />
                                  <span>{d.owner?.name || d.owner?.email || "Merchant"}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDoc(d)}
                              className="text-xs h-8 bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Inspect
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDoc(d.id, d.title)}
                              className="text-xs h-8 bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: LIVE CONVERSATIONS */}
          {/* ========================================================= */}
          {activeTab === "conversations" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search conversations by customer, page or merchant..."
                      value={convSearch}
                      onChange={(e) => setConvSearch(e.target.value)}
                      className="pl-9 bg-slate-900 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Merchant Filter Dropdown */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400 font-medium shrink-0">Merchant:</span>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="bg-transparent border-none text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="all" className="bg-slate-900 text-white">All Merchants ({users.length})</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                          {u.name || "Merchant"} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {userFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearUserFilter}
                      className="h-8 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 border border-amber-500/20"
                    >
                      <span>✕ Clear</span>
                    </Button>
                  )}
                </div>

                <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300 self-start sm:self-auto shrink-0">
                  {conversations.length} Active Conversations
                </Badge>
              </div>

              {conversations.length === 0 ? (
                <Card className="bg-slate-900/40 border-slate-800 p-8 text-center text-xs text-slate-400">
                  <MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">No Conversations Found</p>
                  <p className="mt-1">
                    {userFilter !== "all"
                      ? "No customer conversations recorded yet for this merchant."
                      : "No customer conversations exist on the platform."}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {conversations
                    .filter(
                      (c) =>
                        c.customerName?.toLowerCase().includes(convSearch.toLowerCase()) ||
                        c.pageName?.toLowerCase().includes(convSearch.toLowerCase()) ||
                        c.lastMessage?.toLowerCase().includes(convSearch.toLowerCase()) ||
                        c.owner?.name?.toLowerCase().includes(convSearch.toLowerCase()) ||
                        c.owner?.email?.toLowerCase().includes(convSearch.toLowerCase()),
                    )
                    .map((c) => (
                      <Card key={c.id} className="bg-slate-900/60 border-slate-800 p-4 hover:border-slate-700/80 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 border border-emerald-500/30">
                              {(c.customerName || "Customer").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-xs font-bold text-white">{c.customerName || "Customer"}</h4>
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-slate-700 bg-slate-800 text-slate-300">
                                  {c.pageName || "Facebook Page"}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 ${
                                    c.status === "ai_replied"
                                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                      : "border-blue-500/30 text-blue-400 bg-blue-500/10"
                                  }`}
                                >
                                  {c.status === "ai_replied" ? "AI Replied" : "Pending"}
                                </Badge>
                                {c.owner && (
                                  <button
                                    onClick={() => handleInspectUser(c.owner.id || c.userId)}
                                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                                    title="Inspect merchant 360°"
                                  >
                                    <User className="h-2.5 w-2.5" />
                                    <span>{c.owner.name || c.owner.email}</span>
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-1 truncate max-w-lg">
                                {c.lastMessage || "No message content"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                            <span className="text-[11px] text-slate-500 font-mono">
                              {c.messagesCount} msgs
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedConv(c)}
                              className="text-xs h-8 bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View Chat
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: BKASH PAYMENTS & BILLING */}
          {/* ========================================================= */}
          {activeTab === "payments" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">bKash Platform Transactions</h3>
                  <p className="text-xs text-slate-400">All customer recharge records via bKash Payment Gateway</p>
                </div>
                <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/30 text-xs">
                  {payments.length} Payments Recorded
                </Badge>
              </div>

              <Card className="bg-slate-900/60 border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Payment ID / TrxID</th>
                        <th className="p-3">Customer Phone</th>
                        <th className="p-3">Customer Email</th>
                        <th className="p-3">Amount (BDT)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-slate-200">
                            <div>{p.trxID}</div>
                            <div className="text-[10px] text-slate-500">{p.paymentID}</div>
                          </td>
                          <td className="p-3 font-mono text-slate-300">{p.customerPhone}</td>
                          <td className="p-3 text-slate-300">{p.customerEmail}</td>
                          <td className="p-3 font-bold text-emerald-400 font-mono">
                            ৳{Number(p.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                p.transactionStatus === "Completed"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {p.transactionStatus}
                            </Badge>
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 font-mono">
                            {p.createdAt ? new Date(p.createdAt).toLocaleString() : "Recent"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: CONFIDENTIAL DEVELOPER & WEBHOOK SETTINGS */}
          {/* ========================================================= */}
          {activeTab === "developer" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-400" />
                  <span>Confidential Technical & Developer Command</span>
                </h3>
                <p className="text-xs text-slate-400">
                  These secrets and endpoints are hidden from regular merchants and visible only here to you.
                </p>
              </div>

              {/* Webhook & Callback Config */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-slate-900/60 border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">Facebook Webhook Callback URL</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          stats?.devConfig?.webhookUrl || "https://chattimeai.com/api/webhook/facebook",
                          "Webhook URL",
                        )
                      }
                      className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copiedField === "Webhook URL" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs text-white bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                    {stats?.devConfig?.webhookUrl || "https://chattimeai.com/api/webhook/facebook"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Paste this into Meta Developer App &rarr; Messenger &rarr; Webhooks &rarr; Callback URL.
                  </p>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">Webhook Verify Token</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          stats?.devConfig?.verifyToken || "chattime_ai_webhook_verify_token_2026",
                          "Verify Token",
                        )
                      }
                      className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copiedField === "Verify Token" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs text-white bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                    {stats?.devConfig?.verifyToken || "chattime_ai_webhook_verify_token_2026"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Paste this into Meta Developer App &rarr; Messenger &rarr; Webhooks &rarr; Verify Token.
                  </p>
                </Card>
              </div>

              {/* Subscriptions & Environment Checklist */}
              <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4">
                <h4 className="text-sm font-semibold text-white">System Diagnostics & Environment Keys</h4>
                <div className="grid gap-3 sm:grid-cols-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px]">Database Connection</p>
                      <p className="font-semibold text-white mt-0.5">MongoDB Atlas</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Connected
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px]">Gemini 3.5 API Key</p>
                      <p className="font-semibold text-white mt-0.5">Google Cloud AI</p>
                    </div>
                    <Badge
                      className={`text-[10px] ${
                        stats?.devConfig?.hasGeminiKey
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {stats?.devConfig?.hasGeminiKey ? "Configured" : "Missing"}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px]">Meta Facebook OAuth</p>
                      <p className="font-semibold text-white mt-0.5">App ID: {stats?.devConfig?.facebookAppId}</p>
                    </div>
                    <Badge
                      className={`text-[10px] ${
                        stats?.devConfig?.hasFacebookSecret
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {stats?.devConfig?.hasFacebookSecret ? "Verified" : "Missing Secret"}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Live Gemini Test Sandbox */}
              <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>Live Gemini AI Response Sandbox</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Test live Gemini flash-lite auto-reply speed and grounding directly from the Admin Panel
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 font-mono">
                    Model: gemini-flash-lite-latest
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a test customer message (e.g., 'What is your delivery charge and return policy?')..."
                      value={aiTestPrompt}
                      onChange={(e) => setAiTestPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleTestAi()}
                      className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-500"
                    />
                    <Button
                      onClick={handleTestAi}
                      disabled={aiTestLoading || !aiTestPrompt.trim()}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shrink-0 gap-1.5"
                    >
                      {aiTestLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Run Prompt</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {aiTestResult && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-emerald-400">AI Generated Response:</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span>Latency: {aiTestResult.latency}ms</span>
                          <span>•</span>
                          <span>Knowledge Grounded: {aiTestResult.knowledgeChars} chars</span>
                        </div>
                      </div>
                      <p className="text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                        {aiTestResult.reply}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 🌟 360° USER / MERCHANT DEEP INSPECTION DIALOG */}
      {/* ========================================================= */}
      <Dialog open={Boolean(inspectingUserId)} onOpenChange={(open) => !open && setInspectingUserId(null)}>
        <DialogContent className="max-w-4xl bg-slate-950 border-slate-800 text-slate-100 p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
          {userDetailLoading || !userDetailData ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading merchant 360° dossier...</p>
            </div>
          ) : (
            <>
              {/* Modal Top Profile Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900 border-b border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 shadow-lg shadow-emerald-500/10">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400 font-bold text-lg">
                        {(userDetailData.user.name || "M").slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-white">
                          {userDetailData.user.name || "Merchant"}
                        </h2>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                          Merchant Profile
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mt-1">
                        <span className="font-mono text-slate-300">{userDetailData.user.email}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          ID: {userDetailData.user.id}
                          <button
                            onClick={() => copyToClipboard(userDetailData.user.id, "Merchant ID")}
                            className="hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </span>
                        {userDetailData.user.createdAt && (
                          <>
                            <span>•</span>
                            <span className="text-[11px] text-slate-500">
                              Joined {new Date(userDetailData.user.createdAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterByUser(userDetailData.user.id)}
                      className="h-8 text-xs bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                    >
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      Filter Main Dashboard
                    </Button>
                  </div>
                </div>

                {/* 5 KPI Metric Badges Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">Facebook Pages</span>
                    <p className="text-base font-bold font-mono text-white mt-0.5">
                      {userDetailData.stats.pagesCount}
                      <span className="text-xs font-normal text-emerald-400 ml-1">
                        ({userDetailData.stats.activePagesCount} active)
                      </span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">Knowledge Base</span>
                    <p className="text-base font-bold font-mono text-purple-400 mt-0.5">
                      {userDetailData.stats.docsCount} docs
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {(userDetailData.stats.totalDocsChars || 0).toLocaleString()} chars
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">Conversations</span>
                    <p className="text-base font-bold font-mono text-blue-400 mt-0.5">
                      {userDetailData.stats.convsCount} chats
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">AI Replies</span>
                    <p className="text-base font-bold font-mono text-amber-400 mt-0.5">
                      {userDetailData.stats.totalAiReplies} msgs
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {userDetailData.stats.totalCustomerMessages} customer
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs col-span-2 sm:col-span-1">
                    <span className="text-slate-400 text-[11px]">Total Spent</span>
                    <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                      ৳{(userDetailData.stats.totalSpent || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-Tab Navigation inside User 360 Dialog */}
              <div className="flex border-b border-slate-800 bg-slate-900/40 px-5 text-xs font-medium">
                {[
                  { id: "pages", label: `Connected Pages (${userDetailData.pages.length})`, icon: Facebook },
                  { id: "conversations", label: `Conversations (${userDetailData.conversations.length})`, icon: MessageSquare },
                  { id: "documents", label: `Knowledge Docs (${userDetailData.documents.length})`, icon: BookOpen },
                  { id: "payments", label: `Billing & Payments (${userDetailData.payments.length})`, icon: CreditCard },
                ].map((st) => {
                  const Icon = st.icon;
                  const isActive = userModalTab === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setUserModalTab(st.id as any);
                        setUserModalSelectedConv(null);
                      }}
                      className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 font-medium transition-colors ${
                        isActive
                          ? "border-emerald-400 text-emerald-400 font-semibold"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Body: Active Tab Content */}
              <div className="p-5 overflow-y-auto flex-1 max-h-[500px] text-xs">
                {/* 1. Pages Tab */}
                {userModalTab === "pages" && (
                  <div className="space-y-3">
                    {userDetailData.pages.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        <Facebook className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                        <p>No Facebook Pages connected by this merchant.</p>
                      </div>
                    ) : (
                      userDetailData.pages.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                              <Facebook className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-sm">{p.pageName}</h4>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 ${
                                    p.isActive
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  }`}
                                >
                                  {p.isActive ? "Active (Replying)" : "Paused"}
                                </Badge>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-700 text-slate-300">
                                  Tone: {p.botTone}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Page ID: {p.pageId} • Access Token: {p.hasToken ? "Stored" : "Missing"}
                              </p>
                              {p.customInstructions && (
                                <p className="text-[11px] text-slate-400 italic mt-1 bg-slate-950 p-2 rounded border border-slate-800/80">
                                  Instructions: &ldquo;{p.customInstructions}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTogglePage(p.id)}
                              className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                            >
                              {p.isActive ? "Pause AI" : "Activate AI"}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 2. Conversations Tab */}
                {userModalTab === "conversations" && (
                  <div>
                    {userModalSelectedConv ? (
                      /* Conversation Bubble Inspector */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <button
                            onClick={() => setUserModalSelectedConv(null)}
                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Back to Conversations List
                          </button>
                          <div className="text-right text-[11px] text-slate-400">
                            Page: <span className="text-white font-medium">{userModalSelectedConv.pageName}</span>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto p-2">
                          {userModalSelectedConv.messages?.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${msg.senderType === "customer" ? "items-start" : "items-end"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                                  msg.senderType === "customer"
                                    ? "bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60"
                                    : "bg-emerald-500 text-slate-950 font-medium rounded-br-xs shadow-md shadow-emerald-500/10"
                                }`}
                              >
                                <p>{msg.text}</p>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 px-1 font-mono">
                                <span>{msg.name || (msg.senderType === "ai" ? "ChatTime Bot" : "Customer")}</span>
                                <span>•</span>
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                {msg.modelUsed && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-[8px] py-0 px-1 border-emerald-500/30 text-emerald-400">
                                      {msg.modelUsed}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Conversations List */
                      <div className="space-y-2.5">
                        {userDetailData.conversations.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                            <MessageSquare className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                            <p>No conversations recorded yet for this merchant&apos;s pages.</p>
                          </div>
                        ) : (
                          userDetailData.conversations.map((c: any) => (
                            <div
                              key={c.id}
                              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                                  {(c.customerName || "Customer").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-white text-xs">{c.customerName || "Customer"}</h5>
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-700 bg-slate-800 text-slate-300">
                                      {c.pageName}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={`text-[8px] px-1 py-0 ${
                                        c.status === "ai_replied"
                                          ? "text-emerald-400 border-emerald-500/30"
                                          : "text-blue-400 border-blue-500/30"
                                      }`}
                                    >
                                      {c.status === "ai_replied" ? "AI Replied" : "Pending"}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-md">
                                    {c.lastMessage || "No message content"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {c.messagesCount} msgs
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUserModalSelectedConv(c)}
                                  className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Messages
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Knowledge Base Documents Tab */}
                {userModalTab === "documents" && (
                  <div className="space-y-3">
                    {userDetailData.documents.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        <BookOpen className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                        <p>No training documents uploaded by this merchant.</p>
                      </div>
                    ) : (
                      userDetailData.documents.map((d: any) => (
                        <div
                          key={d.id}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                                <BookOpen className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-white text-xs truncate">{d.title}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase border-slate-700">
                                    {d.fileType}
                                  </Badge>
                                  <span>•</span>
                                  <span>{d.charCount?.toLocaleString()} chars</span>
                                  <span>•</span>
                                  <span>{d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : "Recent"}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDoc(d)}
                              className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white shrink-0"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Inspect
                            </Button>
                          </div>

                          {d.summary && (
                            <p className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                              {d.summary}
                            </p>
                          )}

                          {d.keyTopics && d.keyTopics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {d.keyTopics.map((topic: string, i: number) => (
                                <Badge key={i} variant="outline" className="bg-slate-950 text-slate-400 border-slate-800 text-[10px]">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. Billing & Payments Tab */}
                {userModalTab === "payments" && (
                  <div className="space-y-3">
                    {userDetailData.payments.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        <CreditCard className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                        <p>No bKash payments recorded for this merchant.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            <tr>
                              <th className="p-2.5">TrxID / Payment ID</th>
                              <th className="p-2.5">Phone</th>
                              <th className="p-2.5">Amount</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {userDetailData.payments.map((p: any) => (
                              <tr key={p.id} className="hover:bg-slate-900/40">
                                <td className="p-2.5 text-[11px] text-white">
                                  <div>{p.trxID}</div>
                                  <div className="text-[9px] text-slate-500">{p.paymentID}</div>
                                </td>
                                <td className="p-2.5 text-[11px] text-slate-300">{p.customerPhone}</td>
                                <td className="p-2.5 font-bold text-emerald-400">
                                  ৳{Number(p.amount || 0).toLocaleString()}
                                </td>
                                <td className="p-2.5">
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] ${
                                      p.transactionStatus === "Completed"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    }`}
                                  >
                                    {p.transactionStatus}
                                  </Badge>
                                </td>
                                <td className="p-2.5 text-[10px] text-slate-500 font-sans">
                                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Inspect Document Modal */}
      <Dialog open={Boolean(selectedDoc)} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              <span>{selectedDoc?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Uploaded by {selectedDoc?.owner?.name || selectedDoc?.owner?.email || "System"} • {selectedDoc?.charCount?.toLocaleString()} characters
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            <div>
              <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1">
                AI Knowledge Summary:
              </p>
              <p className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                {selectedDoc?.summary || "No summary available"}
              </p>
            </div>

            {selectedDoc?.keyTopics && selectedDoc.keyTopics.length > 0 && (
              <div>
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1.5">
                  Extracted Key Topics:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDoc.keyTopics.map((topic: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-slate-950 border-slate-800 text-slate-300 text-[11px]">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Inspect Conversation Modal */}
      <Dialog open={Boolean(selectedConv)} onOpenChange={(open) => !open && setSelectedConv(null)}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span>Chat with {selectedConv?.customerName || "Customer"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Facebook Page: {selectedConv?.pageName} (Page ID: {selectedConv?.pageId})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[420px] overflow-y-auto py-3 text-xs">
            {selectedConv?.messages?.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.senderType === "customer" ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    msg.senderType === "customer"
                      ? "bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60"
                      : "bg-emerald-500 text-slate-950 font-medium rounded-br-xs"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 px-1 font-mono">
                  <span>{msg.name || msg.senderType}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {msg.modelUsed && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{msg.modelUsed}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
