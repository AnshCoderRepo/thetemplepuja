"use client";

import { LogOut, Menu } from "lucide-react";
import type { AdminTab } from "../types/admin.types";
import { NAV_ITEMS } from "./AdminSidebar";

interface AdminHeaderProps {
  currentTab: AdminTab;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export default function AdminHeader({
  currentTab,
  onOpenMobileMenu,
  onLogout,
}: AdminHeaderProps) {
  const currentNav = NAV_ITEMS.find((n) => n.id === currentTab);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-saffron-100 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl border border-saffron-200 bg-cream/40 text-ink-soft hover:bg-saffron-50"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-soft hidden sm:inline">Admin Console</span>
          <span className="text-ink-soft/40 hidden sm:inline">/</span>
          <span className="font-bold text-ink">
            {currentNav?.label || "Dashboard"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-cream/60 px-3 py-1.5 border border-saffron-100 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-ink text-[11px] hidden sm:inline">Database Live</span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
