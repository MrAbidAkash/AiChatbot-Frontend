// src/components/Connect.tsx
"use client";

import { useState, useEffect } from "react";
import {
  FaFacebook,
  FaCheck,
  FaCopy,
  FaTrash,
  FaRobot,
  FaPaperPlane,
  FaExclamationTriangle,
  FaBook,
  FaInfoCircle,
} from "react-icons/fa";
import {
  Sparkles,
  Bot,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Power,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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

export default function ConnectFacebookPage() {
  const [pages, setPages] = useState<ConnectedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Page Form State
  const [pageName, setPageName] = useState("");
  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [botTone, setBotTone] = useState<"friendly" | "professional" | "casual">("friendly");
  const [customInstructions, setCustomInstructions] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState(
    "I don't have that specific information in my documents right now. Our support team will get back to you shortly!",
  );

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    fetchPages();
  }, []);

  const fetchPages = async () => {
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
  };

  const handleConnectPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId.trim() || !pageAccessToken.trim()) {
      toast.error("Page ID and Page Access Token are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/facebook/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: pageId.trim(),
          pageName: pageName.trim() || `Facebook Page (${pageId.trim()})`,
          pageAccessToken: pageAccessToken.trim(),
          isActive: true,
          botTone,
          customInstructions,
          fallbackMessage,
        }),
      });

      if (res.ok) {
        toast.success("Facebook Page connected and auto-reply enabled!");
        setPageName("");
        setPageId("");
        setPageAccessToken("");
        setCustomInstructions("");
        await fetchPages();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to connect Facebook page");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

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

  const webhookUrl = `${origin || "https://your-domain.com"}/api/webhook/facebook`;
  const verifyToken = "chattime_ai_webhook_verify_token_2026";

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Title & Intro */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <FaFacebook className="text-[#1877F2] h-8 w-8" />
              Facebook Messenger Auto-Reply
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your Facebook Pages and let Gemini AI automatically answer customer
              inquiries by analyzing your uploaded business documents.
            </p>
          </div>
          <Link href="/dashboard/training">
            <Button variant="outline" className="gap-2">
              <FaBook className="h-4 w-4 text-primary" />
              Manage Business Documents
            </Button>
          </Link>
        </div>

        {/* Top Instructions / Webhook Setup Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-primary font-semibold">
              <ShieldCheck className="h-5 w-5" />
              Step 1: Configure Webhook in Meta Developer App
            </CardTitle>
            <CardDescription>
              Copy these two values and paste them into your Meta Developer App (Messenger → Webhooks → Edit Subscription).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-background/80 p-3">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1">
                <span>Callback URL</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrl, "Callback URL")}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <FaCopy className="h-3 w-3" /> Copy
                </button>
              </div>
              <p className="text-xs font-mono font-semibold break-all text-foreground">
                {webhookUrl}
              </p>
            </div>

            <div className="rounded-lg border bg-background/80 p-3">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1">
                <span>Verify Token</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(verifyToken, "Verify Token")}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <FaCopy className="h-3 w-3" /> Copy
                </button>
              </div>
              <p className="text-xs font-mono font-semibold text-foreground">
                {verifyToken}
              </p>
            </div>
            <div className="sm:col-span-2 text-xs text-muted-foreground flex items-center gap-2">
              <FaInfoCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Required Webhook subscription fields in Meta: <span className="font-semibold text-foreground">messages</span> and <span className="font-semibold text-foreground">messaging_postbacks</span>.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid: Left = Connect Form & Connected Pages, Right = Live AI Simulator */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column (7 cols): Connect Page Form & Connected Pages List */}
          <div className="space-y-8 lg:col-span-7">
            {/* Connect a Facebook Page Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Connect Facebook Page
                </CardTitle>
                <CardDescription>
                  Enter your Page ID and Page Access Token to link your Facebook Page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConnectPage} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        Page Name
                      </label>
                      <Input
                        placeholder="e.g. My Brand Store"
                        value={pageName}
                        onChange={(e) => setPageName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        Facebook Page ID *
                      </label>
                      <Input
                        placeholder="e.g. 104928374829102"
                        value={pageId}
                        onChange={(e) => setPageId(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Facebook Page Access Token (Never Expires) *
                    </label>
                    <Input
                      type="password"
                      placeholder="EAAG..."
                      value={pageAccessToken}
                      onChange={(e) => setPageAccessToken(e.target.value)}
                      required
                      className="mt-1 font-mono text-xs"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Generated from Meta Developer App → Tools → Graph API Explorer (Page Access Token) or Page Settings.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        AI Bot Tone
                      </label>
                      <select
                        value={botTone}
                        onChange={(e) => setBotTone(e.target.value as any)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="friendly">Friendly & Welcoming</option>
                        <option value="professional">Professional & Formal</option>
                        <option value="casual">Casual & Conversational</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        Fallback Message
                      </label>
                      <Input
                        placeholder="When info is missing in documents..."
                        value={fallbackMessage}
                        onChange={(e) => setFallbackMessage(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Custom AI Persona & Business Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Always mention that delivery takes 24 hours in Dhaka. For urgent order confirmation, tell customers to call +8801700000000."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <Button type="submit" disabled={saving} className="w-full gap-2">
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FaFacebook className="h-4 w-4" />
                    )}
                    {saving ? "Connecting..." : "Save & Enable Facebook Auto-Reply"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Connected Pages List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Connected Facebook Pages</span>
                  <Badge variant="secondary">{pages.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Your connected Facebook Pages actively receiving auto-replies based on your documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Loading connected pages...
                  </div>
                ) : pages.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-8 text-center">
                    <FaFacebook className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      No Facebook Pages connected yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the form above to connect your first page.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pages.map((p) => (
                      <div
                        key={p.pageId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-blue-100 p-2.5 text-[#1877F2] dark:bg-blue-950">
                            <FaFacebook className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-sm">
                                {p.pageName}
                              </p>
                              <Badge
                                variant={p.isActive ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {p.isActive ? "Active" : "Paused"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              Page ID: {p.pageId} • Tone: {p.botTone || "friendly"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
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
                        Test how Gemini answers using your business documents
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-300">
                    Gemini 3.8 Flash
                  </Badge>
                </div>
              </CardHeader>

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
                    {m.model && (
                      <span className="text-[9px] text-muted-foreground mt-0.5 px-1">
                        Analyzed with {m.model}
                      </span>
                    )}
                  </div>
                ))}
                {testingAi && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    Gemini is analyzing business documents...
                  </div>
                )}
              </div>

              {/* Message Input Footer */}
              <div className="p-3 border-t bg-card">
                <form onSubmit={handleTestAi} className="flex gap-2">
                  <Input
                    placeholder="Ask a customer question (English or বাংলা)..."
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
                  <span>Uses documents from <Link href="/dashboard/training" className="text-primary hover:underline">Knowledge Base</Link></span>
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
    </div>
  );
}
