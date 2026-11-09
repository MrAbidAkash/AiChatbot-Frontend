"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  Upload,
  Plus,
  Trash2,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Send,
  MessageSquare,
  Truck,
  RotateCcw,
  CreditCard,
  Clock,
  Sliders,
  Check,
  Bot,
  Info,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DocumentItem {
  _id: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "txt" | "docx" | "csv" | "manual";
  fileSize?: number;
  uploadedAt: string;
}

export default function ShopKnowledgeManager() {
  const [activeTab, setActiveTab] = useState<"rules" | "files" | "test">("rules");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Store Policy Form State
  const [insideDhakaCharge, setInsideDhakaCharge] = useState("80");
  const [outsideDhakaCharge, setOutsideDhakaCharge] = useState("150");
  const [freeDeliveryOver, setFreeDeliveryOver] = useState("2000");
  const [deliveryDays, setDeliveryDays] = useState("১-৩ কার্যদিবস");
  const [returnDays, setReturnDays] = useState("৭ দিন");
  const [returnConditions, setReturnConditions] = useState("পণ্য ও ট্যাগ অক্ষত থাকতে হবে, ডেলিভারিম্যানের সামনে চেক করে নিতে হবে।");
  const [codEnabled, setCodEnabled] = useState(true);
  const [brandTone, setBrandTone] = useState<"friendly" | "formal" | "casual">("friendly");
  const [customRules, setCustomRules] = useState(
    "কাস্টমার ডিসকাউন্ট চাইলে বলবে: 'আপু/ভাইয়া আমাদের সব প্রোডাক্ট রিজনেবল প্রাইসে রাখা হয়েছে এবং প্রিমিয়াম কোয়ালিটি নিশ্চিত করা হয়!' স্টক শেষ হলে বিনয়ের সাথে জানিয়ে কাস্টমারের ফোন নম্বর চেয়ে রাখবে।"
  );
  const [savingRules, setSavingRules] = useState(false);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Quick FAQ Dialog State
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [savingFaq, setSavingFaq] = useState(false);

  // AI Live Tester State
  const [testInput, setTestInput] = useState("");
  const [testMessages, setTestMessages] = useState<Array<{ from: "user" | "ai"; text: string }>>([
    {
      from: "ai",
      text: "আসালামু আলাইকুম! আমি আপনার শপের AI Assistant। শপের পলিসি বা প্রোডাক্ট সম্পর্কে যেকোনো প্রশ্ন করে দেখতে পারেন!",
    },
  ]);
  const [isTesting, setIsTesting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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
- কাস্টমারকে ${brandTone === "friendly" ? "আপু/ভাইয়া সম্বোধন করে সম্মান দিয়ে কথা বলবে।" : "ফরমাল ও মার্জিত ভাষায় কথা বলবে।"}

৫. বিশেষ নিয়মাবলী ও নির্দেশনা:
${customRules}
`;

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Store Delivery & Policy Rules",
          content: policyContent,
          fileType: "manual",
        }),
      });

      if (!res.ok) throw new Error("Failed to save store rules");

      toast.success("শপের নিয়মাবলী সফলভাবে সেভ ও AI-তে সিঙ্ক হয়েছে!");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save policies");
    } finally {
      setSavingRules(false);
    }
  };

  // Upload File (PDF, XLSX, CSV, TXT)
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      toast.success(`'${file.name}' সফলভাবে আপলোড ও ইনডেক্স হয়েছে!`);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err?.message || "File upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete Document
  const handleDeleteDocument = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove '${name}'?`)) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Document removed");
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  // Add FAQ Snippet
  const handleAddFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error("Please fill both question and answer");
      return;
    }
    try {
      setSavingFaq(true);
      const content = `প্রশ্ন: ${faqQuestion.trim()}\nউত্তর: ${faqAnswer.trim()}`;
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `FAQ: ${faqQuestion.slice(0, 35)}...`,
          content,
          fileType: "manual",
        }),
      });

      if (!res.ok) throw new Error("Failed to save FAQ");

      toast.success("FAQ note added successfully!");
      setFaqQuestion("");
      setFaqAnswer("");
      setShowFaqModal(false);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add FAQ");
    } finally {
      setSavingFaq(false);
    }
  };

  // Test AI Reply
  const handleSendTestMessage = async (msgText?: string) => {
    const textToSend = msgText || testInput;
    if (!textToSend.trim() || isTesting) return;

    setTestMessages((prev) => [...prev, { from: "user", text: textToSend }]);
    setTestInput("");
    setIsTesting(true);

    try {
      const res = await fetch("/api/facebook/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
        }),
      });

      if (!res.ok) {
        throw new Error("AI response test failed");
      }

      const data = await res.json();
      setTestMessages((prev) => [
        ...prev,
        { from: "ai", text: data.reply || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।" },
      ]);
    } catch (err: any) {
      setTestMessages((prev) => [
        ...prev,
        {
          from: "ai",
          text: "দুঃখিত, টেস্ট প্রক্রিয়ায় সমস্যা হয়েছে। অনুগ্রহ করে নিয়মাবলী ঠিকমতো সেভ আছে কি না দেখুন।",
        },
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "csv":
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
      default:
        return <File className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs">
              <Sparkles className="mr-1 h-3 w-3" />
              AI Training Center
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Shop Knowledge &amp; AI Rules
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            আপনার শপের ডেলিভারি চার্জ, পলিসি এবং ক্যাটালগ সেট করুন যাতে AI কাস্টমারকে সঠিক উত্তর দিতে পারে।
          </p>
        </div>

        {/* Quick Tabs & Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "test" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("test")}
            className="gap-1.5 text-xs h-9"
          >
            <Bot className="h-4 w-4" />
            <span>লাইভ এআই টেস্ট</span>
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-1.5 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            <span>{isUploading ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.csv,.xlsx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "rules"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>শপের নিয়মাবলী ও পলিসি</span>
        </button>

        <button
          onClick={() => setActiveTab("files")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "files"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>ক্যাটালগ ও আপলোডকৃত ফাইল ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("test")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "test"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>লাইভ AI টেস্ট কনসোল</span>
        </button>
      </div>

      {/* TAB 1: STORE RULES & POLICIES */}
      {activeTab === "rules" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Form (8 Cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Delivery Charges */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  ডেলিভারি চার্জ কনফিগারেশন
                </CardTitle>
                <CardDescription className="text-xs">
                  এরিয়াভিত্তিক ডেলিভারি রেট যা কাস্টমার জানতে চাইলে বা অর্ডার করলে AI গণনা করবে।
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      ঢাকার ভেতরে ডেলিভারি চার্জ (৳)
                    </label>
                    <Input
                      type="number"
                      value={insideDhakaCharge}
                      onChange={(e) => setInsideDhakaCharge(e.target.value)}
                      placeholder="80"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      ঢাকার বাইরে ডেলিভারি চার্জ (৳)
                    </label>
                    <Input
                      type="number"
                      value={outsideDhakaCharge}
                      onChange={(e) => setOutsideDhakaCharge(e.target.value)}
                      placeholder="150"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      ফ্রি ডেলিভারি মিনিমাম অর্ডার (৳)
                    </label>
                    <Input
                      type="number"
                      value={freeDeliveryOver}
                      onChange={(e) => setFreeDeliveryOver(e.target.value)}
                      placeholder="2000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      আনুমানিক পৌঁছানোর সময়
                    </label>
                    <Input
                      type="text"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      placeholder="১-৩ কার্যদিবস"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Return Policy & COD */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                  রিটার্ন, এক্সচেঞ্জ ও পেমেন্ট শর্ত
                </CardTitle>
                <CardDescription className="text-xs">
                  ক্যাশ অন ডেলিভারি এবং রিটার্ন সংক্রান্ত প্রশ্নোত্তর AI এখান থেকে জানাবে।
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      রিটার্ন/এক্সচেঞ্জ সময়সীমা
                    </label>
                    <Input
                      type="text"
                      value={returnDays}
                      onChange={(e) => setReturnDays(e.target.value)}
                      placeholder="৭ দিন"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      পেমেন্ট অপশন
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={codEnabled}
                          onChange={(e) => setCodEnabled(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        ক্যাশ অন ডেলিভারি (COD) চালু
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    রিটার্নের শর্তাবলী
                  </label>
                  <Input
                    type="text"
                    value={returnConditions}
                    onChange={(e) => setReturnConditions(e.target.value)}
                    placeholder="পণ্য ও ট্যাগ অক্ষত থাকতে হবে..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Rules & Tone */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  কাস্টম শপ নির্দেশিকা ও ব্র্যান্ডের টোন
                </CardTitle>
                <CardDescription className="text-xs">
                  যেকোনো বিশেষ ডিসকাউন্ট নিয়ম, স্টক শেষ হলে কী বলবে ইত্যাদি বাংলায় লিখে দিন।
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    রেসপন্স টোন
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    {[
                      { id: "friendly", label: "Friendly (আপু/ভাইয়া)" },
                      { id: "formal", label: "Formal (সম্মানজনক)" },
                      { id: "casual", label: "Casual (বন্ধুত্বপূর্ণ)" },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setBrandTone(tone.id as any)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          brandTone === tone.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    অতিরিক্ত নির্দেশাবলী (ফ্রি টেক্সট)
                  </label>
                  <textarea
                    rows={4}
                    value={customRules}
                    onChange={(e) => setCustomRules(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="এখানে আপনার শপের যেকোনো বিশেষ নিয়ম লিখে দিন..."
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSavePolicies}
                    disabled={savingRules}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4" />
                    <span>{savingRules ? "সেভ হচ্ছে..." : "নিয়মাবলী সেভ ও সিঙ্ক করুন"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar Info (4 Cols) */}
          <div className="space-y-6 lg:col-span-4">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary" />
                  কীভাবে কাজ করে?
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
                  ৩. অর্ডার কনফার্ম করার সময় ঠিকানার ভিত্তিতে ডেলিভারি ফি যুক্ত করে মোট ইনভয়েস তৈরি করবে।
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-primary/5 shadow-xs border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>AI সর্বদা আপডেট থাকে</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  নিয়ম পরিবর্তন করলেই পরবর্তী মেসেজ থেকেই AI নতুন নিয়ম মেনে উত্তর দেওয়া শুরু করবে। কোনো অ্যাপ রিস্টার্ট দরকার নেই।
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("test")}
                  className="w-full text-xs h-8 gap-1.5 border-primary/30 text-primary"
                >
                  <Bot className="h-3.5 w-3.5" />
                  টেস্ট কনসোলে যাচাই করুন
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: FILES & DOCUMENTS */}
      {activeTab === "files" && (
        <div className="space-y-6">
          {/* Upload Card */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              প্রোডাক্ট ক্যাটালগ বা প্রাইস শিট আপলোড করুন
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              PDF, Excel (.xlsx, .csv) বা Word ফাইল ড্র্যাগ করে এখানে ছাড়ুন অথবা ব্রাউজ করুন। Gemini AI স্বয়ংক্রিয়ভাবে পণ্য ও দাম ইনডেক্স করবে।
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Upload className="h-4 w-4" />
                <span>{isUploading ? "প্রসেসিং হচ্ছে..." : "ফাইল সিলেক্ট করুন"}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFaqModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>কুইক FAQ নোট যোগ করুন</span>
              </Button>
            </div>
          </div>

          {/* Document Table */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">সংরক্ষিত ক্যাটালগ ও নলেজ ফাইলস</CardTitle>
                <CardDescription className="text-xs">
                  AI কাস্টমারের প্রশ্নের উত্তর দিতে যে ফাইলগুলো ব্যবহার করছে
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDocuments}
                className="h-8 gap-1.5 text-xs text-muted-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                রিলোড
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-10 w-10 opacity-30" />
                  <p className="mt-2 text-xs">এখনো কোনো ক্যাটালগ ফাইল আপলোড করা হয়নি।</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between py-3.5 px-2 hover:bg-muted/40 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {doc.title || doc.fileName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            <span className="uppercase font-mono">{doc.fileType}</span>
                            <span>•</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Indexed &amp; Active
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc._id, doc.title || doc.fileName)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: LIVE AI PLAYGROUND TEST */}
      {activeTab === "test" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Chat Window (8 Cols) */}
          <div className="lg:col-span-8">
            <Card className="border-border bg-card shadow-xs flex flex-col h-[520px]">
              <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">লাইভ এআই টেস্ট কনসোল</CardTitle>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Gemini Multimodal Engine
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setTestMessages([
                      {
                        from: "ai",
                        text: "আসালামু আলাইকুম! আমি আপনার শপের AI Assistant। শপের পলিসি বা প্রোডাক্ট সম্পর্কে যেকোনো প্রশ্ন করে দেখতে পারেন!",
                      },
                    ])
                  }
                  className="text-xs h-7"
                >
                  ক্লিয়ার চ্যাট
                </Button>
              </CardHeader>

              {/* Message List */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {testMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.from === "ai" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={`rounded-xl px-3.5 py-2 max-w-[80%] text-xs leading-relaxed whitespace-pre-line ${
                        m.from === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTesting && (
                  <div className="flex gap-2 items-center text-xs text-muted-foreground">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <span className="animate-pulse">AI উত্তর লিখছে...</span>
                  </div>
                )}
              </CardContent>

              {/* Chat Input */}
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendTestMessage();
                    }
                  }}
                  placeholder="এখানে টেস্ট মেসেজ লিখুন (e.g. ডেলিভারি চার্জ কত?)..."
                  className="text-xs h-9"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendTestMessage()}
                  disabled={isTesting || !testInput.trim()}
                  className="h-9 px-3 bg-primary text-primary-foreground"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Sample Prompts (4 Cols) */}
          <div className="space-y-4 lg:col-span-4">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  কুইক টেস্ট প্রশ্নসমূহ
                </CardTitle>
                <CardDescription className="text-xs">
                  নিচের প্রশ্নে ক্লিক করে তাৎক্ষণিক AI-এর উত্তর পরীক্ষা করুন:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  "ঢাকার ভেতরে ও বাইরে ডেলিভারি চার্জ কত?",
                  "রিটার্ন বা এক্সচেঞ্জ করতে চাইলে নিয়ম কি?",
                  "অর্ডার কনফার্ম করার জন্য কী কী তথ্য লাগবে?",
                  "ক্যাশ অন ডেলিভারিতে অর্ডার দেওয়া যাবে?",
                  "ঢাকার বাইরে পার্সেল পৌঁছাতে কতদিন লাগবে?",
                ].map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendTestMessage(sample)}
                    disabled={isTesting}
                    className="w-full text-left rounded-lg border border-border p-2.5 text-xs text-foreground hover:bg-muted/60 transition-colors"
                  >
                    💬 {sample}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quick FAQ Modal */}
      <Dialog open={showFaqModal} onOpenChange={setShowFaqModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">কুইক FAQ নোট যোগ করুন</DialogTitle>
            <DialogDescription className="text-xs">
              নির্দিষ্ট কোনো সাধারণ প্রশ্ন ও তার উত্তর সরাসরি AI মেমোরিতে যুক্ত করুন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground">প্রশ্ন (Question)</label>
              <Input
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="e.g. আপনাদের শোরুম বা দোকান কোথায়?"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">উত্তর (Answer)</label>
              <textarea
                rows={3}
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="e.g. আমাদের অনলাইনভিত্তিক শপ, কোনো ফিজিক্যাল শোরুম নেই। সারা বাংলাদেশে হোম ডেলিভারি দেওয়া হয়।"
                className="mt-1 w-full rounded-md border border-border bg-background p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowFaqModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddFaq}
              disabled={savingFaq}
              className="bg-primary text-primary-foreground"
            >
              {savingFaq ? "Saving..." : "নোট সেভ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
