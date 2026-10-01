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
  Printer,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import type { BookingRecord, UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";

interface FlatBooking {
  booking: BookingRecord;
  user: UserProfile;
}

export default function BookingsTable({
  users,
  onRefund,
}: {
  users: UserProfile[];
  onRefund: (userId: string, bookingId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<FlatBooking | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

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
            className="rounded-xl border border-saffron-100 bg-cream/40 px-3 py-1.5 text-xs text-ink focus:outline-none font-medium"
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
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking({ booking, user })}
                          className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-saffron-50 px-2.5 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Receipt
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
    </div>
  );
}
