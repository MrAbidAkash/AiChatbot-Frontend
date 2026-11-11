// src/components/SteadfastManager.tsx
"use client";

import { useState, useEffect, useCallback, useId, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  KeyRound,
  ShieldCheck,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  ArrowUpRight,
  Eye,
  EyeOff,
  Building,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SteadfastParcel } from "@/lib/steadfast";

interface ConfigState {
  isConfigured: boolean;
  apiKeyMasked: string;
  baseUrl: string;
  updatedAt?: string;
}

function SteadfastManagerContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<ConfigState>({
    isConfigured: false,
    apiKeyMasked: "",
    baseUrl: "https://portal.steadfast.com.bd/api/v1",
  });
  const [configLoading, setConfigLoading] = useState(true);

  // Stats
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Parcels
  const [parcels, setParcels] = useState<SteadfastParcel[]>([]);
  const [parcelsLoading, setParcelsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [trackingLoadingId, setTrackingLoadingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Settings form state
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [secretKeyInput, setSecretKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("https://portal.steadfast.com.bd/api/v1");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Create order form state
  const [invoice, setInvoice] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [codAmount, setCodAmount] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [totalLot, setTotalLot] = useState("1");
  const [note, setNote] = useState("");
  const [deliveryType, setDeliveryType] = useState("0"); // 0 = Home, 1 = Hub
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Fetch Steadfast configuration
  const fetchConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const res = await fetch("/api/courier/steadfast/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.isConfigured) {
          fetchBalance();
        }
      }
    } catch (err) {
      console.error("Failed to load Steadfast config:", err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // Fetch Balance from Steadfast
  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const res = await fetch("/api/courier/steadfast/balance");
      if (res.ok) {
        const data = await res.json();
        setBalance(data.current_balance ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch Steadfast balance:", err);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch Parcels
  const fetchParcels = useCallback(async () => {
    try {
      setParcelsLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/courier/steadfast/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setParcels(data.parcels || []);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load parcels:", err);
      toast.error("পার্সেল তালিকা লোড করতে সমস্যা হয়েছে");
    } finally {
      setParcelsLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParcels();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchParcels]);

  // Handle URL query parameters (e.g. from customer inbox)
  useEffect(() => {
    const queryName = searchParams.get("name");
    const queryPhone = searchParams.get("phone");
    const queryAddress = searchParams.get("address");
    const queryCod = searchParams.get("cod");

    if (queryName || queryPhone || queryAddress || queryCod) {
      if (queryName) setRecipientName(queryName);
      if (queryPhone) setRecipientPhone(queryPhone);
      if (queryAddress) setRecipientAddress(queryAddress);
      if (queryCod) setCodAmount(queryCod);
      setInvoice(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
      setCreateOpen(true);
    }
  }, [searchParams]);

  // Handle Manual Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchParcels(), config.isConfigured ? fetchBalance() : Promise.resolve()]);
    toast.success("ডাটা রিফ্রেশ করা হয়েছে");
  };

  // Reset Create Order Form
  const resetOrderForm = () => {
    setInvoice(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
    setRecipientName("");
    setRecipientPhone("");
    setRecipientAddress("");
    setCodAmount("");
    setItemDescription("");
    setTotalLot("1");
    setNote("");
    setDeliveryType("0");
  };

  const handleOpenCreateModal = () => {
    if (!config.isConfigured) {
      toast.error("অনুগ্রহ করে প্রথমে আপনার Steadfast API Key ও Secret Key সেট করুন");
      setSettingsOpen(true);
      return;
    }
    resetOrderForm();
    setCreateOpen(true);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || !secretKeyInput.trim()) {
      toast.error("Api-Key এবং Secret-Key উভয়ই প্রদান করুন");
      return;
    }

    setSavingSettings(true);
    try {
      const res = await fetch("/api/courier/steadfast/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim(),
          secretKey: secretKeyInput.trim(),
          baseUrl: baseUrlInput.trim(),
          testConnection: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সংরক্ষণ করতে ব্যর্থ হয়েছে");
      }

      toast.success(data.message || "Steadfast ক্রেডেনশিয়াল সংরক্ষিত হয়েছে!");
      setSettingsOpen(false);
      setApiKeyInput("");
      setSecretKeyInput("");
      fetchConfig();
    } catch (err: any) {
      toast.error(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে");
    } finally {
      setSavingSettings(false);
    }
  };

  // Submit New Parcel Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      toast.error("কাস্টমারের নাম প্রদান করুন");
      return;
    }
    if (!recipientPhone.trim()) {
      toast.error("কাস্টমারের ফোন নম্বর প্রদান করুন");
      return;
    }
    if (!recipientAddress.trim()) {
      toast.error("ডেলিভারির সম্পূর্ণ ঠিকানা প্রদান করুন");
      return;
    }
    if (codAmount === "" || isNaN(Number(codAmount)) || Number(codAmount) < 0) {
      toast.error("সঠিক ক্যাশ অন ডেলিভারি (COD) পরিমাণ লিখুন (০ বা তার বেশি)");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await fetch("/api/courier/steadfast/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: invoice.trim(),
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          recipient_address: recipientAddress.trim(),
          cod_amount: Number(codAmount),
          item_description: itemDescription.trim() || undefined,
          total_lot: Number(totalLot) || 1,
          note: note.trim() || undefined,
          delivery_type: Number(deliveryType),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "পার্সেল তৈরি করতে ব্যর্থ হয়েছে");
      }

      toast.success(
        `পার্সেল সফলভাবে তৈরি হয়েছে! ট্র্যাকিং কোড: ${data.parcel?.tracking_code || data.parcel?.consignment_id}`
      );
      setCreateOpen(false);
      resetOrderForm();
      fetchParcels();
      fetchBalance();
    } catch (err: any) {
      toast.error(err.message || "পার্সেল তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Sync Live Status for a Parcel
  const handleSyncStatus = async (parcel: SteadfastParcel) => {
    const idToTrack = parcel.consignment_id || parcel._id;
    if (!idToTrack) return;

    setTrackingLoadingId(String(parcel._id));
    try {
      const res = await fetch(
        `/api/courier/steadfast/orders/${parcel._id}/track?cid=${parcel.consignment_id}&tracking_code=${parcel.tracking_code || ""}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "স্ট্যাটাস আপডেট পাওয়া যায়নি");
      }

      toast.success(`পার্সেল স্ট্যাটাস আপডেট: ${formatStatus(data.status).label}`);
      setParcels((prev) =>
        prev.map((p) =>
          p._id === parcel._id ? { ...p, status: data.status, updatedAt: new Date() } : p
        )
      );
    } catch (err: any) {
      toast.error(err.message || "স্ট্যাটাস রিফ্রেশ ব্যর্থ হয়েছে");
    } finally {
      setTrackingLoadingId(null);
    }
  };

  // Copy tracking code helper
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("ট্র্যাকিং কোড কপি করা হয়েছে");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Status Formatter
  const formatStatus = (statusStr?: string) => {
    const s = (statusStr || "in_review").toLowerCase();
    switch (s) {
      case "delivered":
        return {
          label: "ডেলিভার্ড (Delivered)",
          color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
      case "partial_delivered":
        return {
          label: "আংশিক ডেলিভার্ড",
          color: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400",
        };
      case "cancelled":
        return {
          label: "বাতিল (Cancelled)",
          color: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
        };
      case "hold":
        return {
          label: "হোল্ড (On Hold)",
          color: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        };
      case "pending":
        return {
          label: "পেন্ডিং (Pending)",
          color: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
        };
      case "in_review":
      default:
        return {
          label: "রিভিউ চলছে (In Review)",
          color: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        };
    }
  };

  // Statistics calculation
  const stats = {
    total: totalCount,
    delivered: parcels.filter((p) => p.status === "delivered").length,
    pending: parcels.filter(
      (p) => p.status === "pending" || p.status === "in_review" || p.status === "hold"
    ).length,
    cancelled: parcels.filter((p) => p.status === "cancelled").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span>কুরিয়ার ও পার্সেল (Steadfast)</span>
            </h1>
            <Badge
              variant="outline"
              className={
                config.isConfigured
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs"
              }
            >
              {config.isConfigured ? "API সংযুক্ত" : "API কনফিগার করা নেই"}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            আপনার ড্যাশবোর্ড থেকে সরাসরি Steadfast কুরিয়ারে পার্সেল পাঠান ও লাইভ ট্র্যাকিং পরিচালনা করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || parcelsLoading}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="gap-1.5 text-xs h-8 border-border"
          >
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
            <span>API সেটিংস</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground font-medium shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>নতুন পার্সেল পাঠান</span>
          </Button>
        </div>
      </div>

      {/* API Not Connected Banner */}
      {!config.isConfigured && !configLoading && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Steadfast Courier API সংযুক্ত করা হয়নি
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                আপনার Steadfast মার্চেন্ট প্যানেল (portal.steadfast.com.bd) থেকে{" "}
                <strong>Api-Key</strong> ও <strong>Secret-Key</strong> সংগ্রহ করে এখানে সেভ করুন, যাতে সরাসরি ১-ক্লিকে পার্সেল বুকিং করা যায়।
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0 self-end sm:self-auto"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>API Key সেট করুন</span>
          </Button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Balance */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="text-xs font-medium">Steadfast মার্চেন্ট ব্যালেন্স</CardDescription>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={fetchBalance}
              disabled={balanceLoading || !config.isConfigured}
            >
              <RefreshCw className={`h-3 w-3 ${balanceLoading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground flex items-baseline gap-1">
              <span>৳</span>
              <span>
                {balanceLoading ? "..." : balance !== null ? balance.toLocaleString("bn-BD") : "০.০০"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {config.isConfigured ? "লাইভ COD পে-আউট লেজার" : "কানেকশন প্রয়োজন"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Parcels */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="text-xs font-medium">মোট বুকিংকৃত পার্সেল</CardDescription>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
              {stats.total.toLocaleString("bn-BD")}
            </div>
            <p className="text-[11px] text-muted-foreground">ড্যাশবোর্ড হতে প্রেরিত</p>
          </CardContent>
        </Card>

        {/* Card 3: Delivered */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="text-xs font-medium">সফল ডেলিভারি</CardDescription>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.delivered.toLocaleString("bn-BD")}
            </div>
            <p className="text-[11px] text-muted-foreground">কাস্টমার গ্রহণ করেছেন</p>
          </CardContent>
        </Card>

        {/* Card 4: Pending / In Transit */}
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="text-xs font-medium">চলমান / ট্রানজিটে</CardDescription>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {stats.pending.toLocaleString("bn-BD")}
            </div>
            <p className="text-[11px] text-muted-foreground">ডেলিভারির অপেক্ষায় আছে</p>
          </CardContent>
        </Card>
      </section>

      {/* Parcels Table Card */}
      <Card className="border-border/80 bg-card shadow-2xs">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <span>পার্সেল ও ডেলিভারি হিস্ট্রি</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {parcels.length} টি পার্সেল
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                বুকিংকৃত পার্সেলের বর্তমান অবস্থান ও ডেলিভারি আপডেট দেখতে ট্র্যাকিং করুন।
              </CardDescription>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="ইনভয়েস, ফোন, নাম বা কোড খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/40"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-[140px] bg-muted/40">
                  <SelectValue placeholder="সব স্ট্যাটাস" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
                  <SelectItem value="in_review">ইন রিভিউ (In Review)</SelectItem>
                  <SelectItem value="pending">পেন্ডিং (Pending)</SelectItem>
                  <SelectItem value="delivered">ডেলিভার্ড (Delivered)</SelectItem>
                  <SelectItem value="partial_delivered">আংশিক ডেলিভার্ড</SelectItem>
                  <SelectItem value="cancelled">বাতিল (Cancelled)</SelectItem>
                  <SelectItem value="hold">হোল্ড (Hold)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {parcelsLoading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">পার্সেল ডাটা লোড হচ্ছে...</p>
            </div>
          ) : parcels.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
                <Package className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">কোনো পার্সেল পাওয়া যায়নি</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {search
                    ? "আপনার খোঁজের সাথে কোনো পার্সেল মিলছে না। সার্চ কিওয়ার্ড পরিবর্তন করে দেখতে পারেন।"
                    : "এখনও কোনো পার্সেল বুকিং করা হয়নি। 'নতুন পার্সেল পাঠান' বাটনে ক্লিক করে প্রথম পার্সেল তৈরি করুন।"}
                </p>
              </div>
              {!search && (
                <Button size="sm" onClick={handleOpenCreateModal} className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>নতুন পার্সেল তৈরি করুন</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/60 text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-medium">ইনভয়েস ও ট্র্যাকিং</th>
                    <th className="py-3 px-4 font-medium">কাস্টমার তথ্য</th>
                    <th className="py-3 px-4 font-medium">ঠিকানা</th>
                    <th className="py-3 px-4 font-medium">COD পরিমাণ</th>
                    <th className="py-3 px-4 font-medium">তারিখ</th>
                    <th className="py-3 px-4 font-medium">বর্তমান অবস্থা</th>
                    <th className="py-3 px-4 font-medium text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {parcels.map((parcel) => {
                    const statusInfo = formatStatus(parcel.status);
                    const isTrackingThis = trackingLoadingId === String(parcel._id);

                    return (
                      <tr key={parcel._id} className="hover:bg-muted/20 transition-colors">
                        {/* Invoice & Tracking */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{parcel.invoice}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                            <span>{parcel.tracking_code || `CID: ${parcel.consignment_id}`}</span>
                            {parcel.tracking_code && (
                              <button
                                onClick={() => handleCopy(parcel.tracking_code)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                title="কোড কপি করুন"
                              >
                                {copiedCode === parcel.tracking_code ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-medium text-foreground">{parcel.recipient_name}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-muted-foreground/70" />
                            <a
                              href={`tel:${parcel.recipient_phone}`}
                              className="hover:underline hover:text-primary"
                            >
                              {parcel.recipient_phone}
                            </a>
                          </div>
                        </td>

                        {/* Address */}
                        <td className="py-3.5 px-4 align-top max-w-[200px]">
                          <p className="line-clamp-2 text-foreground/90 text-[11px]" title={parcel.recipient_address}>
                            {parcel.recipient_address}
                          </p>
                          {parcel.note && (
                            <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">
                              নোট: {parcel.note}
                            </p>
                          )}
                        </td>

                        {/* COD Amount */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-foreground font-mono">
                            ৳ {Number(parcel.cod_amount).toLocaleString("bn-BD")}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {parcel.delivery_type === 1 ? "হাব পিকআপ" : "হোম ডেলিভারি"}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 align-top text-muted-foreground text-[11px] whitespace-nowrap">
                          {new Date(parcel.createdAt).toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-top">
                          <Badge variant="outline" className={`text-[10px] font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] gap-1 border-border/80"
                              onClick={() => handleSyncStatus(parcel)}
                              disabled={isTrackingThis}
                              title="Steadfast API থেকে রিয়েলটাইম স্ট্যাটাস আপডেট করুন"
                            >
                              <RefreshCw className={`h-3 w-3 ${isTrackingThis ? "animate-spin" : ""}`} />
                              <span className="hidden sm:inline">সিঙ্ক</span>
                            </Button>

                            {parcel.tracking_code && (
                              <a
                                href={parcel.tracking_url || `https://steadfast.com.bd/t/${parcel.tracking_code}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                  title="Steadfast ট্র্যাকিং পোর্টালে দেখুন"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span className="hidden sm:inline">ট্র্যাক</span>
                                </Button>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== CREATE PARCEL DIALOG ==================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span>নতুন পার্সেল তৈরি করুন (Steadfast)</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              কাস্টমারের সঠিক ডেলিভারি ঠিকানা ও ফোন নম্বর পূরণ করে সরাসরি Steadfast এ অর্ডার পাঠিয়ে দিন।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="space-y-4 py-2">
            {/* Invoice & COD */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  ইনভয়েস আইডি <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  placeholder="INV-10293"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  ক্যাশ অন ডেলিভারি (৳) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  placeholder="যেমন: ১২০০ (প্রিপেইড হলে ০)"
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Recipient Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                কাস্টমারের নাম <span className="text-rose-500">*</span>
              </label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="যেমন: মোহাম্মদ রাফি"
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Recipient Phone */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                ১১-সংখ্যার ফোন নম্বর <span className="text-rose-500">*</span>
              </label>
              <Input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
                className="h-9 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)
              </p>
            </div>

            {/* Recipient Address */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
              </label>
              <Textarea
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="বাড়ি নং, রোড নং, এলাকা/থানা, জেলা..."
                required
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Delivery Type & Item Lot */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">ডেলিভারি ধরন</label>
                <Select value={deliveryType} onValueChange={setDeliveryType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">হোম ডেলিভারি (Home Delivery)</SelectItem>
                    <SelectItem value="1">পয়েন্ট / হাব পিকআপ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">পণ্যের পরিমাণ (Lot)</label>
                <Input
                  type="number"
                  min="1"
                  value={totalLot}
                  onChange={(e) => setTotalLot(e.target.value)}
                  placeholder="1"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Item Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">পণ্যের বিবরণ (ঐচ্ছিক)</label>
              <Input
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="যেমন: প্রিমিয়াম কটন পাঞ্জাবি (L সাইজ)"
                className="h-9 text-xs"
              />
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">ডেলিভারিম্যানের জন্য বিশেষ নোট (ঐচ্ছিক)</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: ডেলিভারির পূর্বে ফোন দিন, সাবধানে হ্যান্ডেল করবেন"
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                disabled={submittingOrder}
                className="text-xs h-8"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingOrder}
                className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
              >
                {submittingOrder ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>অর্ডার পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-3.5 w-3.5" />
                    <span>পার্সেল নিশ্চিত করুন</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== SETTINGS DIALOG ==================== */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <span>Steadfast API কনফিগারেশন</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              আপনার Steadfast মার্চেন্ট অ্যাকাউন্ট সংযুক্ত করতে API Key ও Secret Key প্রদান করুন।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>কোথা থেকে পাবেন?</span>
              </div>
              <p>
                ১. <strong>portal.steadfast.com.bd</strong> তে লগইন করুন।
                <br />
                ২. বাম পাশের মেনু থেকে <strong>Developer API</strong> অথবা <strong>Settings &gt; API</strong> তে যান।
                <br />
                ৩. সেখানে প্রাপ্ত <strong>Api Key</strong> এবং <strong>Secret Key</strong> কপি করে নিচে পেস্ট করুন।
              </p>
            </div>

            {config.isConfigured && (
              <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  বর্তমানে সক্রিয় কী: <strong>{config.apiKeyMasked}</strong>
                </span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Api-Key <span className="text-rose-500">*</span>
              </label>
              <Input
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Steadfast API Key পেস্ট করুন"
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Secret-Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showSecretKey ? "text" : "password"}
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  placeholder="Steadfast Secret Key পেস্ট করুন"
                  required
                  className="h-9 text-xs font-mono pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showSecretKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">API Base URL (Default)</label>
              <Input
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://portal.steadfast.com.bd/api/v1"
                className="h-9 text-xs font-mono bg-muted/30"
              />
              <p className="text-[10px] text-muted-foreground">
                ডিফল্ট: <code>https://portal.steadfast.com.bd/api/v1</code> (পরিবর্তন না করাই ভালো)
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(false)}
                disabled={savingSettings}
                className="text-xs h-8"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingSettings}
                className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>যাচাই ও সেভ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>টেস্ট ও সেভ করুন</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SteadfastManager() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">কুরিয়ার ড্যাশবোর্ড লোড হচ্ছে...</p>
        </div>
      }
    >
      <SteadfastManagerContent />
    </Suspense>
  );
}
