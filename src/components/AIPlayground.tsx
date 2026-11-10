"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Cpu,
  ShieldCheck,
  BookOpen,
  Sliders,
  CheckCircle2,
  Trash2,
  Globe,
  Layers,
  FileText,
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

interface ConnectedPage {
  pageId: string;
  pageName: string;
  isActive: boolean;
  pictureUrl?: string;
}

interface TestMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  modelUsed?: string;
  hasKnowledge?: boolean;
  pageName?: string;
  pageId?: string;
  docCount?: number;
  docTitles?: string[];
}

export default function AIPlayground() {
  const [pages, setPages] = useState<ConnectedPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("all");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<TestMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "আসালামু আলাইকুম! আমি আপনার শপের AI সেলস অ্যাসিস্ট্যান্ট। উপরে পেজ সিলেক্ট করে সেই পেজের ডেলিভারি চার্জ, ক্যাটালগ বা পলিসি নিয়ে প্রশ্ন করে টেস্ট করুন!",
      timestamp: "এইমাত্র",
      modelUsed: "Gemini 2.5 Flash",
      hasKnowledge: true,
    },
  ]);

  // Fetch connected pages
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch("/api/facebook/pages");
        if (res.ok) {
          const data = await res.json();
          const pList = data.pages || [];
          setPages(pList);
          if (pList.length > 0) {
            setSelectedPageId(pList[0].pageId);
          }
        }
      } catch (err) {
        console.error("Failed to load connected pages:", err);
      }
    };
    fetchPages();
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: TestMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("bn-BD", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const targetPageId =
        selectedPageId && selectedPageId !== "all" && selectedPageId !== "global"
          ? selectedPageId
          : undefined;

      const res = await fetch("/api/facebook/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          pageId: targetPageId,
          conversationHistory: messages
            .filter((m) => m.id !== "welcome")
            .slice(-6)
            .map((m) => ({
              senderType: m.sender === "user" ? "customer" : "ai",
              text: m.text,
            })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: TestMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply || "ধন্যবাদ! আপনার বার্তাটি গ্রহণ করা হয়েছে।",
          timestamp: new Date().toLocaleTimeString("bn-BD", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          modelUsed: data.modelUsed || "Gemini 2.5 Flash",
          hasKnowledge: data.hasKnowledge,
          pageName: data.pageName,
          pageId: data.pageId,
          docCount: data.docCount,
          docTitles: data.docTitles,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        toast.error("AI রেসপন্স পাওয়া যায়নি");
      }
    } catch (err: any) {
      console.error("Playground error:", err);
      toast.error("টেস্ট করার সময় সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "চ্যাট হিস্ট্রি রিসেট করা হয়েছে। আপনার শপের পলিসি বা ক্যাটালগ নিয়ে যেকোনো প্রশ্ন করুন!",
        timestamp: "এইমাত্র",
        modelUsed: "Gemini 2.5 Flash",
        hasKnowledge: true,
      },
    ]);
    toast.success("চ্যাট হিস্ট্রি ক্লিয়ার হয়েছে");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>লাইভ AI টেস্ট কনসোল (Playground)</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            আপনার আপলোডকৃত ফাইল ও পলিসির ভিত্তিতে AI কীভাবে উত্তর দেয় তা সরাসরি পরীক্ষা করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>চ্যাট ক্লিয়ার</span>
          </Button>

          <Link href="/documents">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>ডকুমেন্টস দেখুন</span>
            </Button>
          </Link>

          <Link href="/rules">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>রুলস পরিবর্তন</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Page Selector for Testing */}
      {pages.length > 0 && (
        <div className="bg-card border border-border/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">টেস্ট মোড:</span>
                <span className="text-xs font-bold text-primary">
                  {selectedPageId === "all"
                    ? "সকল পেজ (গ্লোবাল)"
                    : pages.find((p) => p.pageId === selectedPageId)?.pageName || selectedPageId}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {selectedPageId === "all"
                  ? "সব পেজের কমন ডকুমেন্টস ও নলেজ দিয়ে টেস্ট করছে।"
                  : `শুধুমাত্র "${pages.find((p) => p.pageId === selectedPageId)?.pageName || selectedPageId}" এর নলেজবেস ও পলিসি দিয়ে উত্তর দিচ্ছে।`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {pages.map((p) => (
              <Button
                key={p.pageId}
                type="button"
                size="sm"
                variant={selectedPageId === p.pageId ? "default" : "outline"}
                onClick={() => {
                  setSelectedPageId(p.pageId);
                  toast.success(`"${p.pageName}" পেজ সিলেক্ট করা হয়েছে`);
                }}
                className="h-7 text-xs px-2.5 rounded-lg shrink-0 gap-1.5"
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    p.isActive ? "bg-emerald-500" : "bg-muted-foreground"
                  }`}
                />
                <span className="max-w-[140px] truncate">{p.pageName}</span>
              </Button>
            ))}

            <Button
              type="button"
              size="sm"
              variant={selectedPageId === "all" ? "default" : "outline"}
              onClick={() => setSelectedPageId("all")}
              className="h-7 text-xs px-2.5 rounded-lg shrink-0 gap-1.5"
            >
              <Globe className="h-3 w-3" />
              <span>সকল পেজ</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2-Column Playground Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Simulated Messenger Window */}
        <div className="space-y-4 lg:col-span-8">
          <Card className="border-border/80 bg-card shadow-2xs flex flex-col h-[580px] overflow-hidden">
            {/* Chat Window Header */}
            <CardHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>ChatTime AI Messenger Bot</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground">ChatTime AI • Live Simulator</p>
                </div>
              </div>

              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]">
                Active
              </Badge>
            </CardHeader>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-background/50 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-2xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-muted/80 text-foreground border border-border/60 rounded-bl-xs"
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 font-mono flex-wrap">
                    <span>{msg.timestamp}</span>
                    {msg.pageName && (
                      <>
                        <span>•</span>
                        <span className="text-primary font-medium">{msg.pageName}</span>
                      </>
                    )}
                    {msg.docCount !== undefined && (
                      <>
                        <span>•</span>
                        <span
                          className={
                            msg.docCount > 0
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : "text-amber-500 font-medium"
                          }
                        >
                          {msg.docCount > 0
                            ? `📚 ${msg.docCount}টি ডকুমেন্ট`
                            : "⚠️ কোনো ডকুমেন্ট নেই"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
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

            {/* Quick Suggested Questions */}
            <div className="px-4 py-2 border-t border-border/40 bg-muted/20 shrink-0">
              <p className="text-[10px] text-muted-foreground font-semibold mb-1">
                স্যাম্পল প্রশ্ন ক্লিক করে ট্রাই করুন:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "ভাইয়া ডেলিভারি চার্জ কত?",
                  "ক্যাশ অন ডেলিভারিতে অর্ডার করতে চাই",
                  "প্রডাক্টের রিটার্ন পলিসি কী?",
                  "আপনাদের কোনো ডিসকাউন্ট অফার আছে কি?",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={loading}
                    className="text-[11px] rounded-full border border-border/80 bg-background px-2.5 py-0.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
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
                handleSendMessage();
              }}
              className="p-3 border-t border-border/60 bg-card flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="কাস্টমার হিসেবে যেকোনো প্রশ্ন লিখুন..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !inputMessage.trim()}
                className="h-8 w-8 rounded-xl p-0 bg-primary text-primary-foreground shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column (4 cols): AI Telemetry & Knowledge Insights */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span>AI ইঞ্জিন স্পেসিফিকেশন</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">AI স্ট্যাটাস</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  সক্রিয় (Active)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">গড় রেসপন্স স্পিড</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  &lt; ১.৫ সেকেন্ড
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">ভাষা সমর্থন</span>
                <span className="font-medium text-foreground">বাংলা, Banglish, English</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">জ্ঞান উৎস (RAG)</span>
                <span className="font-semibold text-primary">সক্রিয় (Active)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-muted/20 shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                টিপস ও ট্রিকস
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed pt-0">
              <p>
                • আপনার আপলোডকৃত ফাইল ও পলিসিতে যত স্পষ্ট তথ্য থাকবে, AI তত নিখুঁত উত্তর দেবে।
              </p>
              <p>
                • যদি কোনো পণ্যের দাম বা সাইজ না পাওয়া যায়, তবে AI সুন্দরভাবে জানিয়ে টিম মেম্বারের সহায়তা নেওয়ার প্রতিশ্রুতি দেবে।
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

