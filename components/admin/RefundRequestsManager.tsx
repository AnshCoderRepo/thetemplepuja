"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  History,
  Info,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import type { AdminRole, RefundRequest, RefundRequestStatus } from "@/lib/refund-types";
import { formatINR } from "@/lib/format";
import {
  approveRefundRemote,
  executeRefundRemote,
  fetchRefundRequestsRemote,
  rejectRefundRemote,
} from "@/lib/api";

type StatusTab = "all" | RefundRequestStatus;

export default function RefundRequestsManager({
  token,
  adminEmail,
  onRefresh,
  onAuthError,
}: {
  token: string;
  adminEmail: string;
  onRefresh?: () => void;
  onAuthError?: () => void;
}) {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<AdminRole>("admin");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [selectedAuditRequest, setSelectedAuditRequest] = useState<RefundRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<RefundRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [executingRequest, setExecutingRequest] = useState<RefundRequest | null>(null);
  const [manualUtr, setManualUtr] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetchRefundRequestsRemote(token);
    setLoading(false);
    if (res.status === 401) {
      onAuthError?.();
      return;
    }
    if (res.ok) {
      setRequests(res.requests);
      if (res.role) setCurrentRole(res.role);
    }
  }, [token, onAuthError]);

  useEffect(() => {
    if (token) loadRequests();
  }, [token, loadRequests]);

  // Real-time listener
  useEffect(() => {
    const handleUpdate = () => {
      if (token) loadRequests();
    };
    window.addEventListener("catalog-updated", handleUpdate);
    window.addEventListener("devotee-updated", handleUpdate);
    return () => {
      window.removeEventListener("catalog-updated", handleUpdate);
      window.removeEventListener("devotee-updated", handleUpdate);
    };
  }, [token, loadRequests]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // Counts
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: requests.length,
      pending_approval: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      failed: 0,
    };
    for (const r of requests) {
      if (map[r.status] !== undefined) map[r.status]++;
    }
    return map;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return requests.filter((r) => {
      const matchesTab = statusTab === "all" || r.status === statusTab;
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.bookingId.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        r.poojaTitle.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.requestedBy.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [requests, statusTab, search]);

  const isSuperAdmin = currentRole === "super_admin";

  // Actions
  const handleApprove = async (req: RefundRequest) => {
    if (req.requestedBy.toLowerCase() === adminEmail.toLowerCase()) {
      alert("Separation of duties: You submitted this refund request. Another authorized approver must approve it.");
      return;
    }
    if (!confirm(`Are you sure you want to APPROVE refund request ${req.id} for ₹${req.requestedAmount}?`)) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    const res = await approveRefundRemote(token, req.id);
    setActionLoading(false);

    if (res.ok) {
      showToast(`Refund request ${req.id} approved successfully.`);
      loadRequests();
      onRefresh?.();
    } else {
      setErrorMessage(res.error || "Failed to approve refund request.");
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejecting the refund request.");
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    const res = await rejectRefundRemote(token, rejectingRequest.id, rejectionReason.trim());
    setActionLoading(false);

    if (res.ok) {
      showToast(`Refund request ${rejectingRequest.id} was rejected.`);
      setRejectingRequest(null);
      setRejectionReason("");
      loadRequests();
      onRefresh?.();
    } else {
      setErrorMessage(res.error || "Failed to reject refund request.");
    }
  };

  const handleConfirmExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingRequest) return;

    setActionLoading(true);
    setErrorMessage(null);

    const manualPayload =
      executingRequest.paymentMethod !== "razorpay"
        ? {
            settlementReference: manualUtr.trim(),
            executionNotes: manualNotes.trim() || undefined,
          }
        : undefined;

    const res = await executeRefundRemote(token, executingRequest.id, manualPayload);
    setActionLoading(false);

    if (res.ok) {
      showToast(`Refund ${executingRequest.id} executed successfully! Devotee booking status updated.`);
      setExecutingRequest(null);
      setManualUtr("");
      setManualNotes("");
      loadRequests();
      onRefresh?.();
    } else {
      setErrorMessage(res.error || "Execution failed.");
    }
  };

  const getStatusBadge = (status: RefundRequestStatus) => {
    switch (status) {
      case "pending_approval":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
            <Clock className="h-3 w-3" /> Pending Approval
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
            <Check className="h-3 w-3" /> Approved (Ready)
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
            <RefreshCw className="h-3 w-3 animate-spin" /> Processing
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800">
            <AlertCircle className="h-3 w-3" /> Execution Failed
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

  return (
    <div className="space-y-5">
      {/* Top Banner / Toast */}
      {toastMessage && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <RotateCcw className="h-6 w-6 text-saffron-600" />
              Refund Requests & Approvals
            </h2>
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <ShieldCheck className="h-3 w-3" /> Approver (Super Admin)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                Standard Admin (Submit Only)
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft mt-0.5">
            Controlled, multi-stage approval workflow with strict financial safeguards and separation of duties.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs font-bold text-ink shadow-xs hover:bg-cream/40 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-saffron-600 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-saffron-100 pb-2 text-xs font-bold">
        {[
          { id: "all", label: "All Requests", count: counts.all },
          { id: "pending_approval", label: "Pending Approval", count: counts.pending_approval },
          { id: "approved", label: "Approved (Ready)", count: counts.approved },
          { id: "rejected", label: "Rejected", count: counts.rejected },
          { id: "completed", label: "Completed", count: counts.completed },
          { id: "failed", label: "Failed", count: counts.failed },
        ].map((tab) => {
          const active = statusTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id as StatusTab)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                active
                  ? "bg-saffron-500 text-white shadow-xs"
                  : "bg-cream/50 text-ink-soft hover:bg-cream hover:text-ink"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                active ? "bg-white/20 text-white" : "bg-black/5 text-ink-soft"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Request ID, Order ID, Devotee name, phone, or reason..."
          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-saffron-100 bg-white text-ink focus:border-saffron-400 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/40 hover:text-ink cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="border-b border-saffron-100 bg-cream/40 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Request ID & Order</th>
                <th className="px-4 py-3.5">Devotee / Customer</th>
                <th className="px-4 py-3.5">Puja Ceremony</th>
                <th className="px-4 py-3.5">Refund Amount</th>
                <th className="px-4 py-3.5">Reason & Requestor</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <RotateCcw className="h-6 w-6 text-saffron-300" />
                      <p className="font-semibold text-xs">No refund requests found matching the current criteria.</p>
                      <p className="text-[11px] text-ink-soft/60">
                        Refund requests submitted from Order Details will appear here for review and approval.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const isRequester = req.requestedBy.toLowerCase() === adminEmail.toLowerCase();
                  const canSelfApprove = false; // Never allow self-approval per policy

                  return (
                    <tr key={req.id} className="hover:bg-orange-50/30 transition-colors">
                      {/* 1. Request ID & Order */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-saffron-800">
                          <span>{req.id}</span>
                          <button
                            type="button"
                            onClick={() => copyText(req.id, req.id)}
                            className="text-ink-soft/40 hover:text-ink cursor-pointer"
                            title="Copy Request ID"
                          >
                            {copiedId === req.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-ink-soft mt-0.5">
                          Order: <span className="font-mono font-medium text-ink">{req.orderId}</span>
                        </div>
                        <div className="text-[10px] text-ink-soft/60">
                          {new Date(req.requestedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* 2. Devotee */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-ink">{req.customerName}</div>
                        <div className="text-[11px] text-ink-soft">{req.customerPhone}</div>
                        {req.customerEmail && (
                          <div className="text-[10px] text-ink-soft/70 truncate max-w-[150px]">
                            {req.customerEmail}
                          </div>
                        )}
                      </td>

                      {/* 3. Puja Ceremony */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink">{req.poojaTitle}</div>
                        <div className="text-[10px] text-ink-soft">
                          Original: {formatINR(req.originalAmount)} {req.currency}
                        </div>
                        <div className="text-[10px] text-sky-700 capitalize">
                          {req.paymentMethod === "razorpay" ? "Razorpay Gateway" : req.paymentMethod.replace("_", " ")}
                        </div>
                      </td>

                      {/* 4. Refund Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-rose-700 text-sm">
                          {formatINR(req.requestedAmount)}
                        </div>
                        {req.requestedAmount < req.originalAmount && (
                          <span className="inline-block rounded-full bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                            Partial Refund
                          </span>
                        )}
                        {req.previouslyRefundedAmount > 0 && (
                          <div className="text-[9px] text-ink-soft/70">
                            Prev: {formatINR(req.previouslyRefundedAmount)}
                          </div>
                        )}
                      </td>

                      {/* 5. Reason & Requestor */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs text-ink truncate" title={req.reason}>
                          {req.reason}
                        </p>
                        <div className="text-[10px] text-ink-soft mt-0.5">
                          By: <span className="font-medium text-ink">{req.requestedBy}</span>
                        </div>
                        {req.rejectionReason && (
                          <div className="text-[10px] text-rose-700 mt-1 bg-rose-50 p-1 rounded border border-rose-100">
                            Rejection: {req.rejectionReason}
                          </div>
                        )}
                        {req.providerRefundId && (
                          <div className="text-[10px] text-emerald-800 mt-1 font-mono bg-emerald-50 px-1 py-0.5 rounded">
                            Ref: {req.providerRefundId}
                          </div>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>

                      {/* 7. Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditRequest(req)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="View audit trail and state history"
                        >
                          <History className="h-3 w-3" />
                          Audit
                        </button>

                        {/* Approval Stage Controls */}
                        {req.status === "pending_approval" && (
                          <>
                            {isSuperAdmin ? (
                              isRequester && !canSelfApprove ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-800"
                                  title="Separation of duties: You submitted this request. Another approver must review it."
                                >
                                  <ShieldAlert className="h-3 w-3" />
                                  Self-Approve Disabled
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(req)}
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer disabled:opacity-50"
                                  >
                                    <Check className="h-3 w-3" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingRequest(req);
                                      setRejectionReason("");
                                    }}
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-800 hover:bg-rose-100 cursor-pointer disabled:opacity-50"
                                  >
                                    <X className="h-3 w-3" />
                                    Reject
                                  </button>
                                </>
                              )
                            ) : (
                              <span className="text-[11px] text-ink-soft italic">
                                Awaiting Approver
                              </span>
                            )}
                          </>
                        )}

                        {/* Execution Stage Controls */}
                        {req.status === "approved" && (
                          <>
                            {isSuperAdmin ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setExecutingRequest(req);
                                  setManualUtr("");
                                  setManualNotes("");
                                }}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-saffron-300 bg-saffron-50 px-3 py-1 text-xs font-bold text-saffron-800 hover:bg-saffron-100 cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Execute Refund
                              </button>
                            ) : (
                              <span className="text-[11px] text-sky-800 font-semibold">
                                Approved
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleConfirmReject}
            className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-rose-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Reject Refund Request
                </span>
                <h3 className="text-base font-bold text-ink">
                  Request: {rejectingRequest.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="text-ink-soft hover:text-ink cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-ink-soft">
              Please specify the audit reason for rejecting this refund request of{" "}
              <strong className="text-ink font-bold">
                {formatINR(rejectingRequest.requestedAmount)}
              </strong>{" "}
              for devotee <strong className="text-ink">{rejectingRequest.customerName}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">
                Rejection Reason (Mandatory):
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State clearly why the request cannot be approved (e.g. puja ceremony already completed, duplicate request, etc.)..."
                className="w-full rounded-xl border border-rose-200 bg-cream/20 p-2.5 text-xs text-ink focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-ink-soft hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !rejectionReason.trim()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Execution Modal */}
      {executingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleConfirmExecute}
            className="w-full max-w-lg rounded-3xl border border-saffron-200 bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-saffron-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-saffron-700">
                  Execute Approved Refund
                </span>
                <h3 className="text-base font-bold text-ink">
                  {executingRequest.poojaTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExecutingRequest(null)}
                className="text-ink-soft hover:text-ink cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-cream/40 p-3.5 space-y-1.5 border border-saffron-100 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-soft">Refund Amount:</span>
                <span className="font-bold text-rose-700 text-sm">
                  {formatINR(executingRequest.requestedAmount)} {executingRequest.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Devotee Name:</span>
                <span className="font-semibold text-ink">{executingRequest.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Payment Method:</span>
                <span className="font-medium text-ink capitalize">
                  {executingRequest.paymentMethod === "razorpay" ? "Razorpay Gateway" : executingRequest.paymentMethod.replace("_", " ")}
                </span>
              </div>
              {executingRequest.paymentReference && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Payment Ref / ID:</span>
                  <span className="font-mono text-ink">{executingRequest.paymentReference}</span>
                </div>
              )}
            </div>

            {executingRequest.paymentMethod === "razorpay" ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3.5 text-xs text-sky-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="h-4 w-4 text-sky-600" />
                  Automated Gateway Execution
                </div>
                <p className="text-[11px] leading-relaxed">
                  Submitting will call the authoritative Razorpay Refunds API for payment{" "}
                  <code className="font-mono">{executingRequest.paymentReference}</code>. The refund will be credited back to the devotee&apos;s original payment source.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3.5 text-xs text-purple-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="h-4 w-4 text-purple-600" />
                    Manual Provider Settlement Required
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This booking was paid via UPI QR or Offline Checkout. Automated gateway refunds are not supported for this provider. Please complete the payout to the devotee and enter the bank/UPI UTR number below for audit compliance.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">
                    Bank / UPI Transfer UTR Reference (Mandatory):
                  </label>
                  <input
                    type="text"
                    required
                    value={manualUtr}
                    onChange={(e) => setManualUtr(e.target.value)}
                    placeholder="e.g. 12-digit UTR 328918239012 or IMPS ref..."
                    className="w-full rounded-xl border border-saffron-200 bg-white p-2.5 text-xs font-mono text-ink focus:border-saffron-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Execution Notes (Optional):</label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="e.g. Sent via Google Pay / Paytm to devotee mobile..."
                    className="w-full rounded-xl border border-saffron-200 bg-white p-2 text-xs text-ink focus:border-saffron-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-saffron-100">
              <button
                type="button"
                onClick={() => setExecutingRequest(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-ink-soft hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || (executingRequest.paymentMethod !== "razorpay" && !manualUtr.trim())}
                className="rounded-xl bg-saffron-500 px-4 py-2 text-xs font-bold text-white hover:bg-saffron-600 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Processing..." : "Confirm & Execute Refund"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audit Log Modal */}
      {selectedAuditRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-saffron-200 bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-saffron-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-saffron-700">
                  Refund Audit Trail & History
                </span>
                <h3 className="text-base font-bold text-ink font-mono">
                  {selectedAuditRequest.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditRequest(null)}
                className="text-ink-soft hover:text-ink cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl bg-cream/40 p-3 space-y-1 border border-saffron-100">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Order Reference:</span>
                  <span className="font-mono font-bold text-ink">{selectedAuditRequest.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Booking ID:</span>
                  <span className="font-mono text-ink">{selectedAuditRequest.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Devotee:</span>
                  <span className="font-semibold text-ink">{selectedAuditRequest.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Amount Requested:</span>
                  <span className="font-bold text-rose-700">
                    {formatINR(selectedAuditRequest.requestedAmount)} {selectedAuditRequest.currency}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-ink text-xs mb-2">Immutable Audit Timeline:</h4>
                <div className="space-y-2">
                  {selectedAuditRequest.auditTrail.map((log, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-bold text-ink">
                        <span className="capitalize">{log.action.replace("_", " ")}</span>
                        <span className="text-[10px] text-ink-soft font-normal">
                          {new Date(log.timestamp).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-soft">
                        By: <span className="text-ink font-medium">{log.performedBy}</span>
                      </div>
                      {log.details && (
                        <p className="text-[11px] text-ink/80 mt-1 bg-white p-1.5 rounded border border-slate-100">
                          {log.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-saffron-100">
              <button
                type="button"
                onClick={() => setSelectedAuditRequest(null)}
                className="rounded-xl bg-saffron-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-saffron-600 cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
