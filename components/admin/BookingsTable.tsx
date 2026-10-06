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
  Search,
  ShieldCheck,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";
import type { BookingRecord, CustomerMediaRecord, UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";

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
  const [dateFilter, setDateFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<FlatBooking | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

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

  // Flatten strictly confirmed/rescheduled bookings
  const successfulBookings = useMemo(() => {
    const list: FlatBooking[] = [];
    for (const u of users) {
      for (const b of u.bookings) {
        if (b.status === "confirmed" || b.status === "rescheduled") {
          list.push({ booking: b, user: u });
        }
      }
    }
    // Newest first
    return list.sort(
      (a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime()
    );
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return successfulBookings.filter(({ booking, user }) => {
      const matchesSearch =
        !q ||
        booking.bookingId.toLowerCase().includes(q) ||
        booking.poojaTitle.toLowerCase().includes(q) ||
        user.name.toLowerCase().includes(q) ||
        user.phone.includes(q) ||
        user.city.toLowerCase().includes(q) ||
        (user.gotra && user.gotra.toLowerCase().includes(q));

      const matchesDate =
        !dateFilter ||
        booking.createdAt.startsWith(dateFilter) ||
        booking.date.toLowerCase().includes(dateFilter.toLowerCase());

      return matchesSearch && matchesDate;
    });
  }, [successfulBookings, search, dateFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const exportCSV = () => {
    const headers = [
      "Booking ID",
      "Customer Name",
      "Phone",
      "Email",
      "Gotra",
      "City",
      "Pooja Title",
      "Ritual Date",
      "Ritual Time",
      "Amount (INR)",
      "Coupon Code",
      "Status",
      "Payment ID",
      "Booking Timestamp",
    ];

    const rows = filtered.map(({ booking, user }) => [
      `"${booking.bookingId}"`,
      `"${user.name}"`,
      `"${user.phone}"`,
      `"${user.email || ""}"`,
      `"${user.gotra || ""}"`,
      `"${user.city || ""}"`,
      `"${booking.poojaTitle}"`,
      `"${booking.date}"`,
      `"${booking.time}"`,
      booking.amount,
      `"${booking.couponCode || ""}"`,
      `"${booking.status}"`,
      `"${booking.razorpayPaymentId || "Demo"}"`,
      `"${booking.createdAt}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `confirmed_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Successful Bookings
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Real-time feed of all verified, paid and confirmed puja bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-saffron-100 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Booking ID, Devotee name, phone, city, or gotra..."
            className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-saffron-100 bg-cream/30 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/40 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            onClick={(e) => {
              try {
                (e.currentTarget as HTMLInputElement).showPicker?.();
              } catch {}
            }}
            title="Filter by date (select from calendar)"
            className="rounded-xl border border-saffron-100 bg-cream/40 px-3 py-1.5 text-xs text-ink focus:outline-none font-medium cursor-pointer"
          />

          {(search || dateFilter) && (
            <button
              type="button"
              onClick={() => { setSearch(""); setDateFilter(""); setPage(1); }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-700 hover:underline bg-saffron-50 px-2.5 py-1 rounded-lg border border-saffron-200"
            >
              Reset Filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="border-b border-saffron-100 bg-cream/40 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Booking ID</th>
                <th className="px-4 py-3.5">Devotee / Customer</th>
                <th className="px-4 py-3.5">Pooja Ceremony</th>
                <th className="px-4 py-3.5">Scheduled Muhurat</th>
                <th className="px-4 py-3.5">Amount Paid</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No confirmed bookings found matching current criteria.</p>
                      {(search || dateFilter) && (
                        <button
                          type="button"
                          onClick={() => { setSearch(""); setDateFilter(""); setPage(1); }}
                          className="text-xs font-bold text-saffron-700 hover:underline bg-saffron-50 px-3 py-1.5 rounded-lg border border-saffron-200"
                        >
                          Reset Filters ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(({ booking, user }) => {
                  return (
                    <tr
                      key={booking.bookingId}
                      className="hover:bg-orange-50/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-saffron-800">
                        <div className="flex items-center gap-1.5">
                          <span>{booking.bookingId}</span>
                          <button
                            type="button"
                            onClick={() => copyText(booking.bookingId, booking.bookingId)}
                            className="text-ink-soft/40 hover:text-ink"
                            title="Copy ID"
                          >
                            {copiedId === booking.bookingId ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-ink-soft font-normal mt-0.5">
                          {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-ink text-xs">{user.name}</div>
                        <div className="text-[11px] text-ink-soft flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                        <div className="text-[10px] text-ink-soft/70">
                          Gotra: {user.gotra || "Kashyap"} • {user.city}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-ink">{booking.poojaTitle}</div>
                        {booking.couponCode && (
                          <span className="inline-block mt-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Coupon: {booking.couponCode} (-{formatINR(booking.discount)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{booking.date}</div>
                        <div className="text-[11px] text-ink-soft">{booking.time}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-ink text-xs">
                        {formatINR(booking.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <Check className="h-3 w-3" />
                          {booking.status === "rescheduled" ? "Rescheduled" : "Confirmed"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openVideoModal({ booking, user })}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                            (booking.videos && booking.videos.length > 0)
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
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-saffron-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-saffron-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-saffron-700">
                  Confirmed Booking Receipt
                </span>
                <h3 className="text-base font-bold text-ink">
                  {selectedBooking.booking.poojaTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-ink-soft hover:text-ink"
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
                  <span className="text-ink-soft">Devotee Name:</span>
                  <span className="font-bold text-ink">{selectedBooking.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Gotra & City:</span>
                  <span className="text-ink">
                    {selectedBooking.user.gotra || "Not specified"} • {selectedBooking.user.city}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">WhatsApp / Phone:</span>
                  <span className="text-ink">{selectedBooking.user.phone}</span>
                </div>
                {selectedBooking.user.email && (
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Email Address:</span>
                    <span className="text-ink">{selectedBooking.user.email}</span>
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
                    {formatINR(selectedBooking.booking.amount)}
                  </span>
                </div>
                {selectedBooking.booking.razorpayPaymentId && (
                  <div className="flex justify-between text-[11px] pt-1 border-t border-emerald-100 text-emerald-800">
                    <span>Payment Ref:</span>
                    <span className="font-mono">{selectedBooking.booking.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-saffron-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to mark booking ${selectedBooking.booking.bookingId} as refunded?`)) {
                    onRefund(selectedBooking.user.id, selectedBooking.booking.bookingId);
                    setSelectedBooking(null);
                  }
                }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Mark Refunded
              </button>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-xl bg-saffron-500 px-5 py-2 text-xs font-bold text-white hover:bg-saffron-600"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

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
                    {attachedVideos.map((v) => (
                      <div
                        key={v.id}
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
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    Close Preview
                  </button>
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
