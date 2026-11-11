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
  RefreshCw,
  Search,
  Globe,
  Layers,
  Share2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Link2,
  LogOut,
  Sparkles,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// --- Google Branding Icons ---
export function GoogleDriveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

export function GoogleDocsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M136 0H36C25 0 16 9 16 20v152c0 11 9 20 20 20h120c11 0 20-9 20-20V56l-40-56z"/>
      <path fill="#A1C2FA" d="M136 0v56h56L136 0z"/>
      <path fill="#FFF" d="M48 88h96v12H48zm0 24h96v12H48zm0 24h64v12H48z"/>
    </svg>
  );
}

export function GoogleSheetsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <path fill="#0F9D58" d="M136 0H36C25 0 16 9 16 20v152c0 11 9 20 20 20h120c11 0 20-9 20-20V56l-40-56z"/>
      <path fill="#87CEAC" d="M136 0v56h56L136 0z"/>
      <path fill="#FFF" d="M52 84h88v64H52V84zm12 12v16h24V96H64zm36 0v16h28V96h-28zm-36 28v16h24v-16H64zm36 0v16h28v-16h-28z"/>
    </svg>
  );
}

interface DocumentItem {
  _id: string;
  userId?: string;
  pageId?: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "txt" | "docx" | "csv" | "manual" | "sheet" | "doc" | "drive";
  size?: string;
  content?: string;
  summary?: string;
  keyTopics?: string[];
  chunks?: string[];
  metadata?: {
    source?: "upload" | "google_drive" | "google_sheets" | "google_docs";
    googleFileId?: string;
    sourceUrl?: string;
    webViewLink?: string;
    lastSyncedAt?: string;
    [key: string]: any;
  };
  uploadedAt: string;
  updatedAt?: string;
}

interface ConnectedPage {
  pageId: string;
  pageName: string;
  isActive: boolean;
  pictureUrl?: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  modifiedTime?: string;
  category: "docs" | "sheets" | "pdf" | "other";
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

  // --- Google Drive / Docs / Sheets State ---
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleTab, setGoogleTab] = useState<"url" | "drive">("url");
  const [googleUrl, setGoogleUrl] = useState("");
  const [googleCustomTitle, setGoogleCustomTitle] = useState("");
  const [googleTargetPageId, setGoogleTargetPageId] = useState<string>("all");
  const [isImportingGoogle, setIsImportingGoogle] = useState(false);
  const [isSyncingDocId, setIsSyncingDocId] = useState<string | null>(null);

  // Google OAuth Connection State
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googlePicture, setGooglePicture] = useState("");
  const [googleFiles, setGoogleFiles] = useState<GoogleDriveFile[]>([]);
  const [loadingGoogleFiles, setLoadingGoogleFiles] = useState(false);
  const [googleFileFilter, setGoogleFileFilter] = useState<"all" | "docs" | "sheets" | "pdfs">("all");
  const [googleSearchQuery, setGoogleSearchQuery] = useState("");
  const [isAuthenticatingGoogle, setIsAuthenticatingGoogle] = useState(false);

  // Document Content Preview Modal
  const [previewingDoc, setPreviewingDoc] = useState<DocumentItem | null>(null);

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

  // Fetch Google Connection Status
  const fetchGoogleStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/google/status");
      if (res.ok) {
        const data = await res.json();
        setGoogleConnected(!!data.connected);
        if (data.connected) {
          setGoogleEmail(data.email || "");
          setGoogleName(data.name || "");
          setGooglePicture(data.picture || "");
        }
      }
    } catch (err) {
      console.error("Failed to check Google status:", err);
    }
  }, []);

  useEffect(() => {
    fetchGoogleStatus();
  }, [fetchGoogleStatus]);

  // Fetch Google Drive Files
  const fetchGoogleFiles = useCallback(async (filter = googleFileFilter, search = googleSearchQuery) => {
    try {
      setLoadingGoogleFiles(true);
      const params = new URLSearchParams();
      if (filter && filter !== "all") params.set("type", filter);
      if (search && search.trim()) params.set("query", search.trim());

      const res = await fetch(`/api/integrations/google/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGoogleFiles(data.files || []);
      } else if (res.status === 401) {
        setGoogleConnected(false);
      }
    } catch (err) {
      console.error("Failed to fetch Google Drive files:", err);
    } finally {
      setLoadingGoogleFiles(false);
    }
  }, [googleFileFilter, googleSearchQuery]);

  // Listen to Google OAuth popup message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        toast.success(`Google Drive সফলভাবে কানেক্ট হয়েছে (${event.data.email})!`);
        setGoogleConnected(true);
        setGoogleEmail(event.data.email || "");
        setGoogleName(event.data.name || "");
        setGooglePicture(event.data.picture || "");
        fetchGoogleFiles();
        setGoogleTab("drive");
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        toast.error(`Google অথেনটিকেশন ব্যর্থ হয়েছে: ${event.data.error}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchGoogleFiles]);

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

  // Upload Local File (PDF, XLSX, CSV, TXT, DOCX)
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

      toast.success(`'${file.name}' সফলভাবে আপলোড ও ইনডেক্স হয়েছে (${targetLabel})!`);
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

  // Initiate Google OAuth Connect Popup
  const handleConnectGoogle = async () => {
    try {
      setIsAuthenticatingGoogle(true);
      const res = await fetch("/api/integrations/google/auth-url");
      const data = await res.json();

      if (!data.configured || !data.authUrl) {
        toast.error(data.error || "Google Credentials (.env) সঠিকভাবে কনফিগার করা নেই।");
        return;
      }

      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2 + window.screenX;
      const top = window.innerHeight / 2 - height / 2 + window.screenY;

      const popup = window.open(
        data.authUrl,
        "google_oauth_popup",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`,
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        toast.error("ব্রাউজার দ্বারা পপ-আপ ব্লক হয়েছে। অনুগ্রহ করে পপ-আপ আনব্লক করুন।");
      }
    } catch (err: any) {
      toast.error(err.message || "Google কানেকশন শুরু করতে ব্যর্থ হয়েছে");
    } finally {
      setIsAuthenticatingGoogle(false);
    }
  };

  // Disconnect Google Drive
  const handleDisconnectGoogle = async () => {
    if (!confirm("আপনি কি নিশ্চিত যে Google Drive ডিসকানেক্ট করতে চান?")) return;
    try {
      await fetch("/api/integrations/google/disconnect", { method: "POST" });
      setGoogleConnected(false);
      setGoogleEmail("");
      setGoogleName("");
      setGoogleFiles([]);
      toast.success("Google Drive সফলভাবে ডিসকানেক্ট করা হয়েছে");
    } catch {
      toast.error("ডিসকানেক্ট করতে সমস্যা হয়েছে");
    }
  };

  // Import from Google URL (Docs / Sheets / Drive Link)
  const handleImportGoogleUrl = async () => {
    if (!googleUrl.trim()) {
      toast.error("অনুগ্রহ করে একটি বৈধ Google Docs, Sheets বা Drive লিঙ্ক দিন");
      return;
    }
    try {
      setIsImportingGoogle(true);
      const res = await fetch("/api/integrations/google/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: googleUrl.trim(),
          customTitle: googleCustomTitle.trim() || undefined,
          pageId: googleTargetPageId !== "all" ? googleTargetPageId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google লিঙ্ক থেকে ফাইল ইমপোর্ট ব্যর্থ হয়েছে");
      }

      toast.success(`'${data.document.title}' গুগল থেকে সফলভাবে ইমপোর্ট ও ইনডেক্স হয়েছে!`);
      setGoogleUrl("");
      setGoogleCustomTitle("");
      setShowGoogleModal(false);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || "গুগল থেকে ফাইল আনতে সমস্যা হয়েছে");
    } finally {
      setIsImportingGoogle(false);
    }
  };

  // Import selected file from connected Google Drive
  const handleImportDriveFile = async (file: GoogleDriveFile) => {
    try {
      setIsImportingGoogle(true);
      const res = await fetch("/api/integrations/google/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          customTitle: file.name,
          pageId: googleTargetPageId !== "all" ? googleTargetPageId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ফাইল ইমপোর্ট করতে ব্যর্থ হয়েছে");
      }

      toast.success(`'${file.name}' সফলভাবে ইমপোর্ট ও ইনডেক্স হয়েছে!`);
      setShowGoogleModal(false);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || "ইমপোর্ট করতে সমস্যা হয়েছে");
    } finally {
      setIsImportingGoogle(false);
    }
  };

  // Re-sync an existing Google document/sheet
  const handleSyncDoc = async (id: string, title: string) => {
    try {
      setIsSyncingDocId(id);
      const res = await fetch(`/api/documents/${id}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সিঙ্ক করতে ব্যর্থ হয়েছে");
      }

      toast.success(`'${title}' গুগল থেকে সফলভাবে রি-সিঙ্ক ও আপডেট হয়েছে!`);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.message || "সিঙ্ক করতে ব্যর্থ হয়েছে");
    } finally {
      setIsSyncingDocId(null);
    }
  };

  const getFileIcon = (doc: DocumentItem) => {
    const isGoogleDocs = doc.fileType === "doc" || doc.metadata?.source === "google_docs";
    const isGoogleSheets = doc.fileType === "sheet" || doc.metadata?.source === "google_sheets";
    const isGoogleDrive = doc.fileType === "drive" || doc.metadata?.source === "google_drive";

    if (isGoogleDocs) return <GoogleDocsIcon className="h-5 w-5" />;
    if (isGoogleSheets) return <GoogleSheetsIcon className="h-5 w-5" />;
    if (isGoogleDrive) return <GoogleDriveIcon className="h-5 w-5" />;

    switch (doc.fileType) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "csv":
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Upload className="h-5 w-5 text-primary" />
            <span>ডকুমেন্টস ও ফাইল আপলোড</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            আপনার শপের প্রোডাক্ট ক্যাটালগ, প্রাইস শিট ও Google Docs/Sheets যুক্ত করুন — AI স্বয়ংক্রিয়ভাবে পড়ে মেসেঞ্জারে উত্তর দেবে।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Google Workspace Import Trigger */}
          <Button
            size="sm"
            onClick={() => {
              setGoogleTargetPageId(selectedPageId);
              setShowGoogleModal(true);
            }}
            className="gap-1.5 text-xs h-8 bg-card border border-border/90 text-foreground hover:bg-muted font-medium shadow-2xs"
            variant="outline"
          >
            <div className="flex items-center gap-1">
              <GoogleDriveIcon className="h-3.5 w-3.5" />
              <GoogleDocsIcon className="h-3.5 w-3.5" />
              <GoogleSheetsIcon className="h-3.5 w-3.5" />
            </div>
            <span>গুগল ড্রাইভ ও শিট</span>
          </Button>

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

          {/* <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-medium shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{isUploading ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}</span>
          </Button> */}

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
                  ? "সকল পেজের ফাইল দেখাচ্ছে। এখানে আপলোড বা গুগল থেকে আনলে ডকুমেন্ট সব পেজের AI ব্যবহার করবে।"
                  : `এখন যা আপলোড বা ইমপোর্ট করবেন তা কেবল "${selectedPage?.pageName || selectedPageId}" পেজের AI ব্যবহার করবে।`}
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

      {/* Upload Zone & Cloud Integrations Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drag & Drop Upload Zone (2 cols) */}
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
          className={`md:col-span-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all flex flex-col justify-center items-center ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border/80 bg-card hover:border-primary/50 shadow-2xs"
          }`}
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2.5">
            <Upload className="h-5 w-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">
            {selectedPageId !== "all"
              ? `"${selectedPage?.pageName || "নির্বাচিত পেজ"}" এর প্রোডাক্ট ক্যাটালগ বা প্রাইস শিট ড্রপ করুন`
              : "প্রোডাক্ট ক্যাটালগ বা প্রাইস শিট ফাইল ড্রপ করুন (সকল পেজে কার্যকর)"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            PDF, Excel (.xlsx, .csv), Word বা Text ফাইল ড্র্যাগ করে এখানে ছাড়ুন অথবা ব্রাউজ করুন।
          </p>

          <div className="mt-3.5 flex flex-wrap justify-center items-center gap-2">
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-1.5 bg-primary text-primary-foreground text-xs h-7.5 font-medium shadow-2xs"
            >
              <Upload className="h-3 w-3" />
              <span>{isUploading ? "ইনডেক্সিং হচ্ছে..." : "ব্রাউজ করে ফাইল বাছুন"}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFaqModal(true)}
              className="gap-1.5 text-xs h-7.5"
            >
              <Plus className="h-3 w-3" />
              <span>টেক্সট / FAQ যোগ করুন</span>
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2.5 text-[10px] text-muted-foreground font-mono">
            <span>PDF, XLSX, CSV, TXT, DOCX</span>
            <span>•</span>
            <span>সর্বোচ্চ 15 MB</span>
          </div>
        </div>

        {/* Google Workspace Quick Integration Card (1 col) */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <GoogleDriveIcon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Google Workspace</h4>
                  <p className="text-[10px] text-muted-foreground">Drive, Docs ও Sheets সিঙ্ক</p>
                </div>
              </div>
              {googleConnected ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[9px] px-1.5">
                  কানেক্টেড
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] text-muted-foreground">
                  সরাসরি ইমপোর্ট
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              আপনার Google Sheet-এ থাকা স্টক ও দামের তালিকা অথবা Google Doc-এর পলিসি সহজেই AI-তে ইমপোর্ট করুন।
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <button
                type="button"
                onClick={() => {
                  setGoogleTab("url");
                  setShowGoogleModal(true);
                }}
                className="flex items-center gap-1.5 p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/40 transition-colors text-left"
              >
                <GoogleDocsIcon className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-medium text-foreground truncate">Google Docs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGoogleTab("url");
                  setShowGoogleModal(true);
                }}
                className="flex items-center gap-1.5 p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/40 transition-colors text-left"
              >
                <GoogleSheetsIcon className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-medium text-foreground truncate">Google Sheets</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {googleConnected ? googleEmail : "লিঙ্ক বা ড্রাইভ থেকে আনুন"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGoogleModal(true)}
              className="text-xs h-7 gap-1"
            >
              <GoogleDriveIcon className="h-3 w-3" />
              <span>ওপেন করুন</span>
            </Button>
          </div>
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
              AI কাস্টমারের মেসেজের উত্তর দেওয়ার জন্য যে ফাইলগুলো ইনডেক্স করেছে (Drive, Docs, Sheets ও ফাইল)
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
                উপরে আপনার শপের ক্যাটালগ আপলোড করুন অথবা Google Docs / Sheets লিঙ্ক যুক্ত করুন।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredDocs.map((doc) => {
                const isGoogleDoc = doc.fileType === "doc" || doc.metadata?.source === "google_docs";
                const isGoogleSheet = doc.fileType === "sheet" || doc.metadata?.source === "google_sheets";
                const isGoogleDrive = doc.fileType === "drive" || doc.metadata?.source === "google_drive";
                const isFromGoogle = isGoogleDoc || isGoogleSheet || isGoogleDrive;

                return (
                  <div
                    key={doc._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-lg hover:bg-muted/30 transition-colors -mx-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        {getFileIcon(doc)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate max-w-sm">
                            {doc.title || doc.fileName}
                          </p>
                          {isGoogleSheet && (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1 py-0 h-4">
                              Google Sheet
                            </Badge>
                          )}
                          {isGoogleDoc && (
                            <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-600 border-blue-500/20 px-1 py-0 h-4">
                              Google Doc
                            </Badge>
                          )}
                          {isGoogleDrive && !isGoogleSheet && !isGoogleDoc && (
                            <Badge variant="outline" className="text-[9px] bg-sky-500/10 text-sky-600 border-sky-500/20 px-1 py-0 h-4">
                              Google Drive
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                          <span className="uppercase font-mono text-[10px] bg-muted px-1 rounded">
                            {doc.fileType}
                          </span>
                          <span>•</span>
                          <span>{doc.size || "1 KB"}</span>
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

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
                      {/* Page assignment dropdown */}
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

                      {/* Google Re-sync button */}
                      {isFromGoogle && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncDoc(doc._id, doc.title || doc.fileName)}
                          disabled={isSyncingDocId === doc._id}
                          className="h-7 text-[10px] px-2 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          title="গুগল ড্রাইভ থেকে সর্বশেষ ডাটা সিঙ্ক করুন"
                        >
                          <RefreshCw className={`h-3 w-3 ${isSyncingDocId === doc._id ? "animate-spin" : ""}`} />
                          <span>{isSyncingDocId === doc._id ? "সিঙ্ক হচ্ছে..." : "সিঙ্ক"}</span>
                        </Button>
                      )}

                      {/* Open original link if available */}
                      {(doc.metadata?.webViewLink || doc.metadata?.sourceUrl) && (
                        <a
                          href={doc.metadata.webViewLink || doc.metadata.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="মূল ফাইলে যান (Open in Google)"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {/* Preview document content */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewingDoc(doc)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="ডকুমেন্ট প্রিভিউ দেখুন"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]">
                        সক্রিয়
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- GOOGLE WORKSPACE MODAL (DRIVE, DOCS, SHEETS) --- */}
      <Dialog open={showGoogleModal} onOpenChange={setShowGoogleModal}>
        <DialogContent className="max-w-2xl p-6 border-border bg-card">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <GoogleDriveIcon className="h-5 w-5" />
                <GoogleDocsIcon className="h-5 w-5" />
                <GoogleSheetsIcon className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Google Workspace থেকে ডকুমেন্ট ও শিট যুক্ত করুন
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Google Docs, Google Sheets বা Google Drive থেকে সহজেই আপনার প্রোডাক্ট ডাটা ও পলিসি ইনডেক্স করুন।
            </DialogDescription>
          </DialogHeader>

          <Tabs value={googleTab} onValueChange={(v: any) => setGoogleTab(v)} className="w-full mt-2">
            <TabsList className="grid grid-cols-2 w-full h-9 bg-muted/60">
              <TabsTrigger value="url" className="text-xs gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                <span>🔗 লিঙ্ক দিয়ে সরাসরি ইমপোর্ট</span>
              </TabsTrigger>
              <TabsTrigger value="drive" className="text-xs gap-1.5">
                <HardDrive className="h-3.5 w-3.5" />
                <span>☁️ গুগল ড্রাইভ ফাইল ব্রাউজার</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: PASTE URL */}
            <TabsContent value="url" className="space-y-4 pt-3">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Google Docs / Sheets / Drive লিঙ্ক:</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Public বা &apos;Anyone with the link can view&apos;
                    </span>
                  </label>
                  <Input
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    placeholder="যেমন: https://docs.google.com/spreadsheets/d/1aBcDeFg... বা /document/d/..."
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">ডকুমেন্টের নাম (ঐচ্ছিক):</label>
                    <Input
                      value={googleCustomTitle}
                      onChange={(e) => setGoogleCustomTitle(e.target.value)}
                      placeholder="যেমন: Product Price List 2026"
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">টার্গেট পেজ (Target Page):</label>
                    <select
                      value={googleTargetPageId}
                      onChange={(e) => setGoogleTargetPageId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">🌐 সকল কানেক্টেড পেজ (Global Shared)</option>
                      {pages.map((p) => (
                        <option key={p.pageId} value={p.pageId}>
                          📄 {p.pageName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 border border-border/60 p-3 text-xs space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>কীভাবে লিঙ্ক নিবেন?</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1 pl-1">
                    <li>Google Sheet বা Doc-এ যান এবং ডান পাশের <strong>&quot;Share&quot;</strong> বাটনে ক্লিক করুন।</li>
                    <li>General access অপশনে <strong>&quot;Anyone with the link&quot;</strong> নির্বাচন করুন (Viewer হিসেবে)।</li>
                    <li><strong>&quot;Copy link&quot;</strong> এ ক্লিক করে উপরের বক্সে পেস্ট করুন।</li>
                    <li>Google Sheet-এর ক্ষেত্রে কলাম হেডারে <strong>Product Name, Price, Stock, Category</strong> রাখলে AI সবচেয়ে নিখুঁত উত্তর দিতে পারে!</li>
                  </ul>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowGoogleModal(false)} className="text-xs">
                  বাতিল
                </Button>
                <Button
                  size="sm"
                  onClick={handleImportGoogleUrl}
                  disabled={isImportingGoogle || !googleUrl.trim()}
                  className="text-xs bg-primary text-primary-foreground gap-1.5"
                >
                  <RefreshCw className={`h-3 w-3 ${isImportingGoogle ? "animate-spin" : ""}`} />
                  <span>{isImportingGoogle ? "ইনডেক্স হচ্ছে..." : "ইমপোর্ট ও ইনডেক্স করুন"}</span>
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* TAB 2: CONNECTED DRIVE BROWSER */}
            <TabsContent value="drive" className="space-y-4 pt-3">
              {!googleConnected ? (
                <div className="rounded-xl border border-dashed border-border/90 p-6 text-center space-y-3 bg-muted/10">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <GoogleDriveIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Google Drive কানেক্ট করুন</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                      আপনার Google একাউন্ট কানেক্ট করে সরাসরি Google Docs, Sheets ও PDF ফাইল নির্বাচন করে ১-ক্লিকে ইনডেক্স করুন।
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleConnectGoogle}
                    disabled={isAuthenticatingGoogle}
                    className="gap-2 bg-primary text-primary-foreground text-xs"
                  >
                    <GoogleDriveIcon className="h-3.5 w-3.5" />
                    <span>{isAuthenticatingGoogle ? "কানেক্ট হচ্ছে..." : "Google Drive কানেক্ট করুন"}</span>
                  </Button>

                  <p className="text-[10px] text-muted-foreground">
                    নিরাপদ ও রিড-অনলি এক্সেস। ChatTime AI শুধুমাত্র আপনার নির্বাচিত ফাইলের ডাটা পড়তে পারবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Account Header */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center gap-2.5">
                      {googlePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={googlePicture} alt="Avatar" className="h-7 w-7 rounded-full" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          G
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">{googleName || "Google Account"}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{googleEmail}</p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnectGoogle}
                      className="h-7 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>ডিসকানেক্ট</span>
                    </Button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={googleSearchQuery}
                        onChange={(e) => {
                          setGoogleSearchQuery(e.target.value);
                          fetchGoogleFiles(googleFileFilter, e.target.value);
                        }}
                        placeholder="ড্রাইভের ফাইল খুঁজুন..."
                        className="pl-8 text-xs h-8"
                      />
                    </div>

                    <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                      {(["all", "docs", "sheets", "pdfs"] as const).map((filter) => (
                        <Button
                          key={filter}
                          type="button"
                          variant={googleFileFilter === filter ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setGoogleFileFilter(filter);
                            fetchGoogleFiles(filter, googleSearchQuery);
                          }}
                          className="h-7 text-[10px] px-2 capitalize"
                        >
                          {filter === "all"
                            ? "সব"
                            : filter === "docs"
                              ? "Docs"
                              : filter === "sheets"
                                ? "Sheets"
                                : "PDFs"}
                        </Button>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fetchGoogleFiles()}
                        className="h-7 w-7 shrink-0 text-muted-foreground"
                        title="রিফ্রেশ"
                      >
                        <RefreshCw className={`h-3 w-3 ${loadingGoogleFiles ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  {/* File List */}
                  <div className="border border-border/80 rounded-xl divide-y divide-border/60 max-h-60 overflow-y-auto">
                    {loadingGoogleFiles ? (
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : googleFiles.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        কোনো ফাইল পাওয়া যায়নি। অন্য কিওয়ার্ড দিয়ে খুঁজুন।
                      </div>
                    ) : (
                      googleFiles.map((file) => {
                        const isDoc = file.category === "docs";
                        const isSheet = file.category === "sheets";
                        const isPdf = file.category === "pdf";

                        return (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="shrink-0">
                                {isDoc ? (
                                  <GoogleDocsIcon className="h-4.5 w-4.5" />
                                ) : isSheet ? (
                                  <GoogleSheetsIcon className="h-4.5 w-4.5" />
                                ) : isPdf ? (
                                  <FileText className="h-4.5 w-4.5 text-red-500" />
                                ) : (
                                  <File className="h-4.5 w-4.5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate max-w-sm">
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {file.size}
                                  {file.modifiedTime && (
                                    <> • {new Date(file.modifiedTime).toLocaleDateString("bn-BD")}</>
                                  )}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handleImportDriveFile(file)}
                              disabled={isImportingGoogle}
                              className="h-7 text-xs px-2.5 shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              ইমপোর্ট
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* --- ADD FAQ MODAL --- */}
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

      {/* --- DOCUMENT CONTENT PREVIEW MODAL --- */}
      <Dialog open={!!previewingDoc} onOpenChange={(open) => !open && setPreviewingDoc(null)}>
        <DialogContent className="max-w-2xl p-6 border-border bg-card max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {previewingDoc && getFileIcon(previewingDoc)}
              <DialogTitle className="text-base font-bold text-foreground truncate">
                {previewingDoc?.title || previewingDoc?.fileName}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
              <span>টাইপ: {previewingDoc?.fileType?.toUpperCase()}</span>
              <span>•</span>
              <span>সাইজ: {previewingDoc?.size || "N/A"}</span>
              {previewingDoc?.metadata?.source && (
                <>
                  <span>•</span>
                  <span>সোর্স: {previewingDoc.metadata.source}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-2 border border-border/80 rounded-xl p-4 bg-muted/20 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
            {previewingDoc?.content || previewingDoc?.summary || "কোনো টেক্সট কন্টেন্ট পাওয়া যায়নি।"}
          </div>

          <DialogFooter className="pt-3 flex items-center justify-between sm:justify-between">
            <div className="text-[11px] text-muted-foreground">
              {previewingDoc?.chunks?.length ? `${previewingDoc.chunks.length} AI চাংক ইনডেক্সড` : "ইনডেক্সড"}
            </div>
            <Button
              size="sm"
              onClick={() => setPreviewingDoc(null)}
              className="text-xs"
            >
              বন্ধ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
