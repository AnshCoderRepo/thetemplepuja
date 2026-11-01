"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Heart,
  Loader2,
  MessageSquare,
  MessageSquareQuote,
  Pencil,
  Phone,
  Mail,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import type { FeedbackItem, FeedbackCounts, FeedbackStatus } from "@/lib/feedback-store";
import ConfirmDialog from "./ConfirmDialog";

interface FeedbackManagerProps {
  token: string;
  onAuthError: () => void;
  onRefresh?: () => void;
}

export default function FeedbackManager({
  token,
  onAuthError,
  onRefresh,
}: FeedbackManagerProps) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [counts, setCounts] = useState<FeedbackCounts>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
    averageRating: 5.0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected" | "featured">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<FeedbackItem | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editMessage, setEditMessage] = useState<string>("");
  const [editRating, setEditRating] = useState<number>(5);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Notification Banner
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const url = new URL("/api/admin/feedback", window.location.origin);
      if (activeTab !== "all") {
        url.searchParams.set("status", activeTab);
      }
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-admin-token": token,
        },
      });

      if (res.status === 401) {
        onAuthError();
        return;
      }

      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items || []);
        if (json.data.counts) {
          setCounts(json.data.counts);
        }
      }
    } catch (err) {
      console.error("[FeedbackManager] Error loading data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, activeTab, searchQuery, onAuthError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    if (onRefresh) onRefresh();
  };

  // Status Updater (Approve / Reject)
  const handleUpdateStatus = async (item: FeedbackItem, newStatus: FeedbackStatus) => {
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-admin-token": token,
        },
        body: JSON.stringify({
          id: item.id,
          status: newStatus,
        }),
      });

      if (res.status === 401) {
        onAuthError();
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update feedback status.");
      }

      setNotification(`Feedback from ${item.name} has been marked as ${newStatus}.`);
      setTimeout(() => setNotification(null), 4000);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating status.");
    }
  };

  // Featured Toggle
  const handleToggleFeatured = async (item: FeedbackItem) => {
    try {
      const newFeatured = !item.isFeatured;
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-admin-token": token,
        },
        body: JSON.stringify({
          id: item.id,
          isFeatured: newFeatured,
        }),
      });

      if (res.status === 401) {
        onAuthError();
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update featured flag.");
      }

      setNotification(
        newFeatured
          ? `Feedback from ${item.name} is now Featured on the landing page.`
          : `Removed Featured status from ${item.name}'s review.`
      );
      setTimeout(() => setNotification(null), 4000);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating featured status.");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: FeedbackItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditMessage(item.message);
    setEditRating(item.rating || 5);
  };

  // Save Edit Modal
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-admin-token": token,
        },
        body: JSON.stringify({
          id: editingItem.id,
          name: editName.trim(),
          message: editMessage.trim(),
          rating: editRating,
        }),
      });

      if (res.status === 401) {
        onAuthError();
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save edits.");
      }

      setNotification(`Feedback updated successfully.`);
      setTimeout(() => setNotification(null), 4000);
      setEditingItem(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving edits.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/feedback?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-admin-token": token,
        },
      });

      if (res.status === 401) {
        onAuthError();
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete feedback.");
      }

      setNotification(`Review from ${deleteTarget.name} has been deleted.`);
      setTimeout(() => setNotification(null), 4000);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting feedback.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-saffron-100">
        <div>
          <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
            <MessageSquareQuote className="h-6 w-6 text-saffron-600" />
            <span>Devotee Feedback &amp; Reviews</span>
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Review devotee testimonials, approve submissions for the public landing page, and manage ratings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft shadow-xs hover:bg-saffron-50 hover:text-saffron-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-saffron-600 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ── Notification Banner ── */}
      {notification && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ── Metrics Cards Banner ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 text-center shadow-xs">
          <span className="block text-2xl font-black text-slate-800">{counts.total}</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-center shadow-xs">
          <span className="block text-2xl font-black text-amber-700">{counts.pending}</span>
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center shadow-xs">
          <span className="block text-2xl font-black text-emerald-700">{counts.approved}</span>
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1">
            <Check className="h-3 w-3" /> Approved
          </span>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-center shadow-xs">
          <span className="block text-2xl font-black text-red-700">{counts.rejected}</span>
          <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider flex items-center justify-center gap-1">
            <X className="h-3 w-3" /> Rejected
          </span>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 text-center shadow-xs">
          <span className="block text-2xl font-black text-purple-700">{counts.featured}</span>
          <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-500/10 p-4 text-center shadow-xs">
          <span className="block text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
            ★ {counts.averageRating || 5.0}
          </span>
          <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">Avg Rating</span>
        </div>
      </div>

      {/* ── Filters & Search Console ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-saffron-100 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "pending" ? "bg-amber-500 text-white shadow-xs" : "text-amber-800 hover:text-amber-950"
            }`}
          >
            <Clock className="h-3 w-3" /> Pending ({counts.pending})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "approved" ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-800 hover:text-emerald-950"
            }`}
          >
            <Check className="h-3 w-3" /> Approved ({counts.approved})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("featured")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "featured" ? "bg-purple-600 text-white shadow-xs" : "text-purple-800 hover:text-purple-950"
            }`}
          >
            <Sparkles className="h-3 w-3" /> Featured ({counts.featured})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "rejected" ? "bg-red-600 text-white shadow-xs" : "text-red-800 hover:text-red-950"
            }`}
          >
            <X className="h-3 w-3" /> Rejected ({counts.rejected})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by devotee, message, phone, or email..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 font-medium"
          />
        </div>
      </div>

      {/* ── Feedback List Grid ── */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="h-8 w-8 text-saffron-600 animate-spin mx-auto" />
          <p className="text-xs text-ink-soft">Loading devotee feedbacks...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white border border-saffron-100 shadow-xs space-y-2">
          <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Feedback Found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchQuery
              ? `No feedback entries matched "${searchQuery}".`
              : "No feedback entries in this category yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const isPending = item.status === "pending";
            const isApproved = item.status === "approved";
            const isRejected = item.status === "rejected";

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 bg-white shadow-xs transition-all space-y-3 flex flex-col justify-between ${
                  isPending
                    ? "border-amber-300 bg-amber-50/20"
                    : isApproved
                    ? "border-emerald-200"
                    : "border-slate-200 bg-slate-50/50"
                }`}
              >
                <div>
                  {/* Card Header: Devotee Name + Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {item.name}
                        </h4>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isPending
                              ? "bg-amber-100 text-amber-900"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isApproved && <Check className="h-2.5 w-2.5" />}
                          {isPending && <Clock className="h-2.5 w-2.5" />}
                          {isRejected && <X className="h-2.5 w-2.5" />}
                          {item.status.toUpperCase()}
                        </span>

                        {/* Featured Badge */}
                        {item.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            <Sparkles className="h-2.5 w-2.5 text-purple-600" /> Featured
                          </span>
                        )}
                      </div>

                      {/* Contact metadata for Admin view */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        {item.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" /> {item.phone}
                          </span>
                        )}
                        {item.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" /> {item.email}
                          </span>
                        )}
                        <span>• {formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 shrink-0 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/80">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= (item.rating || 5)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-bold text-amber-900 ml-1">
                        {item.rating || 5}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  <div className="mt-3 text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100 italic">
                    &ldquo;{item.message}&rdquo;
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Approve Button */}
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item, "approved")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                        title="Approve feedback to display on landing page"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Approve
                      </button>
                    )}

                    {/* Reject Button */}
                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item, "rejected")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition-colors"
                        title="Reject feedback"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </button>
                    )}

                    {/* Toggle Featured */}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(item)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold text-xs transition-colors ${
                          item.isFeatured
                            ? "bg-purple-100 border-purple-300 text-purple-900"
                            : "border-slate-300 text-slate-700 hover:bg-slate-100"
                        }`}
                        title={item.isFeatured ? "Remove from Featured" : "Mark as Featured testimonial"}
                      >
                        <Star className={`h-3.5 w-3.5 ${item.isFeatured ? "fill-purple-600 text-purple-600" : ""}`} />
                        {item.isFeatured ? "Featured" : "Feature"}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
                      title="Edit feedback content"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Feedback Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-saffron-600" /> Edit Feedback
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Devotee Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Good</option>
                  <option value={2}>2 Stars - Fair</option>
                  <option value={1}>1 Star - Needs Improvement</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Feedback Message</label>
                <textarea
                  rows={4}
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium leading-relaxed resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editName.trim() || !editMessage.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Devotee Feedback"
        message={`Are you sure you want to permanently delete the review from "${deleteTarget?.name}"?`}
        confirmLabel="Yes, Delete Review"
        danger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

