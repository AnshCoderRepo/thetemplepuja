"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  Edit2,
  Edit3,
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
  RefreshCw,
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
import { addCustomerMediaRemote, deleteCustomerMediaRemote, updateCustomerProfileRemote } from "@/lib/api";

export type ProfileTab =
  | "overview"
  | "edit"
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
  initialTab?: ProfileTab;
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

const COMMON_GOTRAS = [
  "Kashyap",
  "Bharadwaj",
  "Vashishta",
  "Vishwamitra",
  "Shandilya",
  "Gautam",
  "Garg",
  "Parashar",
  "Kaushik",
  "Jamadagni",
  "Atri",
];

export default function CustomerProfileModal({
  user,
  token,
  initialTab = "overview",
  onClose,
  onUserUpdated,
  onRefund,
  onDelete,
  onResetPassword,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Devotee Form State
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editEmail, setEditEmail] = useState(
    user.email && !user.email.startsWith("pw:") ? user.email : ""
  );
  const [editGotra, setEditGotra] = useState(user.gotra || "Kashyap");
  const [editCity, setEditCity] = useState(user.city || "");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditEmail(user.email && !user.email.startsWith("pw:") ? user.email : "");
    setEditGotra(user.gotra || "Kashyap");
    setEditCity(user.city || "");
    setEditPassword("");
  }, [user]);

  // Video Management State
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
  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "rescheduled"
  );
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

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pass = "Bhakti@";
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditPassword(pass);
  };

  const handleSaveDevotee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");

    if (!editName.trim()) {
      setEditError("Devotee full name is required.");
      return;
    }
    if (!editPhone.trim()) {
      setEditError("Mobile number is required.");
      return;
    }

    setSavingEdit(true);
    const res = await updateCustomerProfileRemote(
      user.id,
      {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        gotra: editGotra.trim(),
        city: editCity.trim(),
        password: editPassword.trim() || undefined,
      },
      token
    );
    setSavingEdit(false);

    if (res.ok && res.user) {
      setEditSuccess("Devotee profile updated successfully! All linked records synced.");
      onUserUpdated(res.user);
      setTimeout(() => {
        setEditSuccess("");
        setActiveTab("overview");
      }, 1200);
    } else {
      setEditError(res.error || "Failed to update devotee profile.");
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
    { id: "edit", label: "Edit Devotee", icon: Edit3 },
    { id: "bookings", label: "Bookings", icon: Calendar, count: bookings.length },
    { id: "orders", label: "Orders & Sevas", icon: ShoppingBag, count: bookings.length },
    { id: "pujas", label: "Purchased Pujas", icon: Flame, count: Object.keys(purchasedPujas).length },
    { id: "chadhavas", label: "Chadhavas", icon: Sparkles, count: allChadhavas.length },
    { id: "videos", label: "Videos / Media", icon: Video, count: allVideos.length },
    { id: "receipts", label: "Receipts", icon: Receipt, count: bookings.length },
    { id: "account", label: "Account Security", icon: KeyRound },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-6 backdrop-blur-md animate-fadeIn">
      <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-saffron-200/90 bg-white shadow-2xl animate-scaleUp">
        {/* Top Modal Header */}
        <div className="relative bg-gradient-to-r from-saffron-600 via-amber-600 to-maroon-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-white/20 font-bold text-lg shadow-soft backdrop-blur border border-white/25">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-bold truncate">{user.name}</h3>
                  <span className="rounded-full bg-emerald-400/20 border border-emerald-300/40 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-100 uppercase">
                    ✓ Verified Devotee
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase font-mono">
                    ID: {user.id}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-100 truncate">
                  📱 +91 {user.phone} · 🕉️ Gotra: {user.gotra || "Kashyap"} · 📍 {user.city || "Varanasi"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "edit" ? "overview" : "edit")}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  activeTab === "edit"
                    ? "bg-white text-saffron-700 shadow-sm"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {activeTab === "edit" ? "View Profile" : "Edit Devotee"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/25 hover:text-white cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-black/20 backdrop-blur-xs p-3 text-xs border border-white/10">
            <div>
              <span className="text-[10px] text-amber-200 uppercase font-semibold block">Total Sevas</span>
              <p className="font-bold text-base text-white">{bookings.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-amber-200 uppercase font-semibold block">Total Spent</span>
              <p className="font-bold text-base text-white">{formatINR(totalSpent)}</p>
            </div>
            <div>
              <span className="text-[10px] text-amber-200 uppercase font-semibold block">Chadhavas</span>
              <p className="font-bold text-base text-white">{allChadhavas.length} Items</p>
            </div>
            <div>
              <span className="text-[10px] text-amber-200 uppercase font-semibold block">Puja Videos</span>
              <p className="font-bold text-base text-white">{allVideos.length} Available</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-saffron-100 bg-cream/40 overflow-x-auto px-4 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
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
          {/* ── TAB: EDIT DEVOTEE (NEW PREMIUM POPUP EDIT EXPERIENCE) ── */}
          {activeTab === "edit" && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-saffron-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-saffron-100 pb-4">
                  <div>
                    <h4 className="font-display text-base font-bold text-ink flex items-center gap-2">
                      <Edit2 className="h-4 w-4 text-saffron-600" />
                      Edit Devotee Account & Personal Details
                    </h4>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Updates here will sync across all linked bookings, receipts, orders, and the devotee&apos;s self-service login.
                    </p>
                  </div>
                  <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-bold text-saffron-700 border border-saffron-200 self-start sm:self-auto">
                    ID: {user.id}
                  </span>
                </div>

                <form onSubmit={handleSaveDevotee} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g. Rajesh Kumar Sharma"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-saffron-200 bg-cream/30 text-ink focus:border-saffron-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Mobile Number (Devotee Login ID) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                        <input
                          type="tel"
                          required
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-saffron-200 bg-cream/30 text-ink font-mono font-bold focus:border-saffron-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-ink-soft mt-1">
                        Primary key used by the devotee to sign in and view bookings.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="e.g. devotee@example.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-saffron-200 bg-cream/30 text-ink focus:border-saffron-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">
                        City / Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="e.g. Varanasi, UP"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-saffron-200 bg-cream/30 text-ink focus:border-saffron-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label className="block font-bold text-ink">
                        Vedic Gotra
                      </label>
                      <div className="relative">
                        <Flame className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-saffron-600" />
                        <input
                          type="text"
                          value={editGotra}
                          onChange={(e) => setEditGotra(e.target.value)}
                          placeholder="e.g. Kashyap"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-saffron-200 bg-cream/30 text-ink font-semibold focus:border-saffron-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-ink-soft">Quick select:</span>
                        {COMMON_GOTRAS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setEditGotra(g)}
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold border transition-colors cursor-pointer ${
                              editGotra === g
                                ? "bg-saffron-500 text-white border-saffron-600"
                                : "bg-cream text-ink-soft border-saffron-100 hover:bg-white"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Devotee Password Management */}
                    <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink text-xs flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-amber-700" />
                          Devotee Account Password & Access
                        </span>
                        {user.generatedPassword && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800">
                            Current: {user.generatedPassword}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder={user.generatedPassword ? `Leave blank to keep "${user.generatedPassword}"` : "Set new password (min 6 chars)"}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-white text-ink font-mono focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-amber-200/80 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-300 transition-colors cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate Password
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-800/80">
                        The devotee can log into their account using their mobile number and this password.
                      </p>
                    </div>
                  </div>

                  {editError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                      ⚠️ {editError}
                    </div>
                  )}

                  {editSuccess && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                      ✅ {editSuccess}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-saffron-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-2.5 text-xs font-bold text-white shadow-soft hover:from-saffron-600 hover:to-saffron-700 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {savingEdit ? "Saving Changes..." : "Save Devotee Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB 1: OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Devotee Info */}
                <div className="rounded-2xl border border-saffron-100 bg-white p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                      <User className="h-4 w-4 text-saffron-600" />
                      Devotee Profile Details
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="inline-flex items-center gap-1 rounded-lg bg-saffron-50 px-2.5 py-1 text-[11px] font-bold text-saffron-700 hover:bg-saffron-100 border border-saffron-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit Details
                    </button>
                  </div>
                  <div className="divide-y divide-saffron-50 text-xs">
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Full Name:</span>
                      <span className="font-bold text-ink">{user.name}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Mobile Number:</span>
                      <span className="font-mono font-bold text-ink">+91 {user.phone}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Email:</span>
                      <span className="text-ink">{user.email && !user.email.startsWith("pw:") ? user.email : "Not provided"}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Vedic Gotra:</span>
                      <span className="text-ink font-semibold">{user.gotra || "Kashyap"}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">City / State:</span>
                      <span className="text-ink font-medium">{user.city || "Varanasi"}</span>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-ink-soft">Registered On:</span>
                      <span className="text-ink">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Devotee Login & Credentials Box */}
                <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 to-cream/70 p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-amber-700" />
                      Devotee Portal Login Credentials
                    </h4>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Active Access
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft leading-relaxed">
                    Devotee can log in at <code className="font-mono bg-white px-1 py-0.5 rounded text-ink">/profile</code> or <code className="font-mono bg-white px-1 py-0.5 rounded text-ink">/login</code> to track ritual timings and watch their puja video.
                  </p>
                  <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-ink-soft">Login ID (Phone):</span>
                      <span className="font-mono font-bold text-ink">{user.phone}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-100/60">
                      <span className="text-ink-soft">Password:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono font-bold text-saffron-800 bg-saffron-50 px-2 py-0.5 rounded">
                          {user.generatedPassword || "Bhakti@707041"}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText(user.generatedPassword || "Bhakti@707041", "pwd")}
                          className="text-ink-soft/60 hover:text-ink p-1 cursor-pointer"
                          title="Copy Password"
                        >
                          {copiedId === "pwd" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className="w-full text-center text-xs font-bold text-saffron-700 hover:underline pt-1 cursor-pointer"
                  >
                    Change Devotee Password →
                  </button>
                </div>
              </div>

              {/* Seva Statistics & Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </div>

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
                            className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-saffron-50 px-2.5 py-1 font-semibold text-saffron-700 hover:bg-saffron-100 cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            View Receipt
                          </Link>
                          {b.status === "confirmed" && (
                            <button
                              type="button"
                              onClick={() => onRefund(user.id, b.bookingId)}
                              className="text-red-600 font-semibold hover:underline cursor-pointer"
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
              <h4 className="font-bold text-ink text-sm">Orders & Payments ({bookings.length})</h4>
              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-saffron-200 bg-white p-8 text-center text-xs text-ink-soft">
                  No orders recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div
                      key={b.bookingId}
                      className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-ink">{b.bookingId}</span>
                        <span className="font-bold text-saffron-700">{formatINR(b.amount)}</span>
                      </div>
                      <p className="text-ink-soft">{b.poojaTitle} · {b.date}</p>
                      <div className="text-[11px] text-ink-soft flex justify-between pt-1 border-t border-saffron-50">
                        <span>Ref: {b.razorpayPaymentId || "Confirmed Seva"}</span>
                        <span className="capitalize text-emerald-700 font-semibold">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4: PUJAS ── */}
          {activeTab === "pujas" && (
            <div className="space-y-4">
              <h4 className="font-bold text-ink text-sm">Purchased Pujas ({Object.keys(purchasedPujas).length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.values(purchasedPujas).map((p) => (
                  <div key={p.title} className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-2xs space-y-1">
                    <p className="font-bold text-ink">🪔 {p.title}</p>
                    <p className="text-ink-soft">Count: {p.count} times · Spent: {formatINR(p.totalSpent)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 5: CHADHAVAS ── */}
          {activeTab === "chadhavas" && (
            <div className="space-y-4">
              <h4 className="font-bold text-ink text-sm">All Purchased Chadhavas ({allChadhavas.length})</h4>
              {allChadhavas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-saffron-200 bg-white p-8 text-center text-xs text-ink-soft">
                  No chadhavas recorded.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {allChadhavas.map((c, idx) => (
                    <div key={idx} className="rounded-xl border border-saffron-100 bg-white p-3 flex justify-between items-center shadow-2xs">
                      <div>
                        <p className="font-bold text-ink">{c.emoji || "🍯"} {c.name} x{c.quantity}</p>
                        <p className="text-[11px] text-ink-soft">For: {c.poojaTitle} ({c.bookingId})</p>
                      </div>
                      <span className="font-bold text-saffron-700">{formatINR(c.price * c.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 6: VIDEOS / MEDIA ── */}
          {activeTab === "videos" && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-ink text-sm flex items-center gap-2">
                  <Video className="h-4 w-4 text-saffron-600" />
                  Sacred Puja Video Recordings ({allVideos.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddVideo(!showAddVideo)}
                  className="rounded-xl bg-saffron-500 px-3.5 py-1.5 font-bold text-white hover:bg-saffron-600 transition-colors cursor-pointer"
                >
                  {showAddVideo ? "Cancel" : "+ Add Video Link"}
                </button>
              </div>

              {showAddVideo && (
                <form onSubmit={handleAddVideo} className="rounded-2xl border border-saffron-200 bg-cream/40 p-4 space-y-3">
                  <span className="font-bold text-ink block text-xs">+ Attach Video Link to Devotee Profile</span>
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Video URL (YouTube/Drive) *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://youtu.be/... or Google Drive link"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full rounded-xl border border-saffron-200 px-3 py-2 text-xs text-ink bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Video Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maha Rudrabhishek Puja Ceremony"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="w-full rounded-xl border border-saffron-200 px-3 py-2 text-xs text-ink bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">Description / Notes</label>
                    <textarea
                      rows={2}
                      value={videoDesc}
                      onChange={(e) => setVideoDesc(e.target.value)}
                      className="w-full rounded-xl border border-saffron-200 px-3 py-1.5 text-xs text-ink bg-white focus:outline-none resize-none"
                    />
                  </div>
                  {videoErr && <p className="text-red-600 text-xs font-bold">{videoErr}</p>}
                  {videoMsg && <p className="text-emerald-700 text-xs font-bold">{videoMsg}</p>}
                  <button
                    type="submit"
                    disabled={videoLoading}
                    className="rounded-xl bg-saffron-500 px-4 py-2 font-bold text-white hover:bg-saffron-600 cursor-pointer disabled:opacity-50"
                  >
                    {videoLoading ? "Saving..." : "Save Video Recording"}
                  </button>
                </form>
              )}

              {allVideos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-saffron-200 bg-white p-8 text-center text-xs text-ink-soft">
                  No video recordings attached yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allVideos.map((v) => (
                    <div key={v.id} className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-2xs space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-ink truncate">📹 {v.title}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(v.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {v.description && <p className="text-[11px] text-ink-soft truncate">{v.description}</p>}
                      <div className="flex justify-between items-center pt-2 border-t border-saffron-50">
                        <span className="text-[10px] text-ink-soft">{formatDate(v.uploadedAt)}</span>
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-saffron-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-saffron-600"
                        >
                          <Play className="h-3 w-3 fill-current" /> Watch
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
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-ink text-sm">Official Receipts ({bookings.length})</h4>
              <div className="space-y-2.5">
                {bookings.map((b) => (
                  <div key={b.bookingId} className="rounded-xl border border-saffron-100 bg-white p-3.5 flex justify-between items-center shadow-2xs">
                    <div>
                      <p className="font-bold text-ink">🧾 {b.receiptNumber || `RCPT-${b.bookingId}`}</p>
                      <p className="text-ink-soft">{b.poojaTitle} · {formatINR(b.amount)}</p>
                    </div>
                    <Link
                      href={`/booking/${b.bookingId}?phone=${encodeURIComponent(user.phone)}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-xl bg-saffron-50 border border-saffron-200 px-3 py-1.5 font-bold text-saffron-700 hover:bg-saffron-100 cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Receipt
                    </Link>
                  </div>
                ))}
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
                    className="rounded-xl bg-saffron-500 px-4 py-2 font-bold text-white hover:bg-saffron-600 transition-colors cursor-pointer"
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
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Delete Devotee Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-saffron-100 bg-cream/30 px-6 py-3.5 flex items-center justify-between">
          <div className="text-xs text-ink-soft">
            Devotee Phone: <span className="font-mono font-bold text-ink">{user.phone}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-saffron-500 px-5 py-2 text-xs font-bold text-white hover:bg-saffron-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
