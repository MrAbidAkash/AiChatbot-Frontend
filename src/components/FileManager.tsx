"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Upload,
  Cloud,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  MoreVertical,
  Link2,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Globe,
  Lock,
  Unlock,
  Settings,
  Brain,
  Sparkles,
  AlertCircle,
  X,
  Check,
  ExternalLink,
  Clock,
  Database,
  Eye,
  FilePlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

// Types
interface CloudAccount {
  id: string;
  provider: "google_drive" | "google_sheets" | "google_docs" | "dropbox" | "onedrive";
  email: string;
  connected: boolean;
  lastSync: string;
  filesCount: number;
  storageUsed: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt" | "csv" | "xlsx" | "sheet" | "doc";
  size: string;
  source: "upload" | "google_drive" | "google_sheets" | "google_docs" | "dropbox";
  status: "ready" | "training" | "trained" | "error" | "queued";
  trainingProgress?: number;
  chunks?: number;
  uploadedAt: string;
  lastModified: string;
  selected: boolean;
  folder?: string;
  content?: string;
  summary?: string;
}

interface CloudFile {
  id: string;
  name: string;
  type: string;
  size: string;
  modified: string;
  selected: boolean;
  path: string;
}

interface CloudFolder {
  id: string;
  name: string;
  path: string;
  expanded: boolean;
  files: CloudFile[];
  subfolders: CloudFolder[];
}

// Mock data
const mockCloudAccounts: CloudAccount[] = [
  {
    id: "1",
    provider: "google_drive",
    email: "user@gmail.com",
    connected: true,
    lastSync: "5 min ago",
    filesCount: 234,
    storageUsed: "2.4 GB",
  },
  {
    id: "2",
    provider: "google_sheets",
    email: "user@gmail.com",
    connected: true,
    lastSync: "2 hours ago",
    filesCount: 45,
    storageUsed: "156 MB",
  },
  {
    id: "3",
    provider: "google_docs",
    email: "user@gmail.com",
    connected: false,
    lastSync: "Never",
    filesCount: 0,
    storageUsed: "0 MB",
  },
  {
    id: "4",
    provider: "dropbox",
    email: "",
    connected: false,
    lastSync: "Never",
    filesCount: 0,
    storageUsed: "0 MB",
  },
];

const mockUploadedFiles: UploadedFile[] = [
  {
    id: "1",
    name: "Product Catalog 2024.pdf",
    type: "pdf",
    size: "2.4 MB",
    source: "upload",
    status: "trained",
    chunks: 156,
    uploadedAt: "2 days ago",
    lastModified: "2 hours ago",
    selected: false,
  },
  {
    id: "2",
    name: "Customer FAQ Database.xlsx",
    type: "xlsx",
    size: "892 KB",
    source: "google_sheets",
    status: "training",
    trainingProgress: 67,
    chunks: 89,
    uploadedAt: "1 day ago",
    lastModified: "5 min ago",
    selected: false,
  },
  {
    id: "3",
    name: "Support Guidelines.docx",
    type: "docx",
    size: "1.8 MB",
    source: "google_docs",
    status: "queued",
    chunks: 0,
    uploadedAt: "Just now",
    lastModified: "Just now",
    selected: false,
  },
  {
    id: "4",
    name: "Return Policy.pdf",
    type: "pdf",
    size: "124 KB",
    source: "upload",
    status: "trained",
    chunks: 23,
    uploadedAt: "1 week ago",
    lastModified: "1 day ago",
    selected: false,
  },
  {
    id: "5",
    name: "Pricing Sheet.csv",
    type: "csv",
    size: "45 KB",
    source: "google_drive",
    status: "error",
    chunks: 0,
    uploadedAt: "3 days ago",
    lastModified: "3 days ago",
    selected: false,
  },
];

const mockCloudFolders: CloudFolder[] = [
  {
    id: "1",
    name: "Business Documents",
    path: "/Business Documents",
    expanded: true,
    files: [
      { id: "f1", name: "Company Overview.pdf", type: "pdf", size: "1.2 MB", modified: "2 days ago", selected: false, path: "/Business Documents" },
      { id: "f2", name: "Brand Guidelines.docx", type: "docx", size: "3.4 MB", modified: "1 week ago", selected: false, path: "/Business Documents" },
    ],
    subfolders: [
      {
        id: "1-1",
        name: "Products",
        path: "/Business Documents/Products",
        expanded: false,
        files: [
          { id: "f3", name: "Product List 2024.xlsx", type: "xlsx", size: "892 KB", modified: "3 days ago", selected: false, path: "/Business Documents/Products" },
          { id: "f4", name: "Technical Specs.pdf", type: "pdf", size: "5.6 MB", modified: "1 day ago", selected: false, path: "/Business Documents/Products" },
        ],
        subfolders: [],
      },
    ],
  },
  {
    id: "2",
    name: "Customer Support",
    path: "/Customer Support",
    expanded: false,
    files: [
      { id: "f5", name: "FAQ Document.docx", type: "docx", size: "456 KB", modified: "5 days ago", selected: false, path: "/Customer Support" },
      { id: "f6", name: "Support Scripts.txt", type: "txt", size: "34 KB", modified: "2 weeks ago", selected: false, path: "/Customer Support" },
    ],
    subfolders: [],
  },
];

// Helper functions
const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "google_drive":
      return <HardDrive className="h-5 w-5" />;
    case "google_sheets":
      return <FileSpreadsheet className="h-5 w-5" />;
    case "google_docs":
      return <FileText className="h-5 w-5" />;
    case "dropbox":
      return <Cloud className="h-5 w-5" />;
    case "onedrive":
      return <Cloud className="h-5 w-5" />;
    default:
      return <Cloud className="h-5 w-5" />;
  }
};

const getProviderName = (provider: string) => {
  switch (provider) {
    case "google_drive":
      return "Google Drive";
    case "google_sheets":
      return "Google Sheets";
    case "google_docs":
      return "Google Docs";
    case "dropbox":
      return "Dropbox";
    case "onedrive":
      return "OneDrive";
    default:
      return provider;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case "google_drive":
    case "google_sheets":
    case "google_docs":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "dropbox":
      return "bg-sky-500/20 text-sky-400 border-sky-500/30";
    case "onedrive":
      return "bg-blue-600/20 text-blue-500 border-blue-600/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-400" />;
    case "docx":
    case "doc":
      return <FileText className="h-5 w-5 text-blue-400" />;
    case "xlsx":
    case "csv":
    case "sheet":
      return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
    case "txt":
      return <File className="h-5 w-5 text-muted-foreground" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string, progress?: number) => {
  switch (status) {
    case "trained":
      return (
        <Badge className="border-success/30 bg-success/10 text-success">
          <CheckCircle className="mr-1 h-3 w-3" />
          Trained
        </Badge>
      );
    case "training":
      return (
        <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-400">
          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
          Training {progress}%
        </Badge>
      );
    case "queued":
      return (
        <Badge className="border-warning/30 bg-warning/10 text-warning">
          <Clock className="mr-1 h-3 w-3" />
          Queued
        </Badge>
      );
    case "error":
      return (
        <Badge className="border-destructive/30 bg-destructive/10 text-destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          Ready
        </Badge>
      );
  }
};

export default function FileManager() {
  const [activeTab, setActiveTab] = useState("files");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [cloudAccounts, setCloudAccounts] = useState(mockCloudAccounts);
  const [cloudFolders, setCloudFolders] = useState(mockCloudFolders);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showBrowserDialog, setShowBrowserDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [storageLocation, setStorageLocation] = useState("default");
  const [autoSync, setAutoSync] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real backend sync state
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddTextModal, setShowAddTextModal] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [previewDoc, setPreviewDoc] = useState<UploadedFile | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.documents)) {
          if (data.documents.length === 0) {
            setUploadedFiles(mockUploadedFiles);
          } else {
            const formatted: UploadedFile[] = data.documents.map((d: any) => ({
              id: d._id,
              name: d.title || d.fileName,
              type: d.fileType || "txt",
              size: d.size || "1.0 KB",
              source: "upload",
              status: d.status || "trained",
              chunks: d.chunks?.length || 1,
              uploadedAt: new Date(d.uploadedAt).toLocaleDateString(),
              lastModified: new Date(d.updatedAt || d.uploadedAt).toLocaleTimeString(),
              selected: false,
              content: d.content,
              summary: d.summary,
            }));
            setUploadedFiles(formatted);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    let successCount = 0;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          successCount++;
        } else {
          const err = await res.json();
          toast.error(`Failed to upload ${file.name}: ${err.error || "Unknown error"}`);
        }
      } catch (err: any) {
        toast.error(`Error uploading ${file.name}: ${err.message}`);
      }
    }
    if (successCount > 0) {
      toast.success(`Successfully uploaded and analyzed ${successCount} document(s)!`);
      await fetchDocs();
    }
    setIsUploading(false);
  };

  const handleSaveTextKnowledge = async () => {
    if (!textContent.trim()) {
      toast.error("Please enter the knowledge text");
      return;
    }
    setIsUploading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: textTitle.trim() || "Business FAQ / Note",
          content: textContent.trim(),
          fileType: "manual",
        }),
      });
      if (res.ok) {
        toast.success("Business knowledge saved & indexed successfully!");
        setShowAddTextModal(false);
        setTextTitle("");
        setTextContent("");
        await fetchDocs();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save document");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Document removed from knowledge base");
        setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
      } else {
        toast.error("Failed to delete document");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  // Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleUploadFiles(files);
      }
    },
    [],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleUploadFiles(Array.from(files));
      }
    },
    [],
  );

  const toggleFileSelection = (fileId: string) => {
    setUploadedFiles(files =>
      files.map(f => f.id === fileId ? { ...f, selected: !f.selected } : f)
    );
  };

  const toggleFolderExpand = (folderId: string) => {
    const toggleFolder = (folders: CloudFolder[]): CloudFolder[] =>
      folders.map(f => {
        if (f.id === folderId) {
          return { ...f, expanded: !f.expanded };
        }
        return { ...f, subfolders: toggleFolder(f.subfolders) };
      });
    setCloudFolders(toggleFolder(cloudFolders));
  };

  const toggleCloudFileSelection = (fileId: string) => {
    const toggleInFolders = (folders: CloudFolder[]): CloudFolder[] =>
      folders.map(f => ({
        ...f,
        files: f.files.map(file =>
          file.id === fileId ? { ...file, selected: !file.selected } : file
        ),
        subfolders: toggleInFolders(f.subfolders),
      }));
    setCloudFolders(toggleInFolders(cloudFolders));
  };

  const getSelectedCloudFiles = (): CloudFile[] => {
    const collectFiles = (folders: CloudFolder[]): CloudFile[] =>
      folders.flatMap(f => [
        ...f.files.filter(file => file.selected),
        ...collectFiles(f.subfolders),
      ]);
    return collectFiles(cloudFolders);
  };

  const selectedFilesCount = uploadedFiles.filter(f => f.selected).length;
  const selectedCloudFilesCount = getSelectedCloudFiles().length;

  const connectAccount = (provider: string) => {
    setSelectedProvider(provider);
    setShowConnectDialog(true);
  };

  const handleConnectConfirm = () => {
    if (selectedProvider) {
      setCloudAccounts(accounts =>
        accounts.map(a =>
          a.provider === selectedProvider
            ? { ...a, connected: true, email: "user@gmail.com", lastSync: "Just now" }
            : a
        )
      );
    }
    setShowConnectDialog(false);
    setSelectedProvider(null);
  };

  const disconnectAccount = (accountId: string) => {
    setCloudAccounts(accounts =>
      accounts.map(a =>
        a.id === accountId
          ? { ...a, connected: false, email: "", lastSync: "Never", filesCount: 0 }
          : a
      )
    );
  };

  const filteredFiles = uploadedFiles.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startTraining = () => {
    const selectedIds = uploadedFiles.filter(f => f.selected).map(f => f.id);
    setUploadedFiles(files =>
      files.map(f =>
        selectedIds.includes(f.id) && f.status !== "trained"
          ? { ...f, status: "queued" as const, selected: false }
          : { ...f, selected: false }
      )
    );
  };

  // Render folder tree recursively
  const renderFolderTree = (folders: CloudFolder[], depth = 0) => {
    return folders.map(folder => (
      <div key={folder.id} style={{ marginLeft: `${depth * 16}px` }}>
        {/* Folder Header */}
        <button
          onClick={() => toggleFolderExpand(folder.id)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
        >
          {folder.expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FolderOpen className="h-4 w-4 text-yellow-500" />
          <span className="font-medium text-foreground">{folder.name}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {folder.files.length} files
          </span>
        </button>

        {/* Folder Contents */}
        {folder.expanded && (
          <div className="mt-1 space-y-1">
            {/* Files */}
            {folder.files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 ml-6 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={file.selected}
                  onCheckedChange={() => toggleCloudFileSelection(file.id)}
                />
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.size} - Modified {file.modified}
                  </p>
                </div>
              </div>
            ))}
            {/* Subfolders */}
            {renderFolderTree(folder.subfolders, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">File Manager</h2>
          <p className="text-muted-foreground">
            Upload files or connect cloud services for AI training
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBrowserDialog(true)}
            className="gap-2"
          >
            <Cloud className="h-4 w-4" />
            Browse Cloud
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.doc,.txt,.csv,.xlsx"
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="files" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">My Files</span>
            <Badge variant="secondary" className="ml-1">
              {uploadedFiles.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cloud" className="gap-2">
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Cloud Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* My Files Tab */}
        <TabsContent value="files" className="space-y-4">
          {/* Upload Drop Zone */}
          <Card
            className={`border-2 border-dashed transition-all ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="flex flex-col items-center justify-center py-10">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="rounded-full bg-primary/10 p-4 animate-spin">
                    <Loader2 className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-foreground">
                    Analyzing & Training Documents with AI...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Extracting text, generating summary and indexing for Facebook Messenger.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <p className="mt-4 text-lg font-medium text-foreground">
                    Drop business files here or click to upload
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Supports PDF, DOCX, TXT, CSV, JSON (Auto-analyzed)
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FolderOpen className="h-4 w-4" />
                      Browse Files
                    </Button>
                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={() => setShowAddTextModal(true)}
                    >
                      <FilePlus className="h-4 w-4" />
                      Add Text / FAQ Note
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* File List Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>All Files</DropdownMenuItem>
                  <DropdownMenuItem>Trained</DropdownMenuItem>
                  <DropdownMenuItem>Training</DropdownMenuItem>
                  <DropdownMenuItem>Queued</DropdownMenuItem>
                  <DropdownMenuItem>Errors</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              {selectedFilesCount > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedFilesCount} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={startTraining}
                    className="gap-2 bg-primary text-primary-foreground"
                  >
                    <Brain className="h-4 w-4" />
                    Start Training
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              <div className="flex rounded-lg border border-border">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* File List */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-0">
              {viewMode === "list" ? (
                <div className="divide-y divide-border">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${
                        file.selected ? "bg-primary/5" : ""
                      }`}
                    >
                      <Checkbox
                        checked={file.selected}
                        onCheckedChange={() => toggleFileSelection(file.id)}
                      />
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">
                            {file.name}
                          </p>
                          {file.source !== "upload" && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getProviderColor(file.source)}`}
                            >
                              {getProviderIcon(file.source)}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{file.size}</span>
                          <span>-</span>
                          <span>{file.chunks || 0} chunks</span>
                          <span>-</span>
                          <span>Uploaded {file.uploadedAt}</span>
                        </div>
                        {file.status === "training" && file.trainingProgress && (
                          <Progress value={file.trainingProgress} className="mt-2 h-1" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(file.status, file.trainingProgress)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewDoc(file)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Content & Summary
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`group relative rounded-xl border p-4 transition-all hover:border-primary/50 hover:shadow-md ${
                        file.selected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="absolute right-2 top-2">
                        <Checkbox checked={file.selected} />
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        {getFileIcon(file.type)}
                      </div>
                      <p className="mt-3 truncate font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {file.size}
                      </p>
                      <div className="mt-3">
                        {getStatusBadge(file.status, file.trainingProgress)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cloud Accounts Tab */}
        <TabsContent value="cloud" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {cloudAccounts.map((account) => (
              <Card
                key={account.id}
                className={`border-border/50 transition-all ${
                  account.connected ? "bg-card/50" : "bg-muted/30"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-xl p-3 ${getProviderColor(account.provider)}`}>
                        {getProviderIcon(account.provider)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {getProviderName(account.provider)}
                        </h3>
                        {account.connected ? (
                          <p className="text-sm text-muted-foreground">
                            {account.email}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Not connected
                          </p>
                        )}
                      </div>
                    </div>
                    {account.connected ? (
                      <Badge className="border-success/30 bg-success/10 text-success">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Lock className="mr-1 h-3 w-3" />
                        Disconnected
                      </Badge>
                    )}
                  </div>

                  {account.connected && (
                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Files</p>
                        <p className="font-semibold text-foreground">
                          {account.filesCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Storage</p>
                        <p className="font-semibold text-foreground">
                          {account.storageUsed}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Sync</p>
                        <p className="font-semibold text-foreground">
                          {account.lastSync}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {account.connected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => {
                            setSelectedProvider(account.provider);
                            setShowBrowserDialog(true);
                          }}
                        >
                          <FolderOpen className="h-4 w-4" />
                          Browse
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Sync
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => disconnectAccount(account.id)}
                            >
                              <Unlock className="mr-2 h-4 w-4" />
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <Button
                        className="w-full gap-2 bg-primary text-primary-foreground"
                        onClick={() => connectAccount(account.provider)}
                      >
                        <Link2 className="h-4 w-4" />
                        Connect Account
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add More Integrations */}
          <Card className="border-2 border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-muted p-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 font-medium text-foreground">
                Connect More Services
              </p>
              <p className="text-sm text-muted-foreground">
                OneDrive, Notion, and more coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
              <CardDescription>
                Configure where your files are stored and processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Storage Location</p>
                  <p className="text-sm text-muted-foreground">
                    Choose where uploaded files are stored
                  </p>
                </div>
                <Select value={storageLocation} onValueChange={setStorageLocation}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Storage</SelectItem>
                    <SelectItem value="us-east">US East</SelectItem>
                    <SelectItem value="eu-west">EU West</SelectItem>
                    <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto-Sync Cloud Files</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync changes from connected cloud accounts
                  </p>
                </div>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto-Train New Files</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically start AI training when new files are added
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Training Configuration</CardTitle>
              <CardDescription>
                Customize how files are processed for AI training
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Chunk Size</p>
                  <p className="text-sm text-muted-foreground">
                    Size of text chunks for embeddings
                  </p>
                </div>
                <Select defaultValue="medium">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (256 tokens)</SelectItem>
                    <SelectItem value="medium">Medium (512 tokens)</SelectItem>
                    <SelectItem value="large">Large (1024 tokens)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Overlap</p>
                  <p className="text-sm text-muted-foreground">
                    Overlap between consecutive chunks
                  </p>
                </div>
                <Select defaultValue="20">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Delete All Files</p>
                  <p className="text-sm text-muted-foreground">
                    Remove all uploaded files and training data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete All
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Disconnect All Accounts
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Remove all connected cloud accounts
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Disconnect All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connect Account Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedProvider && getProviderIcon(selectedProvider)}
              Connect {selectedProvider && getProviderName(selectedProvider)}
            </DialogTitle>
            <DialogDescription>
              You will be redirected to authenticate with your account. We only
              request read access to your files.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Secure Connection</p>
                  <p className="text-sm text-muted-foreground">
                    Your credentials are never stored. We use OAuth 2.0 for secure
                    authentication.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Permissions requested:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  View files and folders
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Download file contents
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="line-through">Modify or delete files</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectConfirm} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Continue to {selectedProvider && getProviderName(selectedProvider)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloud File Browser Dialog */}
      <Dialog open={showBrowserDialog} onOpenChange={setShowBrowserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5" />
              Select Files from Cloud
            </DialogTitle>
            <DialogDescription>
              Choose files and folders to import for AI training
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search files..." className="pl-9" />
            </div>

            {/* Folder Tree */}
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              <div className="p-2">{renderFolderTree(cloudFolders)}</div>
            </div>

            {/* Selected count */}
            {selectedCloudFilesCount > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/10 p-3">
                <span className="text-sm text-foreground">
                  {selectedCloudFilesCount} files selected
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const clearSelections = (folders: CloudFolder[]): CloudFolder[] =>
                      folders.map(f => ({
                        ...f,
                        files: f.files.map(file => ({ ...file, selected: false })),
                        subfolders: clearSelections(f.subfolders),
                      }));
                    setCloudFolders(clearSelections(cloudFolders));
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrowserDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={selectedCloudFilesCount === 0}
              onClick={() => setShowBrowserDialog(false)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Import {selectedCloudFilesCount > 0 ? `${selectedCloudFilesCount} Files` : "Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding manual text or FAQ */}
      <Dialog open={showAddTextModal} onOpenChange={setShowAddTextModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Business Knowledge / FAQ</DialogTitle>
            <DialogDescription>
              Paste company policies, product descriptions, FAQs, operating hours, delivery fees, or return terms. The AI will analyze and index this text to answer Facebook customers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Document / Topic Title</label>
              <Input
                placeholder="e.g. Return Policy & Delivery Fees"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Knowledge Content (Text or FAQs)</label>
              <textarea
                rows={8}
                placeholder={"e.g.\nQ: What are your opening hours?\nA: We are open 9am - 9pm every day.\n\nDelivery Charges:\nInside Dhaka: 60 BDT (24-48 hours)\nOutside Dhaka: 120 BDT (3-5 days)"}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTextModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTextKnowledge} disabled={isUploading || !textContent.trim()}>
              {isUploading ? "Training with AI..." : "Save & Train"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for previewing document content and AI summary */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {previewDoc?.name}
            </DialogTitle>
            <DialogDescription>
              Status: <span className="text-emerald-500 font-medium">Trained</span> • {previewDoc?.size} • {previewDoc?.chunks || 1} chunks
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
            {previewDoc?.summary && (
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Summary
                </p>
                <p className="mt-1 text-sm text-foreground leading-relaxed">
                  {previewDoc.summary}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Extracted Text Content
              </p>
              <div className="rounded-lg border bg-muted/40 p-4 text-xs font-mono text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto">
                {previewDoc?.content || "No text preview available for this mock file."}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDoc(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
