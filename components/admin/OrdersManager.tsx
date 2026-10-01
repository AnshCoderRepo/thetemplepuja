"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  Filter,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Undo2,
  User,
  X,
  XCircle,
} from "lucide-react";
import type { BookingRecord, BookingStatus, UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";

type OrderStatusFilter = "all" | "confirmed" | "cancelled" | "rescheduled" | "refunded";

interface FlatOrder {
  orderId: string;
  booking: BookingRecord;
  user: UserProfile;
}

export default function OrdersManager({
  users,
  onRefund,
}: {
  users: UserProfile[];
  onRefund: (userId: string, bookingId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<OrderStatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<FlatOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Flatten all bookings (orders) across all devotees
  const allOrders = useMemo(() => {
    const list: FlatOrder[] = [];
    for (const u of users) {
      for (const b of u.bookings) {
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allOrders.filter(({ orderId, booking, user }) => {
      const matchesSearch =
        !q ||
        orderId.toLowerCase().includes(q) ||
        booking.bookingId.toLowerCase().includes(q) ||
        booking.poojaTitle.toLowerCase().includes(q) ||
        user.name.toLowerCase().includes(q) ||
        user.phone.includes(q) ||
        user.city.toLowerCase().includes(q);

      const matchesStatus =
        statusTab === "all" || booking.status === statusTab;

      const matchesDate =
        !dateFilter ||
        booking.createdAt.startsWith(dateFilter) ||
        booking.date.toLowerCase().includes(dateFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [allOrders, search, statusTab, dateFilter]);

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
      case "rescheduled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
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
      "Order ID",
      "Booking Reference",
      "Customer",
      "Phone",
      "Email",
      "Pooja / Item",
      "Total Amount",
      "Discount",
      "Status",
      "Payment Ref",
      "Date",
    ];

    const rows = filtered.map(({ orderId, booking, user }) => [
      `"${orderId}"`,
      `"${booking.bookingId}"`,
      `"${user.name}"`,
      `"${user.phone}"`,
      `"${user.email || ""}"`,
      `"${booking.poojaTitle}"`,
      booking.amount,
      booking.discount || 0,
      `"${booking.status}"`,
      `"${booking.razorpayPaymentId || "Demo"}"`,
      `"${booking.createdAt}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `all_orders_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <ShoppingBag className="h-6 w-6 text-saffron-600" />
            Orders & Transactions
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Audit all incoming transactions across all fulfillment states
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-2 text-xs font-bold text-saffron-800 shadow-sm hover:bg-saffron-100 disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-saffron-600" />
          Export Orders ({filtered.length})
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-saffron-100 pb-3">
        {(
          [
            { id: "all", label: "All Orders", count: allOrders.length },
            {
              id: "confirmed",
              label: "Successful / Confirmed",
              count: allOrders.filter((o) => o.booking.status === "confirmed").length,
            },
            {
              id: "rescheduled",
              label: "Rescheduled",
              count: allOrders.filter((o) => o.booking.status === "rescheduled").length,
            },
            {
              id: "refunded",
              label: "Refunded",
              count: allOrders.filter((o) => o.booking.status === "refunded").length,
            },
            {
              id: "cancelled",
              label: "Cancelled",
              count: allOrders.filter((o) => o.booking.status === "cancelled").length,
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
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
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

      {/* Search & Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-saffron-100 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Order ID, Booking ID, devotee, or pooja..."
            className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-saffron-100 bg-cream/30 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
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
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-saffron-100 bg-cream/40 px-3 py-1.5 text-xs text-ink focus:outline-none font-medium"
          />

          {(search || dateFilter || statusTab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDateFilter("");
                setStatusTab("all");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-700 hover:underline bg-saffron-50 px-2.5 py-1 rounded-lg border border-saffron-200"
            >
              Reset Filters ✕
            </button>
          )}
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
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-soft">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No orders found matching current criteria.</p>
                      {(search || dateFilter || statusTab !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setDateFilter("");
                            setStatusTab("all");
                            setPage(1);
                          }}
                          className="text-xs font-bold text-saffron-700 hover:underline bg-saffron-50 px-3 py-1.5 rounded-lg border border-saffron-200"
                        >
                          Reset Filters ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(({ orderId, booking, user }) => {
                  return (
                    <tr
                      key={booking.bookingId}
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
                        <div className="font-semibold text-ink">{booking.poojaTitle}</div>
                        <div className="text-[10px] text-ink-soft">
                          Scheduled: {booking.date}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                          <CreditCard className="h-3 w-3" />
                          {booking.razorpayPaymentId ? "Razorpay UPI/Card" : "Simulated Checkout"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-ink text-xs">
                        {formatINR(booking.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {statusBadge(booking.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder({ orderId, booking, user })}
                          className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-saffron-50 px-2.5 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-100"
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
                {selectedOrder.booking.razorpayPaymentId && (
                  <div className="flex justify-between text-[11px] text-ink-soft pt-1">
                    <span>Razorpay Payment ID:</span>
                    <span className="font-mono">{selectedOrder.booking.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-saffron-100 pt-4">
              {selectedOrder.booking.status === "confirmed" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Refund order ${selectedOrder.booking.bookingId}?`)) {
                      onRefund(selectedOrder.user.id, selectedOrder.booking.bookingId);
                      setSelectedOrder(null);
                    }
                  }}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Process Refund
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-saffron-500 px-5 py-2 text-xs font-bold text-white hover:bg-saffron-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
