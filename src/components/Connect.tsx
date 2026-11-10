// src/components/Connect.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FaFacebook,
  FaCheck,
  FaCopy,
  FaTrash,
  FaPaperPlane,
  FaBook,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaKey,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  Sparkles,
  Bot,
  RefreshCw,
  Plus,
  CheckCircle2,
  Store,
  ShieldCheck,
  HelpCircle,
  Laptop,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ConnectedPage {
  _id?: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  category?: string;
  pictureUrl?: string;
  isActive: boolean;
  botTone?: "friendly" | "professional" | "casual";
  fallbackMessage?: string;
  customInstructions?: string;
  createdAt?: string;
}

interface DiscoveredPage {
  id: string;
  name: string;
  category?: string;
  accessToken: string;
  pictureUrl?: string;
  canManage: boolean;
}

export default function ConnectFacebookPage() {
  const [pages, setPages] = useState<ConnectedPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Facebook OAuth & Popup State
  const [authenticating, setAuthenticating] = useState(false);
  const [showPageSelectorModal, setShowPageSelectorModal] = useState(false);
  const [showSetupGuideModal, setShowSetupGuideModal] = useState(false);
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [connectingPages, setConnectingPages] = useState(false);

  // Manual Page Connection State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualPageId, setManualPageId] = useState("");
  const [manualPageName, setManualPageName] = useState("");
  const [manualPageAccessToken, setManualPageAccessToken] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

  // AI Testing Playground State
  const [testMessage, setTestMessage] = useState("");
  const [testPageId, setTestPageId] = useState("");
  const [testingAi, setTestingAi] = useState(false);
  const [testChat, setTestChat] = useState<
    Array<{ sender: "user" | "bot"; text: string; model?: string }>
  >([
    {
      sender: "bot",
      text: "Hello! I am your AI assistant trained on your business documents. Ask me anything to test how I will reply to Facebook customers!",
    },
  ]);

  const [origin, setOrigin] = useState("");

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/facebook/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
        if (data.pages?.length > 0 && !testPageId) {
          setTestPageId(data.pages[0].pageId);
        }
      }
    } catch (err) {
      console.error("Failed to load Facebook pages:", err);
    } finally {
      setLoading(false);
    }
  }, [testPageId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    fetchPages();

    // Listen for OAuth completion from the popup window
    const handlePopupMessage = (event: MessageEvent) => {
      if (event.data?.type === "FACEBOOK_AUTH_SUCCESS") {
        const incomingPages: DiscoveredPage[] = event.data.pages || [];
        if (incomingPages.length > 0) {
          setDiscoveredPages(incomingPages);
          setShowPageSelectorModal(true);
          toast.success(`Facebook connected! Found ${incomingPages.length} Page(s).`);
        } else {
          toast.error("No managed Facebook Pages found. Make sure you are an Admin of a Facebook Page.");
        }
      } else if (event.data?.type === "FACEBOOK_AUTH_ERROR") {
        toast.error(`Facebook login error: ${event.data.error || "Cancelled"}`);
      }
    };

    window.addEventListener("message", handlePopupMessage);
    return () => window.removeEventListener("message", handlePopupMessage);
  }, [fetchPages]);

  // Click handler for "Connect Facebook Page"
  const handleStartFacebookConnect = async () => {
    setAuthenticating(true);
    try {
      const res = await fetch("/api/facebook/auth-url");
      const data = await res.json();

      if (!data.configured || !data.authUrl) {
        // Facebook App credentials not yet filled in .env
        setShowSetupGuideModal(true);
        return;
      }

      // Open centered Facebook Login popup
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2 + window.screenX;
      const top = window.innerHeight / 2 - height / 2 + window.screenY;

      const popup = window.open(
        data.authUrl,
        "facebook_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`,
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        toast.error("Popup blocked by browser. Please allow popups for this site.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Facebook connect");
    } finally {
      setAuthenticating(false);
    }
  };

  // Connect single page directly from the popup list
  const handleConnectSinglePage = async (page: DiscoveredPage) => {
    setConnectingPages(true);
    try {
      const res = await fetch("/api/facebook/connect-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.accessToken,
          category: page.category,
          pictureUrl: page.pictureUrl,
          botTone: "friendly",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Connected "${page.name}" with auto-reply enabled!`);
        await fetchPages();
        setShowPageSelectorModal(false);
      } else {
        toast.error(data.error || "Failed to connect page");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect page");
    } finally {
      setConnectingPages(false);
    }
  };

  // Toggle page selection checkbox
  const togglePageSelect = (pageId: string) => {
    setSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId],
    );
  };

  // Connect multiple selected pages
  const handleConnectSelectedPages = async () => {
    if (selectedPageIds.length === 0) return;

    setConnectingPages(true);
    let count = 0;
    for (const pageId of selectedPageIds) {
      const p = discoveredPages.find((item) => item.id === pageId);
      if (!p) continue;

      try {
        const res = await fetch("/api/facebook/connect-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: p.id,
            pageName: p.name,
            pageAccessToken: p.accessToken,
            category: p.category,
            pictureUrl: p.pictureUrl,
            botTone: "friendly",
          }),
        });
        if (res.ok) count++;
      } catch (err) {
        console.error("Error connecting page:", err);
      }
    }

    setConnectingPages(false);
    toast.success(`Successfully connected ${count} Facebook Page(s)!`);
    await fetchPages();
    setShowPageSelectorModal(false);
    setSelectedPageIds([]);
  };

  // Connect a 1-click Demo Store Page for fast testing
  const handleConnectDemoStore = async (storeName: string, category: string) => {
    setConnectingPages(true);
    try {
      const demoId = `page_${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const res = await fetch("/api/facebook/connect-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: demoId,
          pageName: storeName,
          pageAccessToken: `EAAG_demo_token_${demoId}`,
          category,
          pictureUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop",
          botTone: "friendly",
        }),
      });

      if (res.ok) {
        toast.success(`Connected "${storeName}"! You can now test auto-reply with your documents.`);
        setShowSetupGuideModal(false);
        setShowPageSelectorModal(false);
        await fetchPages();
      } else {
        toast.error("Failed to connect demo store");
      }
    } catch {
      toast.error("Failed to connect demo store");
    } finally {
      setConnectingPages(false);
    }
  };

  // Toggle active auto-reply
  const handleToggleActive = async (page: ConnectedPage) => {
    try {
      const updated = !page.isActive;
      const res = await fetch("/api/facebook/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...page,
          isActive: updated,
        }),
      });

      if (res.ok) {
        setPages((prev) =>
          prev.map((p) => (p.pageId === page.pageId ? { ...p, isActive: updated } : p)),
        );
        toast.success(
          updated ? "Auto-reply activated for page" : "Auto-reply paused for page",
        );
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Delete page
  const handleDeletePage = async (pageIdToDelete: string) => {
    if (!confirm("Are you sure you want to disconnect this Facebook Page?")) return;
    try {
      const res = await fetch(`/api/facebook/pages?pageId=${pageIdToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Page disconnected");
        setPages((prev) => prev.filter((p) => p.pageId !== pageIdToDelete));
      }
    } catch {
      toast.error("Failed to disconnect page");
    }
  };

  // Manual Page Connect
  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPageId.trim() || !manualPageAccessToken.trim()) {
      toast.error("Page ID and Access Token are required");
      return;
    }

    setManualSaving(true);
    try {
      const res = await fetch("/api/facebook/connect-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: manualPageId.trim(),
          pageName: manualPageName.trim() || `Facebook Page (${manualPageId.trim()})`,
          pageAccessToken: manualPageAccessToken.trim(),
          botTone: "friendly",
        }),
      });

      if (res.ok) {
        toast.success("Page connected successfully!");
        setManualPageId("");
        setManualPageName("");
        setManualPageAccessToken("");
        setShowManualForm(false);
        setShowSetupGuideModal(false);
        await fetchPages();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to connect page");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setManualSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Live AI Tester
  const handleTestAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim() || testingAi) return;

    const userText = testMessage.trim();
    setTestMessage("");
    setTestChat((prev) => [...prev, { sender: "user", text: userText }]);
    setTestingAi(true);

    try {
      const res = await fetch("/api/facebook/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          pageId: testPageId || undefined,
          conversationHistory: testChat.map((m) => ({
            senderType: m.sender === "user" ? "customer" : "ai",
            text: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestChat((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply,
            model: data.modelUsed,
          },
        ]);
      } else {
        const err = await res.json();
        setTestChat((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `Error: ${err.error || "Failed to generate reply"}`,
          },
        ]);
      }
    } catch (err: any) {
      setTestChat((prev) => [
        ...prev,
        { sender: "bot", text: `Connection error: ${err.message}` },
      ]);
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <FaFacebook className="text-[#1877F2] h-8 w-8" />
              Facebook Auto-Reply Integration
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your Facebook Pages and let AI automatically answer customer
              questions by analyzing your business documents.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/documents">
              <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
                <FaBook className="h-3.5 w-3.5 text-primary" />
                Knowledge Base
              </Button>
            </Link>
            {/* <Button
              onClick={handleStartFacebookConnect}
              disabled={authenticating}
              size="sm"
              className="gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-xs font-semibold h-9 px-4 text-xs"
            >
              {authenticating ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FaFacebook className="h-3.5 w-3.5" />
              )}
              {authenticating ? "Connecting..." : "Connect Facebook Page"}
            </Button> */}
          </div>
        </div>

        {/* Main Grid: Left = Connected Pages & Connect Action, Right = Live AI Simulator */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column (7 cols): Connected Pages List & One-Click Connect */}
          <div className="space-y-6 lg:col-span-7">
            {/* Quick Connect Callout Card */}
            <Card className="border-border shadow-xs bg-card">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Store className="h-5 w-5 text-primary" />
                      Add Facebook Page
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Click below to open the Facebook page popup and select which pages to connect.
                    </p>
                  </div>
                  <Button
                    onClick={handleStartFacebookConnect}
                    disabled={authenticating}
                    className="gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white shrink-0 font-semibold"
                  >
                    {authenticating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Select & Connect Page
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Connected Facebook Pages List */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Connected Facebook Pages</CardTitle>
                    <CardDescription className="text-xs">
                      Pages currently receiving AI auto-replies based on your business documents.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {pages.length} Connected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-border/60 flex items-center justify-between gap-3 bg-muted/10"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-36 rounded-md" />
                              <Skeleton className="h-4 w-12 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-48 rounded-md" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-20 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pages.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 text-[#1877F2] rounded-full flex items-center justify-center mx-auto">
                      <FaFacebook className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        No Facebook Pages connected yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        Click &ldquo;Connect Facebook Page&rdquo; above to select and link your business page in seconds.
                      </p>
                    </div>
                    <Button
                      onClick={handleStartFacebookConnect}
                      className="mt-2 gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Connect Your First Page
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pages.map((p) => (
                      <div
                        key={p.pageId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {p.pictureUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.pictureUrl}
                              alt={p.pageName}
                              className="w-11 h-11 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center font-bold text-sm border border-[#1877F2]/20">
                              {p.pageName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-sm">
                                {p.pageName}
                              </p>
                              <Badge
                                variant={p.isActive ? "default" : "secondary"}
                                className={`text-[10px] ${
                                  p.isActive
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : ""
                                }`}
                              >
                                {p.isActive ? "Auto-Reply ON" : "Paused"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              ID: {p.pageId} {p.category && `• ${p.category}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Auto-reply</span>
                            <Switch
                              checked={p.isActive}
                              onCheckedChange={() => handleToggleActive(p)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePage(p.pageId)}
                            className="text-destructive hover:bg-destructive/10"
                            title="Disconnect page"
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Collapsible Manual Setup Option */}
            <div className="rounded-lg border bg-card/60 p-4">
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <span>Advanced: Connect with Page ID & Access Token manually</span>
                {showManualForm ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showManualForm && (
                <form onSubmit={handleManualConnect} className="mt-4 space-y-3 pt-3 border-t">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-medium text-foreground">
                        Page Name (Optional)
                      </label>
                      <Input
                        placeholder="e.g. My Store"
                        value={manualPageName}
                        onChange={(e) => setManualPageName(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-foreground">
                        Facebook Page ID *
                      </label>
                      <Input
                        placeholder="e.g. 104928374829102"
                        value={manualPageId}
                        onChange={(e) => setManualPageId(e.target.value)}
                        required
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground">
                      Facebook Page Access Token *
                    </label>
                    <Input
                      type="password"
                      placeholder="EAAG..."
                      value={manualPageAccessToken}
                      onChange={(e) => setManualPageAccessToken(e.target.value)}
                      required
                      className="mt-1 text-xs font-mono"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={manualSaving}
                    className="w-full text-xs"
                  >
                    {manualSaving ? "Connecting..." : "Connect Manually"}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Live AI Testing Playground */}
          <div className="lg:col-span-5">
            <Card className="h-full flex flex-col border-primary/30 shadow-md">
              <CardHeader className="pb-3 border-b bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">AI Auto-Reply Tester</CardTitle>
                      <CardDescription className="text-xs">
                        Test how AI answers using your business documents
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-300"
                  >
                    Active
                  </Badge>
                </div>
              </CardHeader>

              {/* Page Selector for Testing */}
              {pages.length > 0 && (
                <div className="px-4 py-2 border-b bg-muted/40 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground shrink-0">Testing Page:</span>
                  <select
                    value={testPageId}
                    onChange={(e) => setTestPageId(e.target.value)}
                    className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground max-w-[220px] truncate"
                  >
                    {pages.map((p) => (
                      <option key={p.pageId} value={p.pageId}>
                        {p.pageName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[350px] max-h-[500px] bg-muted/20">
                {testChat.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      m.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        m.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-background border shadow-xs text-foreground rounded-bl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {testingAi && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    AI is analyzing business documents...
                  </div>
                )}
              </div>

              {/* Message Input Footer */}
              <div className="p-3 border-t bg-card">
                <form onSubmit={handleTestAi} className="flex gap-2">
                  <Input
                    placeholder="Ask a question (English or বাংলা)..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={testingAi}
                    className="text-xs"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={testingAi || !testMessage.trim()}
                    className="shrink-0 gap-1 px-3"
                  >
                    <FaPaperPlane className="h-3 w-3" />
                  </Button>
                </form>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Reads from{" "}
                    <Link href="/documents" className="text-primary hover:underline">
                      Knowledge Base
                    </Link>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setTestChat([
                        {
                          sender: "bot",
                          text: "Chat cleared! Ask me another question to test your business documents.",
                        },
                      ])
                    }
                    className="hover:underline"
                  >
                    Clear Chat
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* MODAL 1: SELECT YOUR FACEBOOK PAGES (Returned from Facebook OAuth) */}
      <Dialog open={showPageSelectorModal} onOpenChange={setShowPageSelectorModal}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center">
                <FaFacebook className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">Select Facebook Pages</DialogTitle>
                <DialogDescription className="text-xs">
                  Choose the Facebook Page(s) you want to activate for AI Auto-Reply.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Discovered Pages List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-4 max-h-[380px] pr-1">
            {discoveredPages.map((page) => {
              const isAlreadyConnected = pages.some((p) => p.pageId === page.id);
              const isSelected = selectedPageIds.includes(page.id);

              return (
                <div
                  key={page.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : isAlreadyConnected
                        ? "border-border bg-muted/40 opacity-75"
                        : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected || isAlreadyConnected}
                      disabled={isAlreadyConnected}
                      onChange={() => togglePageSelect(page.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {page.pictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={page.pictureUrl}
                        alt={page.name}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-[#1877F2] flex items-center justify-center font-bold text-xs">
                        {page.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {page.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {page.category} • ID: {page.id}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isAlreadyConnected ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950">
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                        Connected
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        disabled={connectingPages}
                        onClick={() => handleConnectSinglePage(page)}
                        className="text-xs bg-[#1877F2] hover:bg-[#166fe5] text-white h-8 px-3"
                      >
                        {connectingPages ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-3 border-t flex flex-row items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {selectedPageIds.length > 0
                ? `${selectedPageIds.length} page(s) selected`
                : "Select pages to connect in bulk"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPageSelectorModal(false)}
                className="text-xs"
              >
                Close
              </Button>
              {selectedPageIds.length > 0 && (
                <Button
                  size="sm"
                  disabled={connectingPages}
                  onClick={handleConnectSelectedPages}
                  className="text-xs bg-[#1877F2] hover:bg-[#166fe5] text-white"
                >
                  {connectingPages ? "Connecting..." : `Connect ${selectedPageIds.length} Pages`}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: FACEBOOK APP SETUP GUIDE & FAST TESTING OPTIONS */}
      <Dialog open={showSetupGuideModal} onOpenChange={setShowSetupGuideModal}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">Connect Your Facebook Page</DialogTitle>
                <DialogDescription className="text-xs">
                  Choose how you want to link your Facebook Page for auto-reply.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
            {/* Option A: Fast Demo / Test Store */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    Instant 1-Click Test Store
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                  Recommended for Testing
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Want to test how AI answers customer questions from your documents right now?
                Connect a test business store in 1 click:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnectDemoStore("Fashion Hub Bangladesh", "Apparel & Retail")}
                  className="text-xs bg-background hover:bg-muted"
                >
                  Connect &ldquo;Fashion Hub&rdquo;
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnectDemoStore("TechStore Electronics", "Electronics & Gadgets")}
                  className="text-xs bg-background hover:bg-muted"
                >
                  Connect &ldquo;TechStore Gadgets&rdquo;
                </Button>
              </div>
            </div>

            {/* Option B: Connect with Official Facebook Login */}
            <div className="rounded-xl border bg-card p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <FaFacebook className="h-4 w-4 text-[#1877F2]" />
                <span className="text-sm font-bold text-foreground">
                  Connect via Facebook Login
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click &ldquo;Select &amp; Connect Page&rdquo; on the main screen. A secure Facebook dialog will open, allowing you to select your business pages and authorize ChatTime AI to reply to customer messages automatically.
              </p>
            </div>

            {/* Option C: Direct Page Access Token Input */}
            <div className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FaKey className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">
                  Connect with Page Access Token
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Already have your Page ID and Page Access Token from Graph API Explorer or Meta Business Suite?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSetupGuideModal(false);
                  setShowManualForm(true);
                }}
                className="text-xs mt-1"
              >
                Enter Page ID & Token Manually
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSetupGuideModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
