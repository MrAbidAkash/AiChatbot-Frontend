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
  Database,
  Globe,
  Radio,
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
    "overview" | "users" | "pages" | "documents" | "conversations" | "payments" | "developer"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // Developer AI test state
  const [aiTestPrompt, setAiTestPrompt] = useState("");
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<any | null>(null);

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

  // Fetch specific tab data on demand
  const fetchTabData = useCallback(async (tabName: string) => {
    try {
      const res = await fetch(`/api/admin/data?type=${tabName}`);
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab !== "overview" && activeTab !== "developer") {
      fetchTabData(activeTab);
    }
  }, [activeTab, fetchTabData]);

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

  const handleTogglePage = async (id: string) => {
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-page", id }),
      });
      if (res.ok) {
        toast.success("Page status updated");
        fetchTabData("pages");
        fetchStats();
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
        fetchTabData("pages");
        fetchStats();
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
        fetchTabData("documents");
        fetchStats();
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                ChatTime AI Master Admin
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 font-mono">
                Super Admin
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Confidential SaaS Management & Operations Suite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">{adminEmail}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats(true)}
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
        <aside className="lg:w-60 shrink-0 space-y-1">
          {[
            { id: "overview", label: "Executive Overview", icon: Activity, count: null },
            { id: "users", label: "Registered Users", icon: Users, count: stats?.metrics?.totalUsers },
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
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== null && tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
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
                      <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-white">{u.name || "Unnamed User"}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
                        </span>
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
                      <div key={c.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
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
          {/* TAB 2: REGISTERED USERS */}
          {/* ========================================================= */}
          {activeTab === "users" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 bg-slate-900 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                  />
                </div>
                <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300 self-start sm:self-auto">
                  {users.length} Users Total
                </Badge>
              </div>

              <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Email</th>
                        <th className="p-3 text-center">Connected Pages</th>
                        <th className="p-3 text-center">Knowledge Docs</th>
                        <th className="p-3 text-center">Conversations</th>
                        <th className="p-3">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {users
                        .filter(
                          (u) =>
                            u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.email?.toLowerCase().includes(userSearch.toLowerCase()),
                        )
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-semibold text-white">{u.name || "Merchant"}</td>
                            <td className="p-3 font-mono text-[11px] text-slate-300">{u.email}</td>
                            <td className="p-3 text-center font-mono">
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                                {u.pagesCount}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
                                {u.docsCount}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-300">
                              {u.conversationsCount}
                            </td>
                            <td className="p-3 text-[11px] text-slate-500">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
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
          {/* TAB 3: CONNECTED FACEBOOK PAGES */}
          {/* ========================================================= */}
          {activeTab === "pages" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search pages by name or Page ID..."
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    className="pl-9 bg-slate-900 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                  />
                </div>
                <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300 self-start sm:self-auto">
                  {pages.length} Pages Configured
                </Badge>
              </div>

              <div className="grid gap-3">
                {pages
                  .filter(
                    (p) =>
                      p.pageName?.toLowerCase().includes(pageSearch.toLowerCase()) ||
                      p.pageId?.includes(pageSearch),
                  )
                  .map((p) => (
                    <Card key={p.id} className="bg-slate-900/60 border-slate-800 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center shrink-0">
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
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                              <span>Page ID: {p.pageId}</span>
                              <span>•</span>
                              <span>Owner: {p.owner?.email || "Unknown"}</span>
                              <span>•</span>
                              <span>Tone: {p.botTone}</span>
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
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: KNOWLEDGE BASE DOCUMENTS */}
          {/* ========================================================= */}
          {activeTab === "documents" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search documents by title or owner..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="pl-9 bg-slate-900 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                  />
                </div>
                <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300 self-start sm:self-auto">
                  {documents.length} Files Ingested
                </Badge>
              </div>

              <div className="grid gap-3">
                {documents
                  .filter(
                    (d) =>
                      d.title?.toLowerCase().includes(docSearch.toLowerCase()) ||
                      d.owner?.email?.toLowerCase().includes(docSearch.toLowerCase()),
                  )
                  .map((d) => (
                    <Card key={d.id} className="bg-slate-900/60 border-slate-800 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
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
                              <span className="font-mono text-slate-400">{d.owner?.email || "System"}</span>
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
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: LIVE CONVERSATIONS */}
          {/* ========================================================= */}
          {activeTab === "conversations" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations by customer or page..."
                    value={convSearch}
                    onChange={(e) => setConvSearch(e.target.value)}
                    className="pl-9 bg-slate-900 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                  />
                </div>
                <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300 self-start sm:self-auto">
                  {conversations.length} Active Conversations
                </Badge>
              </div>

              <div className="grid gap-3">
                {conversations
                  .filter(
                    (c) =>
                      c.customerName?.toLowerCase().includes(convSearch.toLowerCase()) ||
                      c.pageName?.toLowerCase().includes(convSearch.toLowerCase()) ||
                      c.lastMessage?.toLowerCase().includes(convSearch.toLowerCase()),
                  )
                  .map((c) => (
                    <Card key={c.id} className="bg-slate-900/60 border-slate-800 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {(c.customerName || "Customer").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
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

              <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
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

      {/* Inspect Document Modal */}
      <Dialog open={Boolean(selectedDoc)} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              <span>{selectedDoc?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Uploaded by {selectedDoc?.owner?.email || "System"} • {selectedDoc?.charCount?.toLocaleString()} characters
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
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

