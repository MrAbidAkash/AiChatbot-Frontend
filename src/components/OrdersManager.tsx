"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Package,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface Order {
  _id: string;
  userId?: string;
  pageId?: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  senderPsid?: string | null;
  productName: string;
  quantity: number;
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
  stockDecremented?: boolean;
  stockDeductionMessage?: string | null;
  stockCell?: string | null;
  statusCell?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  spreadsheetId?: string | null;
  sheetName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [counts, setCounts] = useState({ all: 0, confirmed: 0, shipped: 0, delivered: 0 });

  // Copied phone state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Manual Order Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newDeliveryAddress, setNewDeliveryAddress] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newNotes, setNewNotes] = useState("");
  const [newUpdateStock, setNewUpdateStock] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Status Change Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"confirmed" | "shipped" | "delivered" | "cancelled">("confirmed");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("অর্ডার লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Sync past orders from Facebook Chat conversations
  const handleSyncChat = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_conversations" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "চ্যাট হিস্ট্রি সিঙ্ক সফল হয়েছে!");
        await fetchOrders(true);
      } else {
        toast.error(data.error || "সিঙ্ক করতে ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      toast.error("সিঙ্ক এরর: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Copy phone or address
  const handleCopy = (id: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`${label} কপি করা হয়েছে`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit Manual Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newProductName.trim()) {
      toast.error("কাস্টমার নাম ও প্রোডাক্টের নাম আবশ্যক");
      return;
    }

    setCreatingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: newCustomerName,
          customerPhone: newCustomerPhone,
          deliveryAddress: newDeliveryAddress,
          productName: newProductName,
          quantity: parseInt(newQuantity, 10) || 1,
          notes: newNotes,
          updateSheetStock: newUpdateStock,
        }),
      });

      if (res.ok) {
        toast.success("অর্ডার সফলভাবে সেভ করা হয়েছে!");
        setCreateOpen(false);
        setNewCustomerName("");
        setNewCustomerPhone("");
        setNewDeliveryAddress("");
        setNewProductName("");
        setNewQuantity("1");
        setNewNotes("");
        await fetchOrders(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "অর্ডার সেভ করতে সমস্যা হয়েছে");
      }
    } catch (err: any) {
      toast.error("এরর: " + err.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        toast.success("অর্ডার স্ট্যাটাস আপডেট হয়েছে!");
        setStatusModalOpen(false);
        await fetchOrders(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "স্ট্যাটাস আপডেট ব্যর্থ হয়েছে");
      }
    } catch (err: any) {
      toast.error("এরর: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই অর্ডারটি ডিলিট করতে চান?")) return;

    try {
      const res = await fetch(`/api/orders?id=${orderId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("অর্ডার ডিলিট করা হয়েছে");
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      } else {
        toast.error("অর্ডার ডিলিট করা যায়নি");
      }
    } catch (err) {
      toast.error("ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            কনফার্মড
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
            কুরিয়ারে পাঠানো
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
            ডেলিভার্ড
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30">
            বাতিল
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* ==================== 1. PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span>কনফার্মড অর্ডারসমূহ (Orders)</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            মেসেঞ্জারে AI অ্যাসিস্ট্যান্ট দ্বারা স্বয়ংক্রিয়ভাবে বুক করা কাস্টমারদের অর্ডার ও গুগল শিট স্টক
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncChat}
            disabled={syncing}
            className="h-8 sm:h-9 text-xs gap-1.5 border-border bg-card hover:bg-muted"
          >
            <Sparkles className={`h-3.5 w-3.5 text-primary ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "সিঙ্ক হচ্ছে..." : "চ্যাট থেকে সিঙ্ক"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="h-8 sm:h-9 text-xs gap-1.5 border-border bg-card hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>রিফ্রেশ</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-8 sm:h-9 text-xs gap-1.5 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>নতুন অর্ডার</span>
          </Button>
        </div>
      </div>

      {/* ==================== 2. KPI SUMMARY CARDS ==================== */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">মোট অর্ডার</p>
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {counts.all}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">AI দ্বারা সংগৃহীত ও বুকড</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">কনফার্মড</p>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {counts.confirmed}
            </p>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">কুরিয়ারে পাঠানোর জন্য প্রস্তুত</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">কুরিয়ারে পাঠানো</p>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Truck className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {counts.shipped}
            </p>
            <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400">Steadfast পার্সেল হস্তান্তর</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">ডেলিভার্ড</p>
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Package className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {counts.delivered}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">সফলভাবে পৌঁছেছে</p>
          </CardContent>
        </Card>
      </div>

      {/* ==================== 3. SEARCH & FILTER CONTROLS ==================== */}
      <Card className="border-border/80 bg-card shadow-2xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="কাস্টমারের নাম, ফোন নম্বর, ঠিকানা বা প্রোডাক্ট খুঁজুন..."
                className="pl-9 h-9 text-xs bg-muted/30 border-border"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "সব অর্ডার" },
                { id: "confirmed", label: "কনফার্মড" },
                { id: "shipped", label: "কুরিয়ারে পাঠানো" },
                { id: "delivered", label: "ডেলিভার্ড" },
                { id: "cancelled", label: "বাতিল" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    statusFilter === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== 4. ORDERS LIST ==================== */}
      {loading ? (
        <Card className="border-border/80 bg-card p-12 text-center shadow-2xs">
          <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">অর্ডার লোড হচ্ছে...</p>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border-border/80 bg-card p-12 text-center shadow-2xs">
          <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">কোনো অর্ডার পাওয়া যায়নি</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {search || statusFilter !== "all"
              ? "আপনার ফিল্টারের সাথে মিলে এমন কোনো অর্ডার পাওয়া যায়নি।"
              : "মেসেঞ্জারে কাস্টমার 'অর্ডার কনফার্ম' বললে AI স্বয়ংক্রিয়ভাবে এখানে অর্ডার রেকর্ড করবে এবং গুগল শিট স্টক আপডেট করবে।"}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncChat}
              disabled={syncing}
              className="text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>আগের চ্যাট থেকে সিঙ্ক করুন</span>
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>ম্যানুয়াল অর্ডার যোগ করুন</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString("bn-BD", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={order._id}
                className="border-border/80 bg-card shadow-2xs hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Customer & Product Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {order.customerName}
                        </span>
                        {getStatusBadge(order.status)}

                        {order.stockDecremented ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] gap-1">
                            <FileSpreadsheet className="h-3 w-3" />
                            <span>
                              গুগল শিট স্টক আপডেট সম্পন্ন ({order.stockCell || "Sheet"}
                              {order.statusCell && order.newStatus ? ` | ${order.statusCell}: ${order.newStatus}` : ""})
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] text-muted-foreground gap-1 border-dashed">
                            <FileSpreadsheet className="h-3 w-3" />
                            <span>{order.stockDeductionMessage || "শিট স্টক পেন্ডিং"}</span>
                          </Badge>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
                        <div className="h-5 w-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Package className="h-3 w-3" />
                        </div>
                        <span>{order.productName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-mono text-xs">
                          {order.quantity} টি
                        </span>
                      </div>

                      {/* Phone & Address */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {order.customerPhone ? (
                          <div className="flex items-center gap-1.5 text-foreground font-mono">
                            <Phone className="h-3 w-3 text-emerald-500" />
                            <a href={`tel:${order.customerPhone}`} className="hover:underline">
                              {order.customerPhone}
                            </a>
                            <button
                              onClick={() => handleCopy(order._id + "-phone", order.customerPhone!, "ফোন নম্বর")}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                              title="কপি করুন"
                            >
                              {copiedId === order._id + "-phone" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic flex items-center gap-1">
                            <Phone className="h-3 w-3" /> ফোন নম্বর দেওয়া হয়নি
                          </span>
                        )}

                        {order.deliveryAddress ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                            <span>{order.deliveryAddress}</span>
                            <button
                              onClick={() => handleCopy(order._id + "-addr", order.deliveryAddress!, "ঠিকানা")}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                              title="কপি করুন"
                            >
                              {copiedId === order._id + "-addr" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> ঠিকানা দেওয়া হয়নি
                          </span>
                        )}

                        <span className="text-[11px] text-muted-foreground font-mono">
                          • {formattedDate}
                        </span>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                      {/* Send to Steadfast Courier (Commented out per user request)
                      <Link
                        href={`/courier?name=${encodeURIComponent(order.customerName)}&phone=${encodeURIComponent(
                          order.customerPhone || "",
                        )}&address=${encodeURIComponent(order.deliveryAddress || "")}`}
                      >
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                          variant="outline"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Steadfast কুরিয়ারে পাঠান</span>
                        </Button>
                      </Link>
                      */}

                      {/* Change Status */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-border"
                        onClick={() => {
                          setSelectedOrder(order);
                          setNewStatus(order.status);
                          setStatusModalOpen(true);
                        }}
                      >
                        স্ট্যাটাস
                      </Button>

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                        onClick={() => handleDeleteOrder(order._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ==================== 5. MODAL: CREATE MANUAL ORDER ==================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span>নতুন কাস্টমার অর্ডার তৈরি করুন</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              ফোনে বা সরাসরি পাওয়া কাস্টমারের অর্ডার ম্যানুয়ালি যুক্ত করুন।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                কাস্টমারের নাম <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="যেমন: মোছাঃ সালমা আক্তার"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">মোবাইল নম্বর</label>
                <Input
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="01886092236"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">পরিমাণ (Quantity)</label>
                <Input
                  type="number"
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="1"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                প্রোডাক্টের নাম <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="যেমন: Premium Jamdani Saree"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">ডেলিভারি ঠিকানা</label>
              <Input
                value={newDeliveryAddress}
                onChange={(e) => setNewDeliveryAddress(e.target.value)}
                placeholder="যেমন: ঝিনাইদহ সদর, ঝিনাইদহ"
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="updateStockCheck"
                checked={newUpdateStock}
                onChange={(e) => setNewUpdateStock(e.target.checked)}
                className="rounded border-border h-4 w-4 text-primary"
              />
              <label htmlFor="updateStockCheck" className="text-xs text-muted-foreground select-none cursor-pointer">
                সংযুক্ত গুগল শিট থেকে স্বয়ংক্রিয়ভাবে স্টক বিয়োগ করুন
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" size="sm" disabled={creatingOrder}>
                {creatingOrder ? "সেভ হচ্ছে..." : "অর্ডার সেভ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== 6. MODAL: STATUS UPDATE ==================== */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm">অর্ডার স্ট্যাটাস পরিবর্তন</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              অর্ডার #{selectedOrder?._id.slice(-6)} এর বর্তমান অবস্থা নির্বাচন করুন:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            {[
              { id: "confirmed", label: "কনফার্মড (Confirmed)", color: "text-emerald-500" },
              { id: "shipped", label: "কুরিয়ারে পাঠানো (Shipped)", color: "text-blue-500" },
              { id: "delivered", label: "ডেলিভার্ড (Delivered)", color: "text-purple-500" },
              { id: "cancelled", label: "বাতিল (Cancelled)", color: "text-rose-500" },
            ].map((s) => (
              <label
                key={s.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  newStatus === s.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                }`}
              >
                <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                <input
                  type="radio"
                  name="orderStatus"
                  value={s.id}
                  checked={newStatus === s.id}
                  onChange={() => setNewStatus(s.id as any)}
                  className="text-primary"
                />
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              বাতিল
            </Button>
            <Button size="sm" onClick={handleUpdateStatus} disabled={updatingStatus}>
              {updatingStatus ? "আপডেট হচ্ছে..." : "স্ট্যাটাস আপডেট"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

