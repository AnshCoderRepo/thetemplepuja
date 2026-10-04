"use client";

import { useState } from "react";
import type { UserProfile } from "@/lib/storage";
import type { AdminTab } from "../types/admin.types";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminDevoteesTab from "./AdminDevoteesTab";

import PoojasManager from "@/components/admin/PoojasManager";
import EventsManager from "@/components/admin/EventsManager";
import TemplesManager from "@/components/admin/TemplesManager";
import BookingsTable from "@/components/admin/BookingsTable";
import OrdersManager from "@/components/admin/OrdersManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import DatesManager from "@/components/admin/DatesManager";
import CouponsManager from "@/components/admin/CouponsManager";
import AccountManager from "@/components/admin/AccountManager";
import CustomerProfileModal from "@/components/admin/CustomerProfileModal";

interface AdminDashboardProps {
  tab: AdminTab;
  setTab: (tab: AdminTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  users: UserProfile[];
  poojaCount: number;
  templeCount: number;
  token: string | null;
  adminEmail: string;
  onLogout: () => void;
  onAuthError: () => void;
  onRefund: (userId: string, bookingId: string) => Promise<void>;
  onResetPassword: (phone: string, newPass: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function AdminDashboard({
  tab,
  setTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  users,
  poojaCount,
  templeCount,
  token,
  adminEmail,
  onLogout,
  onAuthError,
  onRefund,
  onResetPassword,
  onDeleteUser,
  onRefresh,
}: AdminDashboardProps) {
  const [selectedDevotee, setSelectedDevotee] = useState<UserProfile | null>(null);

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-saffron-100 z-30 shadow-sm">
        <AdminSidebar
          currentTab={tab}
          onTabSelect={setTab}
          adminEmail={adminEmail}
          onLogout={onLogout}
        />
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex w-72 max-w-[80vw] flex-col bg-white shadow-2xl z-10 animate-fadeIn">
            <AdminSidebar
              currentTab={tab}
              onTabSelect={(newTab: AdminTab) => {
                setTab(newTab);
                setMobileMenuOpen(false);
              }}
              adminEmail={adminEmail}
              onLogout={onLogout}
            />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <AdminHeader
          currentTab={tab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onLogout={onLogout}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-6xl w-full mx-auto">
          {tab === "analytics" && (
            <AnalyticsDashboard
              users={users}
              onRefresh={onRefresh}
              activePoojaCount={poojaCount}
              activeTempleCount={templeCount}
            />
          )}

          {tab === "poojas" && (
            <PoojasManager token={token || ""} onAuthError={onAuthError} />
          )}

          {tab === "festivals" && (
            <EventsManager token={token || ""} onAuthError={onAuthError} />
          )}

          {tab === "temples" && (
            <TemplesManager token={token || ""} onAuthError={onAuthError} />
          )}

          {tab === "bookings" && (
            <BookingsTable users={users} onRefund={onRefund} />
          )}

          {tab === "orders" && (
            <OrdersManager users={users} onRefund={onRefund} />
          )}

          {tab === "devotees" && (
            <AdminDevoteesTab
              users={users}
              onSelectDevotee={setSelectedDevotee}
              onResetPassword={onResetPassword}
              onDeleteUser={onDeleteUser}
            />
          )}

          {tab === "dates" && (
            <DatesManager token={token || ""} onAuthError={onAuthError} />
          )}

          {tab === "coupons" && (
            <CouponsManager token={token || ""} onAuthError={onAuthError} />
          )}

          {tab === "account" && (
            <AccountManager token={token || ""} onAuthError={onAuthError} />
          )}
        </main>
      </div>

      {selectedDevotee && (
        <CustomerProfileModal
          user={selectedDevotee}
          token={token || ""}
          onClose={() => setSelectedDevotee(null)}
          onUserUpdated={() => onRefresh()}
          onRefund={onRefund}
          onDelete={onDeleteUser}
          onResetPassword={async (phone, newPass) => {
            try {
              await onResetPassword(phone, newPass);
              return { ok: true };
            } catch (err: any) {
              return { ok: false, error: err?.message || "Failed to reset password" };
            }
          }}
        />
      )}
    </div>
  );
}
