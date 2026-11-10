"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Plus,
  Trash2,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Sliders,
  Bot,
  ExternalLink,
  ShieldCheck,
  Search,
  Globe,
  Layers,
  Share2,
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
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentItem {
  _id: string;
  userId?: string;
  pageId?: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "txt" | "docx" | "csv" | "manual";
  fileSize?: number;
  uploadedAt: string;
  updatedAt?: string;
}

interface ConnectedPage {
  pageId: string;
  pageName: string;
  isActive: boolean;
  pictureUrl?: string;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Connected Pages & Isolation State
  const [pages, setPages] = useState<ConnectedPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("all");
  const [faqTargetPageId, setFaqTargetPageId] = useState<string>("all");

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Quick FAQ Modal State
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [savingFaq, setSavingFaq] = useState(false);

  // Fetch connected pages
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch("/api/facebook/pages");
        if (res.ok) {
          const data = await res.json();
          setPages(data.pages || []);
        }
      } catch (err) {
        console.error("Failed to load connected pages:", err);
      }
    };
    fetchPages();
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        selectedPageId && selectedPageId !== "all"
          ? `/api/documents?pageId=${selectedPageId}&strict=true`
          : "/api/documents";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch documents:", err);
      toast.error("ডকুমেন্টস লোড হতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, [selectedPageId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Reassign document page
  const handleUpdateDocPage = async (id: string, newPageId: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: newPageId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update page");
      const targetLabel =
        newPageId !== "all" && newPageId !== "global"
          ? pages.find((p) => p.pageId === newPageId)?.pageName || newPageId
          : "সকল পেজ (Global)";
      toast.success(`ডকুমেন্টটি "${targetLabel}" এর জন্য নির্ধারিত হয়েছে!`);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err?.message || "পেজ পরিবর্তন করতে সমস্যা হয়েছে");
    }
  };

  // Upload File (PDF, XLSX, CSV, TXT, DOCX)
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
      if (selectedPageId && selectedPageId !== "all" && selectedPageId !== "global") {
        formData.append("pageId", selectedPageId);
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const targetLabel =
        selectedPageId && selectedPageId !== "all" && selectedPageId !== "global"
          ? pages.find((p) => p.pageId === selectedPageId)?.pageName || selectedPageId
          : "সকল পেজ";

      toast.success(`'${file.name}' সফলভাবে আপলোড হয়েছে (${targetLabel})!`);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err?.message || "ফাইল আপলোড ব্যর্থ হয়েছে");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id: string, name: string) => {
    if (!confirm(`আপনি কি '${name}' মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("ডকুমেন্ট সফলভাবে মুছে ফেলা হয়েছে");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err?.message || "মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  // Add FAQ Snippet
  const handleAddFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error("অনুগ্রহ করে প্রশ্ন ও উত্তর উভয় ফিল্ড পূরণ করুন");
      return;
    }
    try {
      setSavingFaq(true);
      const content = `প্রশ্ন: ${faqQuestion.trim()}\nউত্তর: ${faqAnswer.trim()}`;
      const targetPageId =
        faqTargetPageId && faqTargetPageId !== "all" && faqTargetPageId !== "global"
          ? faqTargetPageId
          : undefined;

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `FAQ: ${faqQuestion.slice(0, 35)}...`,
          content,
          fileType: "manual",
          pageId: targetPageId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save FAQ");

      toast.success("FAQ নোট সফলভাবে যুক্ত হয়েছে!");
      setFaqQuestion("");
      setFaqAnswer("");
      setShowFaqModal(false);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err?.message || "FAQ সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSavingFaq(false);
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

  const filteredDocs = documents.filter((doc) =>
    (doc.title || doc.fileName || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getPageName = (pageId?: string) => {
    if (!pageId) return "সকল পেজে সক্রিয়";
    const p = pages.find((page) => page.pageId === pageId);
    return p ? p.pageName : `Page ID: ${pageId}`;
  };

  const selectedPage = pages.find((p) => p.pageId === selectedPageId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>ডকুমেন্টস ও ফাইল আপলোড</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            আপনার শপের প্রোডাক্ট ক্যাটালগ, সাইজ চার্ট ও নির্দেশিকা আপলোড করুন — AI স্বয়ংক্রিয়ভাবে পড়ে উত্তর দেবে।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFaqTargetPageId(selectedPageId);
              setShowFaqModal(true);
            }}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>কুইক FAQ নোট</span>
          </Button>

          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-medium shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{isUploading ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}</span>
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.csv,.xlsx,.txt,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>
      </div>

      {/* Page Selector & Isolation Bar */}
      {pages.length > 0 && (
        <div className="bg-card border border-border/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">পেজ আইসোলেশন মোড:</span>
                <span className="text-xs font-bold text-primary">
                  {selectedPageId === "all" ? "সকল পেজ (All Pages)" : selectedPage?.pageName || selectedPageId}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {selectedPageId === "all"
                  ? "সকল পেজের ফাইল দেখাচ্ছে। এখানে আপলোড করলে ডকুমেন্ট সব পেজের AI ব্যবহার করবে।"
                  : `এখন যা আপলোড করবেন তা কেবল "${selectedPage?.pageName || selectedPageId}" পেজের AI উত্তর দিতে ব্যবহার করবে।`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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

            {pages.map((p) => (
              <Button
                key={p.pageId}
                type="button"
                size="sm"
                variant={selectedPageId === p.pageId ? "default" : "outline"}
                onClick={() => setSelectedPageId(p.pageId)}
                className="h-7 text-xs px-2.5 rounded-lg shrink-0 gap-1.5"
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    p.isActive ? "bg-emerald-500" : "bg-muted-foreground"
                  }`}
                />
                <span className="max-w-[130px] truncate">{p.pageName}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
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
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border/80 bg-card hover:border-primary/50 shadow-2xs"
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
          <Upload className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {selectedPageId !== "all"
            ? `"${selectedPage?.pageName || "নির্বাচিত পেজ"}" এর প্রোডাক্ট ক্যাটালগ বা প্রাইস শিট ড্রপ করুন`
            : "প্রোডাক্ট ক্যাটালগ বা প্রাইস শিট ফাইল ড্রপ করুন (সকল পেজে কার্যকর)"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
          PDF, Excel (.xlsx, .csv), Word বা Text ফাইল ড্র্যাগ করে এখানে ছাড়ুন অথবা ব্রাউজ করুন। AI স্বয়ংক্রিয়ভাবে টেক্সট ইনডেক্স করবে।
        </p>

        <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2 bg-primary text-primary-foreground text-xs h-8 font-medium shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{isUploading ? "ইনডেক্সিং হচ্ছে..." : "ব্রাউজ করে ফাইল বাছুন"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFaqModal(true)}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>টেক্সট / FAQ যোগ করুন</span>
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-muted-foreground font-mono">
          <span>সমর্থিত: PDF, XLSX, CSV, TXT, DOCX</span>
          <span>•</span>
          <span>সর্বোচ্চ: 15 MB</span>
        </div>
      </div>

      {/* Documents Table Card */}
      <Card className="border-border/80 bg-card shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>সংরক্ষিত ডকুমেন্টস ও ক্যাটালগ ({documents.length})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              AI কাস্টমারের মেসেজের উত্তর দেওয়ার জন্য যে ফাইলগুলো ইনডেক্স করেছে
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ফাইল খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-border bg-muted/40 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-56"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDocuments}
              className="h-7 w-7 text-muted-foreground"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-1">
          {loading ? (
            <div className="divide-y divide-border/60 py-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-lg -mx-2"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-48 sm:w-64 rounded-md" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/10">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-foreground">কোনো ডকুমেন্ট পাওয়া যায়নি</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                উপরে আপনার শপের ক্যাটালগ বা প্রাইস শিট আপলোড করুন।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-lg hover:bg-muted/30 transition-colors -mx-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {doc.title || doc.fileName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                        <span className="uppercase font-mono text-[10px] bg-muted px-1 rounded">
                          {doc.fileType}
                        </span>
                        <span>•</span>
                        <span>{new Date(doc.updatedAt || doc.uploadedAt).toLocaleDateString("bn-BD")}</span>
                        <span>•</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            doc.pageId
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {doc.pageId ? (
                            <>
                              <Share2 className="h-2.5 w-2.5" />
                              <span className="max-w-[130px] truncate">{getPageName(doc.pageId)}</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-2.5 w-2.5" />
                              <span>সকল পেজ (Global)</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                    {pages.length > 0 && (
                      <select
                        value={doc.pageId || "global"}
                        onChange={(e) => handleUpdateDocPage(doc._id, e.target.value)}
                        className="h-7 text-[10px] font-medium rounded-md border border-border bg-background px-1.5 text-foreground hover:border-primary/50 cursor-pointer shadow-2xs"
                        title="এই ডকুমেন্টটির পেজ পরিবর্তন করুন"
                      >
                        <option value="global">🌐 সকল পেজ (Global)</option>
                        {pages.map((p) => (
                          <option key={p.pageId} value={p.pageId}>
                            📄 {p.pageName}
                          </option>
                        ))}
                      </select>
                    )}

                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]">
                      ইনডেক্সড ও সক্রিয়
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDoc(doc._id, doc.title || doc.fileName)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add FAQ Modal */}
      <Dialog open={showFaqModal} onOpenChange={setShowFaqModal}>
        <DialogContent className="max-w-md p-5 border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">কুইক FAQ নোট যোগ করুন</DialogTitle>
            <DialogDescription className="text-xs">
              কাস্টমারদের সচরাচর করা প্রশ্ন ও সেটির নির্দিষ্ট উত্তর লিখে দিন
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {pages.length > 0 && (
              <div>
                <label className="font-semibold text-foreground">টার্গেট পেজ (Target Page)</label>
                <select
                  value={faqTargetPageId}
                  onChange={(e) => setFaqTargetPageId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">🌐 সকল কানেক্টেড পেজ (Global Shared)</option>
                  {pages.map((p) => (
                    <option key={p.pageId} value={p.pageId}>
                      📄 {p.pageName} ({p.pageId})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {faqTargetPageId === "all"
                    ? "এই FAQ আপনার সব কানেক্টেড পেজের AI ব্যবহার করবে।"
                    : "এই FAQ শুধুমাত্র নির্বাচিত পেজের AI ব্যবহার করবে।"}
                </p>
              </div>
            )}

            <div>
              <label className="font-semibold text-foreground">প্রশ্ন (Question)</label>
              <Input
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="যেমন: আপনাদের শপ কোথায় বা পিকআপ পয়েন্ট আছে কি?"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground">উত্তর (Answer)</label>
              <textarea
                rows={3}
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="যেমন: আমাদের আউটলেট ধানমন্ডি ২৭ নম্বর রোডে, প্রতিদিন সকাল ১০টা থেকে রাত ৮টা পর্যন্ত খোলা।"
                className="mt-1 w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFaqModal(false)}
              className="text-xs"
            >
              বাতিল
            </Button>
            <Button
              size="sm"
              onClick={handleAddFaq}
              disabled={savingFaq}
              className="text-xs bg-primary text-primary-foreground"
            >
              {savingFaq ? "সেভ হচ্ছে..." : "FAQ সেভ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

