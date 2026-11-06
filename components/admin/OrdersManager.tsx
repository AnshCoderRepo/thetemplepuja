"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  Filter,
  PackageCheck,
  Phone,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Undo2,
  User,
  Video,
  X,
  XCircle,
} from "lucide-react";
import {
  resolveBookingConsistencyStatus,
  type AmountConsistencyStatus,
  type BookingRecord,
  type BookingStatus,
  type CustomerMediaRecord,
  type UserProfile,
} from "@/lib/storage";
import { formatINR } from "@/lib/format";
import {
  downloadCsv,
  filterBookingRecords,
  generateBookingsExportCsv,
  getBookingDevoteeDisplay,
  getExportFilename,
  getQuickDateRange,
} from "@/lib/booking-export";
import { submitRefundRequestRemote } from "@/lib/api";

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
      : null;
  } catch {
    return null;
  }
}

type OrderStatusFilter =
  | "all"
  | "successful"
  | "pending"
  | "failed"
  | "cancelled"
  | "refunded"
  | "confirmed"
  | "rescheduled";

interface FlatOrder {
  orderId: string;
  booking: BookingRecord;
  user: UserProfile;
}

export default function OrdersManager({
  users,
  onRefund,
  token,
  adminEmail,
  onRefresh,
}: {
  users: UserProfile[];
  onRefund?: (userId: string, bookingId: string) => void;
  token?: string;
  adminEmail?: string;
  onRefresh?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<OrderStatusFilter>("all");
  const [selectedPuja, setSelectedPuja] = useState("all");
  const [consistencyFilter, setConsistencyFilter] = useState<AmountConsistencyStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateType, setDateType] = useState<"createdAt" | "pujaDate">("createdAt");
  const [quickPreset, setQuickPreset] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<FlatOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Refund Request State
  const [refundModalOrder, setRefundModalOrder] = useState<FlatOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMsg, setRefundMsg] = useState("");
  const [refundErr, setRefundErr] = useState("");

  const openRefundModal = (flat: FlatOrder) => {
    setRefundModalOrder(flat);
    setRefundAmount(flat.booking.amount);
    setRefundReason("");
    setRefundMsg("");
    setRefundErr("");
  };

  const handleSubmitRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder || !token) {
      if (!token) setRefundErr("Admin authentication token required.");
      return;
    }
    setRefundMsg("");
    setRefundErr("");

    if (!refundReason.trim()) {
      setRefundErr("Please provide a reason for the refund request.");
      return;
    }

    if (refundAmount <= 0 || refundAmount > refundModalOrder.booking.amount) {
      setRefundErr(`Requested refund amount must be between ₹1 and ₹${refundModalOrder.booking.amount}.`);
      return;
    }

    setRefundLoading(true);
    try {
      const res = await submitRefundRequestRemote(
        token,
        {
          bookingId: refundModalOrder.booking.bookingId,
          orderId: refundModalOrder.orderId,
          requestedAmount: refundAmount,
          reason: refundReason.trim(),
        }
      );

      setRefundLoading(false);
      if (res.ok && res.request) {
        setRefundMsg(
          `Refund request #${res.request.id} submitted for approval. Status: Pending Approval.`
        );
        onRefresh?.();
        setTimeout(() => {
          setRefundModalOrder(null);
          setRefundMsg("");
        }, 1800);
      } else {
        setRefundErr(res.error || "Failed to submit refund request.");
      }
    } catch {
      setRefundLoading(false);
      setRefundErr("Network error while submitting refund request.");
    }
  };

  // Video Management State
  const [videoModalOrder, setVideoModalOrder] = useState<FlatOrder | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");
  const [videoErr, setVideoErr] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const openVideoModal = (flat: FlatOrder) => {
    setVideoModalOrder(flat);
    setVideoTitle(`${flat.booking.poojaTitle} Sacred Puja Video & Darshan`);
    setVideoUrl("");
    setVideoDesc("");
    setVideoMsg("");
    setVideoErr("");
    setPreviewVideoUrl(null);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoModalOrder) return;
    setVideoMsg("");
    setVideoErr("");

    if (!videoUrl.trim() || !videoTitle.trim()) {
      setVideoErr("Please provide both video URL and title.");
      return;
    }

    setVideoLoading(true);
    try {
      const res = await fetch("/api/devotee/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: videoModalOrder.user.id,
          phone: videoModalOrder.user.phone,
          bookingId: videoModalOrder.booking.bookingId,
          media: {
            title: videoTitle.trim(),
            url: videoUrl.trim(),
            description: videoDesc.trim() || undefined,
            poojaTitle: videoModalOrder.booking.poojaTitle,
            bookingId: videoModalOrder.booking.bookingId,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      setVideoLoading(false);

      if (res.ok && data.ok) {
        setVideoMsg("Puja video link attached to devotee account successfully!");
        setVideoUrl("");
        setVideoDesc("");
        onRefresh?.();
        setTimeout(() => {
          setVideoModalOrder(null);
          setVideoMsg("");
        }, 1200);
      } else {
        setVideoErr(data.error || "Failed to attach video.");
      }
    } catch {
      setVideoLoading(false);
      setVideoErr("Network error while attaching video.");
    }
  };

  const handleDeleteVideo = async (mediaId: string) => {
    if (!videoModalOrder) return;
    if (!confirm("Are you sure you want to remove this video recording from the devotee's account?")) return;
    try {
      const res = await fetch("/api/devotee/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          userId: videoModalOrder.user.id,
          phone: videoModalOrder.user.phone,
          mediaId,
        }),
      });
      if (res.ok) {
        onRefresh?.();
        if (videoModalOrder.booking.videos) {
          videoModalOrder.booking.videos = videoModalOrder.booking.videos.filter((v) => v.id !== mediaId);
        }
      }
    } catch {
      // ignore
    }
  };

  // Dedicated Puja Session Videos (Admin uploads 1 video per Puja + ceremony date)
  const [showSessionVideosModal, setShowSessionVideosModal] = useState(false);
  const [sessionVideosList, setSessionVideosList] = useState<any[]>([]);
  const [availablePoojas, setAvailablePoojas] = useState<{ slug: string; name: string }[]>([]);
  const [sessionVideosLoading, setSessionVideosLoading] = useState(false);
  const [sessionPoojaSlug, setSessionPoojaSlug] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionVideoUrl, setSessionVideoUrl] = useState("");
  const [sessionDesc, setSessionDesc] = useState("");
  const [sessionSubmitting, setSessionSubmitting] = useState(false);
  const [sessionMsg, setSessionMsg] = useState("");
  const [sessionErr, setSessionErr] = useState("");

  const loadSessionVideos = async () => {
    if (!token) return;
    setSessionVideosLoading(true);
    try {
      const res = await fetch(`/api/admin/puja-videos?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.success) {
        setSessionVideosList(data.videos || []);
        if (Array.isArray(data.availablePoojas)) {
          setAvailablePoojas(data.availablePoojas);
          if (!sessionPoojaSlug && data.availablePoojas.length > 0) {
            setSessionPoojaSlug(data.availablePoojas[0].slug);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setSessionVideosLoading(false);
    }
  };

  useEffect(() => {
    if (showSessionVideosModal) {
      void loadSessionVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSessionVideosModal]);

  const handleSaveSessionVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !sessionPoojaSlug || !sessionDate.trim() || !sessionTitle.trim() || !sessionVideoUrl.trim()) {
      setSessionErr("Please provide Puja, date, title, and video URL.");
      return;
    }
    setSessionSubmitting(true);
    setSessionErr("");
    setSessionMsg("");
    try {
      const selectedP = availablePoojas.find((p) => p.slug === sessionPoojaSlug);
      const res = await fetch(`/api/admin/puja-videos?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poojaSlug: sessionPoojaSlug,
          poojaTitle: selectedP?.name || sessionPoojaSlug,
          date: sessionDate.trim(),
          title: sessionTitle.trim(),
          videoUrl: sessionVideoUrl.trim(),
          description: sessionDesc.trim() || undefined,
          active: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessionMsg("Ceremony video published successfully!");
        setSessionTitle("");
        setSessionVideoUrl("");
        setSessionDesc("");
        setSessionDate("");
        void loadSessionVideos();
      } else {
        setSessionErr(data.error || "Failed to save ceremony video.");
      }
    } catch {
      setSessionErr("Network error while saving ceremony video.");
    } finally {
      setSessionSubmitting(false);
    }
  };

  const handleDeleteSessionVideo = async (id: string) => {
    if (!token || !confirm("Are you sure you want to delete this session video?")) return;
    try {
      const res = await fetch(`/api/admin/puja-videos?token=${encodeURIComponent(token)}&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        void loadSessionVideos();
      }
    } catch {
      // ignore
    }
  };

  // Flatten all bookings (orders) across all devotees (deduplicating identical booking records)
  const allOrders = useMemo(() => {
    const list: FlatOrder[] = [];
    const seenBookingIds = new Set<string>();
    for (const u of users) {
      for (const b of u.bookings) {
        if (b.bookingId) {
          if (seenBookingIds.has(b.bookingId)) continue;
          seenBookingIds.add(b.bookingId);
        }
        list.push({
          orderId: b.razorpayOrderId || `ORD-${b.bookingId}`,
          booking: b,
          user: u,
        });
      }
    }
    return list.sort(
      (a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime()
    );
  }, [users]);

  // Unique list of pujas appearing in orders for filtering
  const availablePoojaOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const { booking } of allOrders) {
      if (booking.poojaSlug) {
        map.set(booking.poojaSlug, booking.poojaTitle || booking.poojaSlug);
      }
    }
    return Array.from(map.entries())
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allOrders]);

  const successfulCount = useMemo(
    () =>
      allOrders.filter(
        ({ booking: b }) =>
          b.status === "confirmed" ||
          b.status === "rescheduled" ||
          Boolean(b.paidAt) ||
          Boolean(b.razorpayPaymentId)
      ).length,
    [allOrders]
  );

  const pendingCount = useMemo(
    () =>
      allOrders.filter(
        ({ booking: b }) => b.status === "pending"
      ).length,
    [allOrders]
  );

  const failedCount = useMemo(
    () =>
      allOrders.filter(
        ({ booking: b }) => b.status === "failed"
      ).length,
    [allOrders]
  );

  const cancelledCount = useMemo(
    () => allOrders.filter(({ booking: b }) => b.status === "cancelled").length,
    [allOrders]
  );

  const refundedCount = useMemo(
    () => allOrders.filter(({ booking: b }) => b.status === "refunded").length,
    [allOrders]
  );

  const filtered = useMemo(() => {
    return filterBookingRecords(allOrders, {
      search,
      pujaSlug: selectedPuja,
      status: statusTab,
      startDate,
      endDate,
      dateType,
      section: "orders",
      consistencyStatus: consistencyFilter,
    });
  }, [allOrders, search, selectedPuja, statusTab, startDate, endDate, dateType, consistencyFilter]);

  const hasActiveFilters = Boolean(
    search ||
      (selectedPuja && selectedPuja !== "all") ||
      (statusTab && statusTab !== "all") ||
      (consistencyFilter !== "all") ||
      startDate ||
      endDate
  );

  const handleClearFilters = () => {
    setSearch("");
    setSelectedPuja("all");
    setStatusTab("all");
    setConsistencyFilter("all");
    setStartDate("");
    setEndDate("");
    setQuickPreset("");
    setDateType("createdAt");
    setPage(1);
  };

  const exportCSV = () => {
    const csvContent = generateBookingsExportCsv(filtered, { includeStatusColumns: true });
    const filename = getExportFilename("orders", {
      status: statusTab,
      startDate,
      endDate,
    });
    downloadCsv(csvContent, filename);
  };

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const statusBadge = (status: BookingStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            <Check className="h-3 w-3" /> Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
            <Clock className="h-3 w-3" /> Pending Payment
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
            <XCircle className="h-3 w-3" /> Payment Failed
          </span>
        );
      case "rescheduled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
            <Clock className="h-3 w-3" /> Rescheduled
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
            <Undo2 className="h-3 w-3" /> Refunded
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
            {status}
          </span>
        );
    }
  };

  const consistencyBadge = (status: AmountConsistencyStatus) => {
    switch (status) {
      case "MATCHED":
        return (
          <span
            title="Authoritative match: Checkout, Backend, and Gateway order amounts are identical."
            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
          >
            <Check className="h-2.5 w-2.5" /> MATCHED
          </span>
        );
      case "MISMATCH":
        return (
          <span
            title="Discrepancy detected between checkout and gateway/backend calculation!"
            className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 animate-pulse"
          >
            <AlertCircle className="h-2.5 w-2.5 text-rose-600" /> MISMATCH
          </span>
        );
      case "PENDING VERIFICATION":
        return (
          <span
            title="Booking pending devotee payment or gateway confirmation."
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800"
          >
            <Clock className="h-2.5 w-2.5" /> PENDING
          </span>
        );
      case "NOT AVAILABLE":
      default:
        return (
          <span
            title="Legacy record created prior to checkout amount consistency snapshots."
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
          >
            NOT AVAILABLE
          </span>
        );
    }
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-5">
      {/* Sticky Action / Header Bar (Persists on Scroll with Zero Content Overlap) */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-slate-50/95 backdrop-blur-md border-b border-saffron-200/70 shadow-2xs space-y-3.5">
        {/* Top Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-saffron-600" />
              Orders & Transactions
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Audit all incoming transactions across all fulfillment states
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-soft hover:bg-saffron-50 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              title="Reload latest order data without reloading the page"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-saffron-600 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSessionVideosModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-100 cursor-pointer"
              title="Upload & manage single ceremony videos per Puja and ceremony date"
            >
              <Video className="h-4 w-4 text-amber-700" />
              <span>Puja Session Videos ({sessionVideosList.length})</span>
            </button>

            <button
              type="button"
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-2 text-xs font-bold text-saffron-800 shadow-sm hover:bg-saffron-100 disabled:opacity-50 cursor-pointer"
              title="Download currently filtered orders as CSV with payment & booking details"
            >
              <Download className="h-4 w-4 text-saffron-600" />
              Export Filtered ({filtered.length})
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-saffron-100 pb-2.5">
          {(
            [
              { id: "all", label: "All Orders", count: allOrders.length },
              {
                id: "successful",
                label: "🟢 Successful / Paid",
                count: successfulCount,
              },
              {
                id: "pending",
                label: "⏳ Pending Payment",
                count: pendingCount,
              },
              {
                id: "failed",
                label: "❌ Payment Failed",
                count: failedCount,
              },
              {
                id: "cancelled",
                label: "🚫 Cancelled",
                count: cancelledCount,
              },
              {
                id: "refunded",
                label: "↩️ Refunded",
                count: refundedCount,
              },
            ] as const
          ).map((tab) => {
            const isSelected = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusTab(tab.id);
                  setPage(1);
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-saffron-500 text-white shadow-sm shadow-saffron-500/20"
                    : "bg-white text-ink-soft hover:bg-cream/60 border border-saffron-100"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Advanced Filter Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-saffron-100 shadow-xs space-y-3">
          {/* Row 1: Search, Puja Dropdown & Consistency Filter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by Order ID, Booking ID, devotee, phone, city, or pooja..."
                className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-saffron-100 bg-cream/30 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/40 hover:text-ink cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Puja Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedPuja}
                onChange={(e) => {
                  setSelectedPuja(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs rounded-xl border border-saffron-100 bg-cream/40 text-ink font-medium focus:border-saffron-400 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">🪔 All Pujas ({availablePoojaOptions.length})</option>
                {availablePoojaOptions.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Consistency Audit Filter */}
            <div className="md:col-span-3">
              <select
                value={consistencyFilter}
                onChange={(e) => {
                  setConsistencyFilter(e.target.value as any);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs rounded-xl border border-saffron-100 bg-cream/40 text-ink font-medium focus:border-saffron-400 focus:bg-white focus:outline-none cursor-pointer"
                title="Filter by payment amount consistency audit status"
              >
                <option value="all">🛡️ All Consistency ({allOrders.length})</option>
                <option value="MATCHED">🟢 Matched</option>
                <option value="MISMATCH">🔴 Mismatch</option>
                <option value="PENDING VERIFICATION">⏳ Pending Verification</option>
                <option value="NOT AVAILABLE">⚪ Not Available (Legacy)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date Type, Start/End Dates, Quick Presets & Clear Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-saffron-100/70 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Type Selector */}
              <div className="flex items-center rounded-xl bg-cream/70 p-0.5 border border-saffron-100 text-[11px] font-semibold text-ink-soft">
                <button
                  type="button"
                  onClick={() => {
                    setDateType("createdAt");
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    dateType === "createdAt"
                      ? "bg-white text-saffron-900 shadow-2xs font-bold"
                      : "hover:text-ink cursor-pointer"
                  }`}
                >
                  📅 Order Date
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateType("pujaDate");
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    dateType === "pujaDate"
                      ? "bg-white text-saffron-900 shadow-2xs font-bold"
                      : "hover:text-ink cursor-pointer"
                  }`}
                >
                  🛕 Scheduled Puja Date
                </button>
              </div>

              {/* Start Date & End Date Inputs */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setQuickPreset("");
                    setPage(1);
                  }}
                  className="rounded-xl border border-saffron-100 bg-cream/40 px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:bg-white cursor-pointer font-medium"
                />
                <span className="text-ink-soft/60 font-bold text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setQuickPreset("");
                    setPage(1);
                  }}
                  className="rounded-xl border border-saffron-100 bg-cream/40 px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:bg-white cursor-pointer font-medium"
                />
              </div>

              {/* Quick Presets */}
              <div className="hidden sm:flex items-center gap-1 text-[11px]">
                {(
                  [
                    { key: "today", label: "Today" },
                    { key: "yesterday", label: "Yesterday" },
                    { key: "last7", label: "Last 7D" },
                    { key: "last30", label: "Last 30D" },
                  ] as const
                ).map((preset) => {
                  const isActive = quickPreset === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        const range = getQuickDateRange(preset.key);
                        setStartDate(range.startDate);
                        setEndDate(range.endDate);
                        setQuickPreset(preset.key);
                        setPage(1);
                      }}
                      className={`px-2 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                        isActive
                          ? "bg-saffron-100 text-saffron-900 border-saffron-300 font-bold shadow-2xs"
                          : "bg-white text-ink-soft hover:bg-saffron-50 border-saffron-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matching count & Clear Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-ink-soft">
                {filtered.length} of {allOrders.length} orders matching
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron-700 hover:underline bg-saffron-50 px-2.5 py-1 rounded-lg border border-saffron-200 cursor-pointer"
                >
                  Clear Filters ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="border-b border-saffron-100 bg-cream/40 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Order / Ref</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Item / Service</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5 text-center">Order Status</th>
                <th className="px-4 py-3.5 text-center">Amount Consistency</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No orders found matching current criteria.</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="text-xs font-bold text-saffron-700 hover:underline bg-saffron-50 px-3 py-1.5 rounded-lg border border-saffron-200 cursor-pointer"
                        >
                          Clear Filters ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(({ orderId, booking, user }, index) => {
                  return (
                    <tr
                      key={`${orderId}-${booking.bookingId || "ord"}-${index}`}
                      className="hover:bg-orange-50/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <div className="font-bold text-saffron-900 flex items-center gap-1.5">
                          <span>{booking.bookingId}</span>
                          <button
                            type="button"
                            onClick={() => copyText(booking.bookingId, booking.bookingId)}
                            className="text-ink-soft/40 hover:text-ink"
                          >
                            {copiedId === booking.bookingId ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-ink-soft/70">
                          {new Date(booking.createdAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-ink">{user.name}</div>
                        <div className="text-[11px] text-ink-soft">{user.phone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink flex items-center gap-1.5 flex-wrap">
                          <span>{booking.poojaTitle}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            booking.ritualType === "home" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {booking.ritualType === "home" ? "🏡 Home" : "🛕 Temple"}
                          </span>
                        </div>
                        <div className="text-[10px] text-ink-soft">
                          Scheduled: {booking.date}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          booking.paymentMethod === "upi_qr" || booking.upiTransactionId
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : booking.razorpayPaymentId
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : "bg-slate-100 text-ink-soft"
                        }`}>
                          <CreditCard className="h-3 w-3" />
                          {booking.paymentMethod === "upi_qr" || booking.upiTransactionId
                            ? `UPI QR${booking.upiTransactionId ? ` (${booking.upiTransactionId.slice(0, 10)})` : ""}`
                            : booking.razorpayPaymentId
                            ? "Razorpay UPI/Card"
                            : "Simulated Checkout"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-ink text-xs">
                        {formatINR(booking.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {statusBadge(booking.status)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {consistencyBadge(resolveBookingConsistencyStatus(booking))}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        {(booking.status === "confirmed" || booking.status === "rescheduled") && (
                          <button
                            type="button"
                            onClick={() => openVideoModal({ orderId, booking, user })}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                              (booking.videos && booking.videos.length > 0)
                                ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            }`}
                            title="Attach or manage video recording link for devotee account"
                          >
                            <Video className="h-3.5 w-3.5" />
                            {booking.videos && booking.videos.length > 0 ? (
                              <span>📹 {booking.videos.length}</span>
                            ) : (
                              <span>+ Video</span>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder({ orderId, booking, user })}
                          className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-saffron-50 px-2.5 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-100 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-saffron-100 px-4 py-3 bg-cream/20 text-xs text-ink-soft">
          <div>
            Showing {filtered.length > 0 ? (page - 1) * rowsPerPage + 1 : 0} to{" "}
            {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} orders
          </div>
          <div className="flex items-center gap-3">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-saffron-100 bg-white px-2 py-1 text-xs font-bold disabled:opacity-40"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-saffron-100 bg-white px-2 py-1 text-xs font-bold disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-saffron-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-saffron-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-saffron-700">
                  Transaction Details
                </span>
                <h3 className="text-base font-bold text-ink">
                  {selectedOrder.booking.poojaTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-ink-soft hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Payment State Alert Banner */}
              {selectedOrder.booking.status === "pending" && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Payment Pending
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Devotee filled out booking details and reached the payment gateway. Payment has not been captured yet.
                  </p>
                </div>
              )}

              {selectedOrder.booking.status === "failed" && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3.5 text-rose-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    Payment Failed
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    {selectedOrder.booking.failureReason || "Transaction declined or cancelled by devotee at checkout."}
                  </p>
                </div>
              )}

              {selectedOrder.booking.status === "confirmed" && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Payment Verified & Confirmed
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Transaction captured and verified. Devotee received automated WhatsApp confirmation & receipt.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-cream/60 p-3 border border-saffron-100">
                <span className="text-ink-soft">Status:</span>
                {statusBadge(selectedOrder.booking.status)}
              </div>

              <div className="rounded-2xl border border-saffron-100 bg-white p-4 space-y-2">
                <h4 className="font-bold text-ink text-xs">Customer Information</h4>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Name:</span>
                  <span className="font-bold text-ink">{selectedOrder.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Phone:</span>
                  <span className="text-ink">{selectedOrder.user.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Gotra & City:</span>
                  <span className="text-ink">{selectedOrder.user.gotra || "Kashyap"} • {selectedOrder.user.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Ritual Type:</span>
                  <span className="font-semibold text-ink">
                    {selectedOrder.booking.ritualType === "home" ? "🏡 Home Puja (Devotee Doorstep Visit)" : "🛕 Temple Puja (Online)"}
                  </span>
                </div>
                {(selectedOrder.booking.address || selectedOrder.user.address) && (
                  <div className="flex flex-col gap-0.5 pt-1.5 border-t border-saffron-100/60 text-xs">
                    <span className="text-ink-soft font-semibold">Devotee Home Address:</span>
                    <span className="font-medium text-ink break-words bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                      🏡 {selectedOrder.booking.address || selectedOrder.user.address}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-saffron-100 bg-cream/30 p-4 space-y-2">
                <h4 className="font-bold text-ink text-xs">Payment & Amount Breakdown</h4>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Base Seva:</span>
                  <span className="text-ink font-semibold">{formatINR(selectedOrder.booking.amount + (selectedOrder.booking.discount || 0))}</span>
                </div>
                {selectedOrder.booking.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount ({selectedOrder.booking.couponCode}):</span>
                    <span>-{formatINR(selectedOrder.booking.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-saffron-100 pt-2 font-bold text-ink">
                  <span>Net Amount Paid:</span>
                  <span className="text-saffron-700 text-sm">{formatINR(selectedOrder.booking.amount)}</span>
                </div>
                {selectedOrder.booking.upiTransactionId && (
                  <div className="flex justify-between text-[11px] text-purple-700 font-semibold pt-1">
                    <span>UPI Reference (UTR):</span>
                    <span className="font-mono bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 select-all">
                      {selectedOrder.booking.upiTransactionId}
                    </span>
                  </div>
                )}
                {selectedOrder.booking.upiId && (
                  <div className="flex justify-between text-[11px] text-ink-soft pt-1">
                    <span>Paid to UPI ID:</span>
                    <span className="font-mono">{selectedOrder.booking.upiId}</span>
                  </div>
                )}
                {selectedOrder.booking.razorpayPaymentId && (
                  <div className="flex justify-between text-[11px] text-ink-soft pt-1">
                    <span>Razorpay Payment ID:</span>
                    <span className="font-mono">{selectedOrder.booking.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Amount Consistency Audit Panel */}
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🛡️</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                    Payment & Amount Consistency Audit
                  </h4>
                </div>
                {consistencyBadge(resolveBookingConsistencyStatus(selectedOrder.booking))}
              </div>

              {selectedOrder.booking.paymentAudit ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-100/70">
                    <div>
                      <p className="text-[10px] text-ink-soft">1. Checkout Amount</p>
                      <p className="font-bold text-ink">
                        {selectedOrder.booking.paymentAudit.checkoutAmount !== undefined
                          ? formatINR(selectedOrder.booking.paymentAudit.checkoutAmount)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-soft">2. Backend Calculated</p>
                      <p className="font-bold text-ink">
                        {selectedOrder.booking.paymentAudit.calculatedAmount !== undefined
                          ? formatINR(selectedOrder.booking.paymentAudit.calculatedAmount)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-soft">3. Gateway Order</p>
                      <p className="font-bold text-ink">
                        {selectedOrder.booking.paymentAudit.razorpayOrderAmount !== undefined
                          ? formatINR(selectedOrder.booking.paymentAudit.razorpayOrderAmount)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-soft">4. Captured / Paid</p>
                      <p className="font-bold text-ink">
                        {selectedOrder.booking.paymentAudit.capturedAmount !== undefined
                          ? formatINR(selectedOrder.booking.paymentAudit.capturedAmount)
                          : selectedOrder.booking.paidAt
                          ? formatINR(selectedOrder.booking.amount)
                          : "Pending"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 px-1 text-ink-soft">
                    <span>5. Recorded DB Total:</span>
                    <span className="font-bold text-ink">
                      {formatINR(selectedOrder.booking.paymentAudit.recordedAmount ?? selectedOrder.booking.amount)}
                    </span>
                  </div>

                  {selectedOrder.booking.paymentAudit.mismatchReason && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                      <span className="font-bold">⚠️ Discrepancy Note:</span>{" "}
                      {selectedOrder.booking.paymentAudit.mismatchReason}
                    </div>
                  )}

                  <div className="flex justify-between text-[10px] text-ink-soft/70 px-1 pt-0.5">
                    <span>Audited Timestamp:</span>
                    <span>{new Date(selectedOrder.booking.paymentAudit.auditedAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-ink-soft/80 bg-white/70 p-3 rounded-xl border border-amber-100/60 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-700">Legacy Booking Record:</span> Created before real-time amount consistency tracking was established.
                  </p>
                  <p className="text-[10px] text-ink-soft/70">
                    Recorded Total: <span className="font-bold text-ink">{formatINR(selectedOrder.booking.amount)}</span> • Status: <span className="capitalize">{selectedOrder.booking.status}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-saffron-100 pt-4">
              {selectedOrder.booking.status === "confirmed" ? (
                <button
                  type="button"
                  onClick={() => {
                    const orderToRefund = selectedOrder;
                    setSelectedOrder(null);
                    openRefundModal(orderToRefund);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Submit a formal refund request for administrative approval"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Request Refund
                </button>
              ) : selectedOrder.booking.status === "refunded" ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Refunded Order (Historical)
                </div>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-saffron-500 px-5 py-2 text-xs font-bold text-white hover:bg-saffron-600 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => !refundLoading && setRefundModalOrder(null)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 border border-saffron-200 space-y-4">
            <div className="flex items-center justify-between border-b border-saffron-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold">
                  <RotateCcw className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-ink text-base">
                    Submit Refund Request
                  </h3>
                  <p className="text-[11px] text-ink-soft">
                    Approval-based workflow · Two-tier authorization
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={refundLoading}
                onClick={() => setRefundModalOrder(null)}
                className="text-ink-soft/60 hover:text-ink transition-colors p-1 cursor-pointer disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Order Summary Box */}
            <div className="rounded-2xl border border-saffron-100 bg-cream/40 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-soft">Order / Booking Ref:</span>
                <span className="font-mono font-bold text-ink">{refundModalOrder.booking.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Customer Name:</span>
                <span className="font-bold text-ink">{refundModalOrder.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Service / Pooja:</span>
                <span className="text-ink font-semibold">{refundModalOrder.booking.poojaTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Original Amount Paid:</span>
                <span className="font-bold text-saffron-800">{formatINR(refundModalOrder.booking.amount)}</span>
              </div>
              {refundModalOrder.booking.razorpayPaymentId && (
                <div className="flex justify-between text-[11px] text-sky-800">
                  <span>Razorpay Payment ID:</span>
                  <span className="font-mono">{refundModalOrder.booking.razorpayPaymentId}</span>
                </div>
              )}
              {refundModalOrder.booking.upiTransactionId && (
                <div className="flex justify-between text-[11px] text-purple-800">
                  <span>UPI Transaction Ref (UTR):</span>
                  <span className="font-mono">{refundModalOrder.booking.upiTransactionId}</span>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Separation of Duties & Authorization Notice
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Submitting this request will save it as <strong className="font-semibold">pending_approval</strong>. No financial transaction or payment status modification will occur until approved and executed by an authorized approver.
              </p>
            </div>

            <form onSubmit={handleSubmitRefundRequest} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-ink">
                    Requested Refund Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setRefundAmount(refundModalOrder.booking.amount)}
                    className="text-[10px] font-bold text-saffron-600 hover:underline cursor-pointer"
                  >
                    Full Amount ({formatINR(refundModalOrder.booking.amount)})
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  max={refundModalOrder.booking.amount}
                  step="any"
                  required
                  value={refundAmount || ""}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-saffron-200 px-3.5 py-2 text-xs font-mono font-bold text-ink outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200"
                />
                <p className="text-[10px] text-ink-soft/70 mt-1">
                  Maximum refundable: {formatINR(refundModalOrder.booking.amount)}. Partial refunds are supported.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  Reason for Refund Request <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Devotee requested cancellation due to family travel conflict; verified by support team."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-xl border border-saffron-200 px-3.5 py-2 text-xs text-ink outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200 resize-none"
                />
              </div>

              {refundErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{refundErr}</span>
                </div>
              )}

              {refundMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{refundMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-saffron-100">
                <button
                  type="button"
                  disabled={refundLoading}
                  onClick={() => setRefundModalOrder(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading || !!refundMsg}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2 text-xs font-bold text-white shadow-soft hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {refundLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Submit Refund Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Management Modal */}
      {videoModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setVideoModalOrder(null)}
          />
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl z-10 border border-saffron-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-saffron-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-100 text-saffron-700 font-bold">
                  <Video className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-ink text-base">
                    Devotee Puja Video Recording
                  </h3>
                  <p className="text-[11px] text-ink-soft">
                    {videoModalOrder.user.name} ({videoModalOrder.user.phone}) · Ref {videoModalOrder.booking.bookingId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalOrder(null)}
                className="text-ink-soft/60 hover:text-ink transition-colors p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Videos List */}
            {(() => {
              const attachedVideos = [
                ...(videoModalOrder.booking.videos || []),
                ...(videoModalOrder.user.videos || []).filter(
                  (v) => v.bookingId === videoModalOrder.booking.bookingId
                ),
              ].filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);

              if (attachedVideos.length === 0) return null;

              return (
                <div className="rounded-2xl border border-saffron-200 bg-saffron-50/50 p-3.5 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-900 block">
                    Attached Videos in Devotee Account ({attachedVideos.length})
                  </span>
                  <div className="space-y-2">
                    {attachedVideos.map((v, vIdx) => (
                      <div
                        key={v.id || `video-${vIdx}`}
                        className="rounded-xl border border-saffron-100 bg-white p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-ink flex items-center gap-1.5 truncate">
                            📹 {v.title}
                          </p>
                          {v.description && (
                            <p className="text-[11px] text-ink-soft mt-0.5 truncate">
                              {v.description}
                            </p>
                          )}
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-saffron-600 hover:underline truncate block mt-0.5"
                          >
                            {v.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewVideoUrl(v.url)}
                            className="inline-flex items-center gap-1 rounded-lg bg-saffron-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-saffron-600 cursor-pointer"
                          >
                            <Play className="h-3 w-3 fill-current" /> Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(v.id)}
                            className="rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 cursor-pointer"
                            title="Remove video"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Video Preview Box */}
            {previewVideoUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black p-2 space-y-2">
                <div className="flex items-center justify-between text-white text-xs px-2 pt-1">
                  <span>Video Preview</span>
                  <div className="flex items-center gap-3">
                    <a
                      href={previewVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-saffron-400 hover:text-saffron-300 inline-flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open in New Tab</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewVideoUrl(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  {getYouTubeEmbedUrl(previewVideoUrl) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(previewVideoUrl)!}
                      title="Preview"
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-center p-4 text-white text-xs space-y-2">
                      <p>Direct video link preview:</p>
                      <a
                        href={previewVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-saffron-500 px-3 py-1.5 font-bold text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open Link in New Tab
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form to attach a new video link */}
            <form onSubmit={handleAddVideo} className="space-y-3.5 pt-1">
              <span className="text-xs font-bold text-ink block">
                + Attach New Video Link to Devotee Account
              </span>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  Video Link URL (YouTube, Vimeo, Google Drive, Zoom, MP4) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://youtu.be/... or Google Drive video link"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full rounded-xl border border-saffron-200 px-3.5 py-2 text-xs text-ink outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  Video Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full rounded-xl border border-saffron-200 px-3.5 py-2 text-xs text-ink outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  Puja Sankalp & Blessing Notes for Devotee (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Personalized sankalp performed at morning muhurat with Vedic mantras..."
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  className="w-full rounded-xl border border-saffron-200 px-3.5 py-2 text-xs text-ink outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200 resize-none"
                />
              </div>

              {videoErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-600">
                  ⚠️ {videoErr}
                </div>
              )}

              {videoMsg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                  ✅ {videoMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-saffron-100">
                <button
                  type="button"
                  onClick={() => setVideoModalOrder(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={videoLoading}
                  className="rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2 text-xs font-bold text-white shadow-soft hover:from-saffron-600 hover:to-saffron-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {videoLoading ? "Attaching Video..." : "Attach Video to Devotee Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Puja Session Videos Modal (Feature E: 1 video per Puja + date for all confirmed devotees) */}
      {showSessionVideosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-saffron-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-saffron-100 bg-gradient-to-r from-amber-50 to-saffron-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-saffron-600" />
                <div>
                  <h3 className="font-bold text-ink text-base">Puja Session Ceremony Videos</h3>
                  <p className="text-[11px] text-ink-soft">
                    Deliver 1 video per Puja & date to all confirmed devotees without mutating bookings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionVideosModal(false)}
                className="rounded-full p-1 text-ink-soft hover:bg-saffron-100/60 hover:text-ink cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Form to Add New Session Video */}
              <form onSubmit={handleSaveSessionVideo} className="rounded-2xl border border-saffron-200 bg-amber-50/40 p-4 space-y-3.5">
                <h4 className="font-bold text-xs text-saffron-900 uppercase tracking-wide">
                  + Upload / Publish Ceremony Video
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Select Puja *</label>
                    <select
                      value={sessionPoojaSlug}
                      onChange={(e) => setSessionPoojaSlug(e.target.value)}
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-saffron-500 font-medium"
                    >
                      {availablePoojas.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Ceremony Date *</label>
                    <input
                      type="text"
                      placeholder="e.g. Thu, Nov 5 or 2026-11-06"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-saffron-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Video Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sacred Maha Sankalp & Hawan Recording"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-saffron-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Video URL (YouTube/Drive/MP4) *</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={sessionVideoUrl}
                      onChange={(e) => setSessionVideoUrl(e.target.value)}
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-saffron-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Blessing Notes / Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Ritual notes, mantras chanted, or divine blessings..."
                    value={sessionDesc}
                    onChange={(e) => setSessionDesc(e.target.value)}
                    className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-saffron-500 resize-none font-medium"
                  />
                </div>

                {sessionErr && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-600">
                    ⚠️ {sessionErr}
                  </div>
                )}

                {sessionMsg && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                    ✅ {sessionMsg}
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={sessionSubmitting}
                    className="rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs px-4 py-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {sessionSubmitting ? "Publishing..." : "Publish Ceremony Video"}
                  </button>
                </div>
              </form>

              {/* Existing Session Videos List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-ink flex items-center justify-between">
                  <span>Published Session Videos ({sessionVideosList.length})</span>
                  {sessionVideosLoading && <span className="text-[10px] text-ink-soft">Loading...</span>}
                </h4>

                {sessionVideosList.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-saffron-200 p-6 text-center text-xs text-ink-soft bg-slate-50/50">
                    No session videos published yet. Use the form above to add one.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sessionVideosList.map((sv) => (
                      <div
                        key={sv.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-2xs hover:border-saffron-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-ink truncate">{sv.title}</span>
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                              📅 {sv.date}
                            </span>
                          </div>
                          <p className="text-[11px] text-saffron-700 font-semibold mt-0.5 truncate">
                            🪔 {sv.poojaTitle || sv.poojaSlug}
                          </p>
                          {sv.description && (
                            <p className="text-[11px] text-ink-soft line-clamp-1 mt-0.5">{sv.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={sv.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-saffron-50 px-2.5 py-1 text-xs font-bold text-saffron-700 hover:bg-saffron-100 transition-colors"
                          >
                            Watch ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteSessionVideo(sv.id)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete this session video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
