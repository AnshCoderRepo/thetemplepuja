"use client";

import Link from "next/link";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ExternalLink,
  Flame,
  Gift,
  KeyRound,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { AdminTab, NavItem } from "../types/admin.types";

export const NAV_ITEMS: NavItem[] = [
  { id: "analytics", label: "Analytics Dashboard", icon: BarChart3, group: "Overview" },
  { id: "poojas", label: "Puja Catalog", icon: Flame, group: "Management" },
  { id: "temples", label: "Temples", icon: Building2, group: "Management" },
  { id: "bookings", label: "Successful Bookings", icon: ShieldCheck, group: "Orders & Sevas" },
  { id: "orders", label: "All Orders & Payments", icon: ShoppingBag, group: "Orders & Sevas" },
  { id: "devotees", label: "Devotee Profiles", icon: Users, group: "Community" },
  { id: "dates", label: "Pooja Dates", icon: CalendarDays, group: "Settings" },
  { id: "coupons", label: "Coupons", icon: Gift, group: "Settings" },
  { id: "account", label: "Admin Account", icon: KeyRound, group: "Settings" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface AdminSidebarProps {
  currentTab: AdminTab;
  onTabSelect: (tab: AdminTab) => void;
  adminEmail: string;
  onLogout: () => void;
}

export default function AdminSidebar({
  currentTab,
  onTabSelect,
  adminEmail,
  onLogout,
}: AdminSidebarProps) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 pt-1 pb-3 border-b border-saffron-100/80">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-xl font-bold text-white shadow-md shadow-saffron-500/20">
            🪔
          </span>
          <div>
            <span className="text-sm font-extrabold text-ink tracking-tight block">
              The Temple Puja
            </span>
            <span className="text-[10px] font-bold text-saffron-600 tracking-wider uppercase">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isSelected = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all text-left ${
                  isSelected
                    ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-500/20"
                    : "text-ink-soft hover:bg-cream/60 hover:text-ink"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-white" : "text-saffron-600"}`} />
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="space-y-2 pt-4 border-t border-saffron-100/80">
        <Link
          href="/"
          target="_blank"
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-cream/50 hover:text-ink"
        >
          <span>View Public Site</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        <div className="flex items-center justify-between rounded-2xl bg-cream/40 p-2.5 border border-saffron-100">
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-saffron-200 text-xs font-bold text-saffron-800">
              {initials(adminEmail || "Admin")}
            </div>
            <div className="truncate">
              <div className="text-[11px] font-bold text-ink leading-tight">Admin User</div>
              <div className="text-[10px] text-ink-soft/70 truncate max-w-[110px]">{adminEmail}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
