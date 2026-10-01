"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Play,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  User,
  Video,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import type { BookingRecord, CustomerMediaRecord, UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";
import { addCustomerMediaRemote, deleteCustomerMediaRemote } from "@/lib/api";

type ProfileTab =
  | "overview"
  | "bookings"
  | "orders"
  | "pujas"
  | "chadhavas"
  | "videos"
  | "receipts"
  | "account";

interface Props {
  user: UserProfile;
  token: string;
  onClose: () => void;
  onUserUpdated: (updatedUser: UserProfile) => void;
  onRefund: (userId: string, bookingId: string) => void;
  onDelete: (userId: string) => void;
  onResetPassword: (phone: string, newPass: string) => Promise<{ ok: boolean; error?: string }>;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function CustomerProfileModal({
  user,
  token,
  onClose,
  onUserUpdated,
  onRefund,
  onDelete,
  onResetPassword,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New video modal form state
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoPooja, setVideoPooja] = useState("");
  const [videoBookingId, setVideoBookingId] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");
  const [videoErr, setVideoErr] = useState("");

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  const bookings = user.bookings || [];
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "rescheduled");
  const totalSpent = confirmedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const lastBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null;

  // Aggregate purchased pujas
  const purchasedPujas = bookings.reduce<
    Record<string, { title: string; count: number; totalSpent: number; lastDate: string; slug: string }>
  >((acc, b) => {
    const key = b.poojaSlug || b.poojaTitle;
    if (!acc[key]) {
      acc[key] = {
        title: b.poojaTitle,
        slug: b.poojaSlug,
        count: 0,
        totalSpent: 0,
        lastDate: b.date,
      };
    }
    acc[key].count += 1;
    acc[key].totalSpent += b.amount || 0;
    acc[key].lastDate = b.date;
    return acc;
  }, {});

  // Aggregate purchased chadhavas
  const allChadhavas = bookings.flatMap((b) =>
    (b.addons || []).map((addon) => ({
      ...addon,
      bookingId: b.bookingId,
      poojaTitle: b.poojaTitle,
      date: b.date,
      createdAt: b.createdAt,
    }))
  );

  // All customer videos (from user level + booking level)
  const allVideos: CustomerMediaRecord[] = [
    ...(user.videos || []),
    ...bookings.flatMap((b) => b.videos || []),
  ].filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoMsg("");
    setVideoErr("");
    if (!videoTitle.trim() || !videoUrl.trim()) {
      setVideoErr("Please provide video title and URL.");
      return;
    }

    setVideoLoading(true);
    const res = await addCustomerMediaRemote(
      user.id,
      {
        title: videoTitle.trim(),
        url: videoUrl.trim(),
        description: videoDesc.trim(),
        poojaTitle: videoPooja.trim() || undefined,
        bookingId: videoBookingId.trim() || undefined,
      },
      token
    );
    setVideoLoading(false);

    if (res.ok && res.user) {
      onUserUpdated(res.user);
      setVideoMsg("Pooja video recording added successfully!");
      setVideoTitle("");
      setVideoUrl("");
      setVideoDesc("");
      setVideoPooja("");
      setVideoBookingId("");
      setTimeout(() => {
        setShowAddVideo(false);
        setVideoMsg("");
      }, 1500);
    } else {
      setVideoErr(res.error || "Failed to save video recording.");
    }
  };

  const handleDeleteVideo = async (mediaId: string) => {
    if (!confirm("Are you sure you want to remove this video recording?")) return;
    const res = await deleteCustomerMediaRemote(user.id, mediaId, token);
    if (res.ok && res.user) {
      onUserUpdated(res.user);
    }
  };

  const handlePasswordReset = async () => {
    setResetMsg("");
    setResetErr("");
    if (!newPassword || newPassword.length < 6) {
      setResetErr("Password must be at least 6 characters.");
      return;
    }
    const res = await onResetPassword(user.phone, newPassword);
    if (res.ok) {
      setResetMsg("Password updated successfully!");
      setNewPassword("");
    } else {
      setResetErr(res.error || "Failed to update password.");
    }
  };

  const tabs: { id: ProfileTab; label: string; icon: typeof User; count?: number }[] = [
    { id: "overview", label: "Overview", icon: User },
    { id: "bookings", label: "Bookings", icon: Calendar, count: bookings.length },
    { id: "orders", label: "Orders & Sevas", icon: ShoppingBag, count: bookings.length },
    { id: "pujas", label: "Purchased Pujas", icon: Flame, count: Object.keys(purchasedPujas).length },
    { id: "chadhavas", label: "Chadhavas", icon: Sparkles, count: allChadhavas.length },
    { id: "videos", label: "Videos / Media", icon: Video, count: allVideos.length },
    { id: "receipts", label: "Receipts", icon: Receipt, count: bookings.length },
    { id: "account", label: "Account Security", icon: KeyRound },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-sm animate-fadeIn">
      <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-saffron-200 bg-white shadow-2xl">
        {/* Top Modal Header */}
        <div className="relative bg-gradient-to-r from-saffron-600 via-saffron-500 to-amber-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 font-bold text-base shadow-sm backdrop-blur">
                {initials(user.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold">{user.name}</h3>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                    ID: {user.id}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-amber-100">
                  📱 +91 {user.phone} · 🕉️ Gotra: {user.gotra || "Kashyap"} · 📍 {user.city || "India"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-black/15 p-2.5 text-xs">
            <div>
              <span className="text-[10px] text-amber-200 uppercase font-semibold">Total Bookings</span>
              <p className="font-bold text-sm text-white">{bookings.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-amber-200 uppercase font-semibold">Total Spent</span>
              <p className="font-bold text-sm text-white">{formatINR(totalSpent)}</p>
            </div>
            <div>
              <span className="text-[10px] text-amber-200 uppercase font-semibold">Chadhavas</span>
              <p className="font-bold text-sm text-white">{allChadhavas.length} Items</p>
            </div>
            <div>
              <span className="text-[10px] text-amber-200 uppercase font-semibold">Videos Recorded</span>
              <p className="font-bold text-sm text-white">{allVideos.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-saffron-100 bg-cream/40 overflow-x-auto px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-3 text-xs font-bold transition-all ${
                  isSelected
                    ? "border-saffron-600 text-saffron-700 bg-white"
                    : "border-transparent text-ink-soft hover:text-ink hover:bg-white/50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-saffron-600" : "text-ink-soft"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected ? "bg-saffron-100 text-saffron-800" : "bg-slate-200/70 text-ink-soft"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/40">
          {/* ── TAB 1: OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Devotee Info */}
                <div className="rounded-2xl border border-saffron-100 bg-white p-4 space-y-2.5 shadow-2xs">
                  <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-saffron-600" />
                    Devotee Profile Details
                  </h4>
                  <div className="divide-y divide-saffron-50 text-xs">
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Full Name:</span>
                      <span className="font-bold text-ink">{user.name}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Mobile Number:</span>
                      <span className="font-semibold text-ink">+91 {user.phone}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Email:</span>
                      <span className="text-ink">{user.email && !user.email.startsWith("pw:") ? user.email : "Not provided"}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Gotra:</span>
                      <span className="text-ink font-semibold">{user.gotra || "Kashyap"}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">City:</span>
                      <span className="text-ink">{user.city || "India"}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Member Since:</span>
                      <span className="text-ink">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Seva Statistics */}
                <div className="rounded-2xl border border-saffron-100 bg-white p-4 space-y-2.5 shadow-2xs">
                  <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                    <Flame className="h-4 w-4 text-saffron-600" />
                    Seva & Booking Summary
                  </h4>
                  <div className="divide-y divide-saffron-50 text-xs">
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Total Bookings:</span>
                      <span className="font-bold text-ink">{bookings.length}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Confirmed / Paid:</span>
                      <span className="font-bold text-emerald-700">{confirmedBookings.length}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Total Amount Spent:</span>
                      <span className="font-bold text-saffron-700 text-sm">{formatINR(totalSpent)}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Last Booking Date:</span>
                      <span className="text-ink font-medium">{lastBooking ? lastBooking.date : "None"}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Last Pooja:</span>
                      <span className="text-ink font-semibold truncate max-w-[160px]">{lastBooking ? lastBooking.poojaTitle : "None"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-2xl border border-saffron-100 bg-white p-4 space-y-3 shadow-2xs">
                <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-saffron-600" />
                  Recent Pooja Bookings
                </h4>
                {bookings.length === 0 ? (
                  <p className="text-ink-soft py-3 text-center">No bookings recorded yet for this devotee.</p>
                ) : (
                  <div className="divide-y divide-saffron-50">
                    {bookings.slice(-3).reverse().map((b) => (
                      <div key={b.bookingId} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-ink">🪔 {b.poojaTitle}</p>
                          <p className="text-[11px] text-ink-soft">Scheduled: {b.date} · {b.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-saffron-700">{formatINR(b.amount)}</p>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: BOOKINGS ── */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <h4 className="font-bold text-ink text-sm">All Puja Bookings ({bookings.length})</h4>
              </div>

              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-saffron-200 bg-white p-8 text-center text-xs text-ink-soft">
                  No bookings found.
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div
                      key={b.bookingId}
                      className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-2xs space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-saffron-50 pb-2.5">
                        <div>
                          <h4 className="font-bold text-ink text-sm flex items-center gap-1.5">
                            🪔 {b.poojaTitle}
                          </h4>
                          <p className="text-ink-soft text-[11px]">
                            Booking ID: <code className="font-mono font-bold text-ink">{b.bookingId}</code> · Scheduled: {b.date} · {b.time}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-saffron-700 block">{formatINR(b.amount)}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                            {b.status}
                          </span>
                        </div>
                      </div>

                      {b.reason && (
                        <p className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200/60">
                          <strong>Intention:</strong> {b.reason}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <span className="text-ink-soft text-[11px]">
                          Booked on: {formatDate(b.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/booking/${b.bookingId}?phone=${encodeURIComponent(user.phone)}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-saffron-50 px-2.5 py-1 font-semibold text-saffron-700 hover:bg-saffron-100"
                          >
                            <FileText className="h-3 w-3" />
                            View Receipt
                          </Link>
                          {b.status === "confirmed" && (
                            <button
                              type="button"
                              onClick={() => onRefund(user.id, b.bookingId)}
                              className="text-red-600 font-semibold hover:underline"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: ORDERS & TRANSACTIONS ── */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <h4 className="font-bold text-ink text-sm">Customer Order & Payment Transactions</h4>
              <div className="overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-2xs">
                <table className="w-full text-left text-xs text-ink">
                  <thead className="border-b border-saffron-100 bg-cream/40 text-[11px] font-bold text-ink-soft uppercase">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Payment Ref</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-saffron-50">
                    {bookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-cream/20">
                        <td className="px-4 py-3 font-mono font-bold text-ink">
                          {b.razorpayOrderId || `ORD-${b.bookingId}`}
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">{b.poojaTitle}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-ink-soft">
                          {b.razorpayPaymentId || "Simulated"}
                        </td>
                        <td className="px-4 py-3 font-bold text-saffron-700">{formatINR(b.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 4: PURCHASED PUJAS ── */}
          {activeTab === "pujas" && (
            <div className="space-y-4">
              <h4 className="font-bold text-ink text-sm">Purchased Puja Offerings Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {Object.entries(purchasedPujas).map(([key, item]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-saffron-100 bg-white p-4 space-y-2 shadow-2xs text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-ink text-sm leading-snug">🪔 {item.title}</h5>
                      <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-[10px] font-bold text-saffron-800">
                        {item.count} booked
                      </span>
                    </div>
                    <div className="border-t border-saffron-50 pt-2 flex justify-between text-ink-soft">
                      <span>Total Invested in Seva:</span>
                      <span className="font-bold text-saffron-700">{formatINR(item.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-ink-soft">
                      <span>Last Performed:</span>
                      <span className="font-semibold text-ink">{item.lastDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 5: CHADHAVAS ── */}
          {activeTab === "chadhavas" && (
            <div className="space-y-4">
              <h4 className="font-bold text-ink text-sm">Devotee Chadhavas & Sacred Offerings</h4>
              {allChadhavas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-saffron-200 bg-white p-8 text-center text-xs text-ink-soft">
                  No additional chadhavas purchased by this devotee yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allChadhavas.map((c, idx) => (
                    <div
                      key={c.id + "-" + idx}
                      className="rounded-2xl border border-saffron-100 bg-white p-4 space-y-2 text-xs shadow-2xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-ink text-sm">{c.emoji || "🌸"} {c.name}</span>
                        <span className="rounded-md bg-saffron-100 px-2 py-0.5 text-[10px] font-mono font-bold text-saffron-800">
                          Qty: {c.quantity}
                        </span>
                      </div>
                      <div className="flex justify-between text-ink-soft border-t border-saffron-50 pt-2">
                        <span>Pooja Reference:</span>
                        <span className="font-semibold text-ink">{c.poojaTitle}</span>
                      </div>
                      <div className="flex justify-between text-ink-soft">
                        <span>Line Total:</span>
                        <span className="font-bold text-saffron-700">{formatINR(c.price * c.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 6: VIDEOS / MEDIA RECORDINGS ── */}
          {activeTab === "videos" && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="font-bold text-ink text-sm flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-saffron-600" />
                    Customer Pooja Video Recordings
                  </h4>
                  <p className="text-ink-soft text-[11px]">
                    Manage HD video links recorded by certified pandits for this devotee.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddVideo(!showAddVideo)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-saffron-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showAddVideo ? "Cancel Video Form" : "Add New Video Recording"}
                </button>
              </div>

              {/* Add Video Form */}
              {showAddVideo && (
                <form
                  onSubmit={handleAddVideo}
                  className="rounded-2xl border border-saffron-200 bg-cream/40 p-4 space-y-3 animate-fadeIn"
                >
                  <h5 className="font-bold text-ink text-xs uppercase tracking-wider">
                    Upload / Attach Pooja Video Recording
                  </h5>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Video Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="e.g. Maha Shivratri Rudrabhishek HD Ritual"
                        className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Video Stream URL (MP4 / YouTube / Cloudinary) *
                      </label>
                      <input
                        type="url"
                        required
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://videos.pexels.com/... or https://..."
                        className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Associated Pooja (optional)
                      </label>
                      <input
                        type="text"
                        value={videoPooja}
                        onChange={(e) => setVideoPooja(e.target.value)}
                        placeholder="e.g. Satyanarayan Katha"
                        className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Booking ID (optional)
                      </label>
                      <select
                        value={videoBookingId}
                        onChange={(e) => setVideoBookingId(e.target.value)}
                        className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                      >
                        <option value="">General / None</option>
                        {bookings.map((b) => (
                          <option key={b.bookingId} value={b.bookingId}>
                            {b.bookingId} — {b.poojaTitle}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Description / Pandit Note
                    </label>
                    <textarea
                      rows={2}
                      value={videoDesc}
                      onChange={(e) => setVideoDesc(e.target.value)}
                      placeholder="e.g. Performed with full family sankalp at Kashi Vishwanath temple."
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:outline-none resize-none"
                    />
                  </div>

                  {videoErr && <p className="text-red-600 font-semibold">{videoErr}</p>}
                  {videoMsg && <p className="text-emerald-700 font-bold">{videoMsg}</p>}

                  <button
                    type="submit"
                    disabled={videoLoading}
                    className="rounded-xl bg-saffron-600 px-4 py-2 text-xs font-bold text-white hover:bg-saffron-700 disabled:opacity-50"
                  >
                    {videoLoading ? "Saving Video…" : "Save Video to Profile"}
                  </button>
                </form>
              )}

              {/* Video Grid */}
              {allVideos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-saffron-200 bg-white p-8 text-center text-ink-soft">
                  <Video className="h-8 w-8 text-saffron-400 mx-auto mb-2" />
                  <p>No video recordings attached yet for this customer.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddVideo(true)}
                    className="mt-2 text-xs font-bold text-saffron-700 hover:underline"
                  >
                    + Upload First Video Recording
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="rounded-2xl border border-saffron-100 bg-white p-4 space-y-3 shadow-2xs text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-ink text-sm flex items-center gap-1.5">
                            📹 {vid.title}
                          </h5>
                          {vid.poojaTitle && (
                            <p className="text-saffron-700 font-medium text-[11px] mt-0.5">
                              🪔 {vid.poojaTitle}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(vid.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete Video"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {vid.description && (
                        <p className="text-ink-soft text-xs leading-relaxed bg-cream/40 p-2 rounded-lg">
                          {vid.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-saffron-50 pt-2 text-[11px]">
                        <span className="text-ink-soft">
                          Uploaded: {formatDate(vid.uploadedAt)}
                        </span>
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-saffron-50 px-2.5 py-1 font-bold text-saffron-700 hover:bg-saffron-100"
                        >
                          <Play className="h-3 w-3" />
                          Watch Video
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 7: RECEIPTS ── */}
          {activeTab === "receipts" && (
            <div className="space-y-4">
              <h4 className="font-bold text-ink text-sm">Official Customer Receipts</h4>
              <div className="space-y-2.5">
                {bookings.map((b) => {
                  const rcptNo =
                    b.receiptNumber ||
                    `RCPT-${b.createdAt.slice(0, 10).replace(/-/g, "")}-${b.bookingId.slice(-6).toUpperCase()}`;
                  return (
                    <div
                      key={b.bookingId}
                      className="rounded-2xl border border-saffron-100 bg-white p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-saffron-800 text-xs block">
                          {rcptNo}
                        </span>
                        <p className="font-semibold text-ink mt-0.5">
                          🪔 {b.poojaTitle} · {formatINR(b.amount)}
                        </p>
                        <p className="text-[11px] text-ink-soft">
                          Date: {formatDate(b.paidAt || b.createdAt)} · Ref: {b.bookingId}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/booking/${b.bookingId}?phone=${encodeURIComponent(user.phone)}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-200 bg-saffron-50 px-3 py-1.5 font-bold text-saffron-700 hover:bg-saffron-100"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Receipt
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 8: ACCOUNT SECURITY ── */}
          {activeTab === "account" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-saffron-100 bg-white p-5 space-y-4 shadow-2xs">
                <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4 text-saffron-600" />
                  Devotee Login Credentials Management
                </h4>
                <p className="text-ink-soft leading-relaxed">
                  Reset password for devotee login to allow them to access their self-service profile portal.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 max-w-md">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="flex-1 rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs text-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="rounded-xl bg-saffron-500 px-4 py-2 font-bold text-white hover:bg-saffron-600 transition-colors"
                  >
                    Update Password
                  </button>
                </div>
                {resetMsg && <p className="text-emerald-700 font-bold">{resetMsg}</p>}
                {resetErr && <p className="text-red-600 font-bold">{resetErr}</p>}
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 space-y-2">
                <h5 className="font-bold text-red-700 text-xs uppercase tracking-wider">
                  Danger Zone
                </h5>
                <p className="text-red-600/80 text-xs">
                  Permanently delete this devotee profile and their booking history from the admin registry.
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(user.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                >
                  Delete Devotee Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-saffron-100 bg-cream/30 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-saffron-500 px-5 py-2 text-xs font-bold text-white hover:bg-saffron-600 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
