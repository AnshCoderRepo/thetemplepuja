"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Filter,
  MapPin,
  Phone,
  Play,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";
import type { BookingRecord, CustomerMediaRecord, UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";
import {
  cleanCustomerName,
  downloadCsv,
  filterBookingRecords,
  generateBookingsExportCsv,
  getBookingDevoteeDisplay,
  getExportFilename,
  getQuickDateRange,
} from "@/lib/booking-export";

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

interface FlatBooking {
  booking: BookingRecord;
  user: UserProfile;
}

export default function BookingsTable({
  users,
  onRefund,
  token,
  onRefresh,
}: {
  users: UserProfile[];
  onRefund: (userId: string, bookingId: string) => void;
  token?: string;
  onRefresh?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedPuja, setSelectedPuja] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "rescheduled">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateType, setDateType] = useState<"createdAt" | "pujaDate">("createdAt");
  const [quickPreset, setQuickPreset] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<FlatBooking | null>(null);
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

  // Video Management State
  const [videoModalBooking, setVideoModalBooking] = useState<FlatBooking | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");
  const [videoErr, setVideoErr] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const openVideoModal = (flat: FlatBooking) => {
    setVideoModalBooking(flat);
    setVideoTitle(`${flat.booking.poojaTitle} Sacred Puja Video & Darshan`);
    setVideoUrl("");
    setVideoDesc("");
    setVideoMsg("");
    setVideoErr("");
    setPreviewVideoUrl(null);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoModalBooking) return;
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
          userId: videoModalBooking.user.id,
          phone: videoModalBooking.user.phone,
          bookingId: videoModalBooking.booking.bookingId,
          media: {
            title: videoTitle.trim(),
            url: videoUrl.trim(),
            description: videoDesc.trim() || undefined,
            poojaTitle: videoModalBooking.booking.poojaTitle,
            bookingId: videoModalBooking.booking.bookingId,
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
          setVideoModalBooking(null);
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
    if (!videoModalBooking) return;
    if (!confirm("Are you sure you want to remove this video recording from the devotee's account?")) return;
    try {
      const res = await fetch("/api/devotee/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          userId: videoModalBooking.user.id,
          phone: videoModalBooking.user.phone,
          mediaId,
        }),
      });
      if (res.ok) {
        onRefresh?.();
        if (videoModalBooking.booking.videos) {
          videoModalBooking.booking.videos = videoModalBooking.booking.videos.filter((v) => v.id !== mediaId);
        }
      }
    } catch {
      // ignore
    }
  };

  // Flatten verified bookings (deduplicating identical booking records)
  // Successful Bookings section strictly displays ONLY verified confirmed and rescheduled bookings
  const allBookings = useMemo(() => {
    const list: FlatBooking[] = [];
    const seenBookingIds = new Set<string>();
    for (const u of users) {
      for (const b of u.bookings) {
        if (b.status !== "confirmed" && b.status !== "rescheduled") continue;
        if (b.bookingId) {
          if (seenBookingIds.has(b.bookingId)) continue;
          seenBookingIds.add(b.bookingId);
        }
        list.push({ booking: b, user: u });
      }
    }
    // Newest first
    return list.sort(
      (a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime()
    );
  }, [users]);

  // Unique list of pujas appearing in bookings for filtering
  const availablePoojaOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const { booking } of allBookings) {
      if (booking.poojaSlug) {
        map.set(booking.poojaSlug, booking.poojaTitle || booking.poojaSlug);
      }
    }
    return Array.from(map.entries())
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allBookings]);

  const confirmedCount = useMemo(
    () => allBookings.filter(({ booking }) => booking.status === "confirmed").length,
    [allBookings]
  );
  const rescheduledCount = useMemo(
    () => allBookings.filter(({ booking }) => booking.status === "rescheduled").length,
    [allBookings]
  );

  const filtered = useMemo(() => {
    return filterBookingRecords(allBookings, {
      search,
      pujaSlug: selectedPuja,
      status: statusFilter,
      startDate,
      endDate,
      dateType,
      section: "bookings",
    });
  }, [allBookings, search, selectedPuja, statusFilter, startDate, endDate, dateType]);

  const hasActiveFilters = Boolean(
    search ||
      (selectedPuja && selectedPuja !== "all") ||
      (statusFilter && statusFilter !== "all") ||
      startDate ||
      endDate
  );

  const handleClearFilters = () => {
    setSearch("");
    setSelectedPuja("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setQuickPreset("");
    setDateType("createdAt");
    setPage(1);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const exportCSV = () => {
    const csvContent = generateBookingsExportCsv(filtered);
    const filename = getExportFilename("bookings", {
      status: statusFilter,
      startDate,
      endDate,
    });
    downloadCsv(csvContent, filename);
  };

  return (
    <div className="space-y-5">
      {/* Sticky Action / Header Bar (Persists on Scroll with Zero Content Overlap) */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-slate-50/95 backdrop-blur-md border-b border-saffron-200/70 shadow-2xs space-y-3.5">
        {/* Top Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              Confirmed Puja Bookings
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Essential overview of all verified and confirmed devotee bookings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-soft hover:bg-saffron-50 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              title="Reload latest booking data without reloading the page"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-saffron-600 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
              title="Download currently filtered bookings as CSV (Excel compatible)"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Export Filtered ({filtered.length})</span>
            </button>
          </div>
        </div>

        {/* Advanced Filter Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-saffron-100 shadow-xs space-y-3">
          {/* Row 1: Search, Puja Dropdown & Status Filter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by Booking ID, devotee, phone, city, address, gotra..."
                className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-saffron-100 bg-cream/30 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPage(1); }}
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
                onChange={(e) => { setSelectedPuja(e.target.value); setPage(1); }}
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

            {/* Status Segmented Buttons */}
            <div className="md:col-span-3 flex rounded-xl bg-cream/70 p-1 border border-saffron-100 text-xs font-semibold justify-end">
              <button
                type="button"
                onClick={() => { setStatusFilter("all"); setPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white text-saffron-900 shadow-xs font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All ({allBookings.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter("confirmed"); setPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "confirmed"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-emerald-700 hover:text-emerald-800"
                }`}
              >
                Confirmed ({confirmedCount})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter("rescheduled"); setPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "rescheduled"
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "text-blue-700 hover:text-blue-800"
                }`}
              >
                Rescheduled ({rescheduledCount})
              </button>
            </div>
          </div>

          {/* Row 2: Date Filters & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-saffron-100/70 text-xs">
            {/* Left: Date Type & Inputs & Presets */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Type Selector */}
              <div className="flex items-center rounded-xl bg-cream/70 p-0.5 border border-saffron-100 text-[11px] font-semibold text-ink-soft">
                <button
                  type="button"
                  onClick={() => { setDateType("createdAt"); setPage(1); }}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    dateType === "createdAt"
                      ? "bg-white text-saffron-900 shadow-2xs font-bold"
                      : "hover:text-ink cursor-pointer"
                  }`}
                >
                  📅 Creation Date
                </button>
                <button
                  type="button"
                  onClick={() => { setDateType("pujaDate"); setPage(1); }}
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
                  onChange={(e) => { setStartDate(e.target.value); setQuickPreset(""); setPage(1); }}
                  className="rounded-xl border border-saffron-100 bg-cream/40 px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:bg-white cursor-pointer font-medium"
                />
                <span className="text-ink-soft/60 font-bold text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setQuickPreset(""); setPage(1); }}
                  className="rounded-xl border border-saffron-100 bg-cream/40 px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:bg-white cursor-pointer font-medium"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                {(["today", "yesterday", "last7", "last30"] as const).map((k) => {
                  const labels: Record<string, string> = {
                    today: "Today",
                    yesterday: "Yesterday",
                    last7: "Last 7D",
                    last30: "Last 30D",
                  };
                  const isSelected = quickPreset === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        const range = getQuickDateRange(k);
                        setStartDate(range.startDate);
                        setEndDate(range.endDate);
                        setQuickPreset(k);
                        setPage(1);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-saffron-500 text-white border-saffron-600 shadow-2xs"
                          : "bg-white text-ink-soft hover:bg-cream border-saffron-100"
                      }`}
                    >
                      {labels[k]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Record count & Clear button */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-bold text-saffron-900 bg-saffron-50 px-2.5 py-1 rounded-lg border border-saffron-200">
                {filtered.length} of {allBookings.length} bookings matching
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table - 9 Essential Columns */}
      <div className="overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="border-b border-saffron-100 bg-cream/40 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3.5">Booking ID</th>
                <th className="px-3.5 py-3.5">User / Devotee Name</th>
                <th className="px-3.5 py-3.5">Phone Number</th>
                <th className="px-3.5 py-3.5">Puja / Service Name</th>
                <th className="px-3.5 py-3.5">Booking Created Date</th>
                <th className="px-3.5 py-3.5">Scheduled Puja Date</th>
                <th className="px-3.5 py-3.5">Amount Paid</th>
                <th className="px-3.5 py-3.5 text-center">Booking / Payment Status</th>
                <th className="px-3.5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No confirmed bookings found matching current criteria.</p>
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
                paginated.map(({ booking, user }, index) => {
                  const devoteeInfo = getBookingDevoteeDisplay(booking, user);

                  return (
                    <tr
                      key={`${user.id || user.phone || "user"}-${booking.bookingId || "bk"}-${index}`}
                      className="hover:bg-orange-50/30 transition-colors"
                    >
                      {/* 1. Booking ID */}
                      <td className="px-3.5 py-3.5 font-mono text-xs font-bold text-saffron-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{booking.bookingId}</span>
                          <button
                            type="button"
                            onClick={() => copyText(booking.bookingId, booking.bookingId)}
                            className="text-ink-soft/40 hover:text-ink cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId === booking.bookingId ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. User / Devotee Name */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-bold text-ink text-xs">
                          {devoteeInfo.tableDisplayName || "—"}
                        </div>
                      </td>

                      {/* 3. Phone Number */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-xs">
                        {user.phone ? (
                          <div className="flex items-center gap-1 text-ink">
                            <Phone className="h-3 w-3 text-saffron-600 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-ink-soft/40">—</span>
                        )}
                      </td>

                      {/* 4. Puja / Service Name */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-semibold text-ink">{booking.poojaTitle}</div>
                        {booking.couponCode && (
                          <span className="inline-block mt-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Coupon: {booking.couponCode} (-{formatINR(booking.discount)})
                          </span>
                        )}
                      </td>

                      {/* 5. Booking Created Date */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-xs text-ink-soft">
                        {booking.createdAt ? (
                          <>
                            <div className="font-medium text-ink">
                              {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[10px] text-ink-soft">
                              {new Date(booking.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* 6. Scheduled Puja Date */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-xs">
                        <div className="font-semibold text-ink">{booking.date || "—"}</div>
                        {booking.time && (
                          <div className="text-[11px] text-ink-soft">{booking.time}</div>
                        )}
                      </td>

                      {/* 7. Amount Paid */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-bold text-ink text-xs">
                        {formatINR(booking.amount)}
                        <span className="text-[10px] font-normal text-ink-soft ml-1">
                          {booking.currency || "INR"}
                        </span>
                      </td>

                      {/* 8. Booking / Payment Status */}
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <Check className="h-3 w-3" />
                          {booking.status === "rescheduled" ? "Rescheduled" : "Confirmed"}
                        </span>
                      </td>

                      {/* 9. Actions */}
                      <td className="px-3.5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openVideoModal({ booking, user })}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                            booking.videos && booking.videos.length > 0
                              ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          }`}
                          title="Attach or manage video recording link for devotee account"
                        >
                          <Video className="h-3.5 w-3.5" />
                          {booking.videos && booking.videos.length > 0 ? (
                            <span>📹 {booking.videos.length} Video{booking.videos.length > 1 ? "s" : ""}</span>
                          ) : (
                            <span>+ Video</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking({ booking, user })}
                          className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-saffron-50 px-2.5 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-100 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Receipt
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
            {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} successful bookings
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

      {/* Booking Receipt Details Modal */}
      {selectedBooking && (() => {
        const detailsInfo = getBookingDevoteeDisplay(selectedBooking.booking, selectedBooking.user);
        const devoteesList = (
          Array.isArray(selectedBooking.booking.devotees) && selectedBooking.booking.devotees.length > 0
            ? selectedBooking.booking.devotees
            : Array.isArray(selectedBooking.booking.familyMembers) && selectedBooking.booking.familyMembers.length > 0
            ? selectedBooking.booking.familyMembers.map((m) => typeof m === "string" ? { name: m, gotra: "" } : m)
            : []
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl border border-saffron-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-saffron-100 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-saffron-700">
                    Confirmed Booking Receipt
                  </span>
                  <h3 className="text-base font-bold text-ink">
                    {selectedBooking.booking.poojaTitle}
                  </h3>
                  {selectedBooking.booking.templeName && (
                    <p className="text-xs text-ink-soft mt-0.5">
                      Venue: {selectedBooking.booking.templeName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="text-ink-soft hover:text-ink cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="rounded-2xl bg-cream/40 p-4 space-y-2 border border-saffron-100">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Booking Reference:</span>
                    <span className="font-mono font-bold text-ink">
                      {selectedBooking.booking.bookingId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Customer Name:</span>
                    <span className="font-bold text-ink">
                      {cleanCustomerName(selectedBooking.user.name) || selectedBooking.user.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Primary Devotee:</span>
                    <span className="font-bold text-ink">{detailsInfo.primaryName || selectedBooking.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Gotra:</span>
                    <span className="text-ink">
                      {detailsInfo.allGotras || selectedBooking.booking.gotra || selectedBooking.user.gotra || "Not specified"}
                    </span>
                  </div>
                  {(selectedBooking.booking.address || selectedBooking.user.address || selectedBooking.user.city) && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Address / Location:</span>
                      <span className="text-ink text-right max-w-[240px]">
                        {selectedBooking.booking.address || selectedBooking.user.address || selectedBooking.user.city}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-soft">WhatsApp / Phone:</span>
                    <span className="text-ink">{selectedBooking.user.phone || "—"}</span>
                  </div>
                  {selectedBooking.user.email && (
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Email Address:</span>
                      <span className="text-ink">{selectedBooking.user.email}</span>
                    </div>
                  )}

                  {/* Devotees / Family Members Breakdown */}
                  {devoteesList.length > 0 && (
                    <div className="pt-2 border-t border-saffron-100">
                      <span className="text-ink-soft font-semibold block mb-1">
                        Devotees / Family Members ({devoteesList.length}):
                      </span>
                      <div className="bg-white/80 p-2 rounded-xl border border-saffron-100 space-y-1">
                        {devoteesList.map((m, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="font-medium text-ink">{idx + 1}. {m.name}</span>
                            <span className="text-ink-soft">{m.gotra ? `Gotra: ${m.gotra}` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-emerald-50/60 p-4 space-y-2 border border-emerald-100">
                  <div className="flex justify-between">
                    <span className="text-emerald-900 font-medium">Ritual Date & Time:</span>
                    <span className="font-bold text-emerald-950">
                      {selectedBooking.booking.date} at {selectedBooking.booking.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-900 font-medium">Assigned Pandit:</span>
                    <span className="font-semibold text-emerald-950">
                      {selectedBooking.booking.panditName || "Senior Vedic Pandit Ji"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-900 font-medium">Total Amount Paid:</span>
                    <span className="font-bold text-emerald-950 text-sm">
                      {formatINR(selectedBooking.booking.amount)} {selectedBooking.booking.currency || "INR"}
                    </span>
                  </div>
                  {selectedBooking.booking.upiTransactionId && (
                    <div className="flex justify-between text-[11px] pt-1 border-t border-purple-100 text-purple-800 font-semibold">
                      <span>UPI Reference (UTR):</span>
                      <span className="font-mono bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 select-all">
                        {selectedBooking.booking.upiTransactionId}
                      </span>
                    </div>
                  )}
                  {selectedBooking.booking.razorpayPaymentId && (
                    <div className="flex justify-between text-[11px] pt-1 border-t border-emerald-100 text-emerald-800">
                      <span>Payment Ref:</span>
                      <span className="font-mono">{selectedBooking.booking.razorpayPaymentId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-saffron-100 pt-4">
                {selectedBooking.booking.status === "refunded" ? (
                  <span className="text-xs font-bold text-purple-700">
                    Refunded
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-soft">
                    Refunds managed via <strong className="font-semibold text-ink">Refund Approvals</strong>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl bg-saffron-500 px-5 py-2 text-xs font-bold text-white hover:bg-saffron-600 cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Video Management Modal */}
      {videoModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setVideoModalBooking(null)}
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
                    {videoModalBooking.user.name} ({videoModalBooking.user.phone}) · Ref {videoModalBooking.booking.bookingId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalBooking(null)}
                className="text-ink-soft/60 hover:text-ink transition-colors p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Videos List */}
            {(() => {
              const attachedVideos = [
                ...(videoModalBooking.booking.videos || []),
                ...(videoModalBooking.user.videos || []).filter(
                  (v) => v.bookingId === videoModalBooking.booking.bookingId
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
                  onClick={() => setVideoModalBooking(null)}
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
    </div>
  );
}
