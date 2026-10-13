"use client";

import { useEffect, useState, useCallback } from "react";
import {
  clearAdminToken,
  getAdminToken,
  getUsers,
  isAdminSession,
  setAdminToken,
  type UserProfile,
} from "@/lib/storage";
import {
  adminConfig,
  adminLogout,
  deleteUserRemote,
  fetchAllUsers,
  fetchCatalog,
  refundBookingRemote,
  resetDevoteePassword,
} from "@/lib/api";
import { AdminLoginGate } from "@/features/auth";
import { AdminDashboard, type AdminTab } from "@/features/admin";
import { normalizeAdminTab } from "@/lib/admin-tab";

interface AdminPageClientProps {
  initialSection?: string;
}

export default function AdminPageClient({ initialSection }: AdminPageClientProps) {
  const [session, setSession] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTabState] = useState<AdminTab>(() => normalizeAdminTab(initialSection));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [poojaCount, setPoojaCount] = useState(12);
  const [templeCount, setTempleCount] = useState(6);
  const [adminEmail, setAdminEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  // Sync tab with URL without full page reload
  const handleTabChange = useCallback((newTab: AdminTab) => {
    setTabState(newTab);
    if (typeof window !== "undefined") {
      const targetPath = newTab === "analytics" ? "/admin" : `/admin/${newTab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: newTab }, "", targetPath);
      }
    }
  }, []);

  // Sync tab from URL on mount and when browser back/forward buttons are pressed
  useEffect(() => {
    setMounted(true);
    const isAuth = isAdminSession();
    const storedToken = getAdminToken();
    setSession(isAuth);
    setToken(storedToken);

    // If URL has a specific sub-path on reload, honor it
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.replace(/^\/admin\/?/, "").split("/");
      const directSlug = parts[0];
      if (directSlug) {
        setTabState(normalizeAdminTab(directSlug));
      } else if (initialSection) {
        setTabState(normalizeAdminTab(initialSection));
      }

      const handlePopState = () => {
        const pathParts = window.location.pathname.replace(/^\/admin\/?/, "").split("/");
        setTabState(normalizeAdminTab(pathParts[0]));
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [initialSection]);

  useEffect(() => {
    if (session && token) {
      loadData(token);
    }
  }, [session, token]);

  // Live real-time sync in Admin: automatically refresh data when devotees book or catalog updates
  useEffect(() => {
    if (!session || !token) return;
    const onLiveUpdate = () => {
      void loadData(token);
    };
    window.addEventListener("devotee-updated", onLiveUpdate);
    window.addEventListener("catalog-updated", onLiveUpdate);
    return () => {
      window.removeEventListener("devotee-updated", onLiveUpdate);
      window.removeEventListener("catalog-updated", onLiveUpdate);
    };
  }, [session, token]);

  const loadData = async (tok: string | null) => {
    const remoteUsers = await fetchAllUsers(tok);
    if (remoteUsers) setUsers(remoteUsers);
    else setUsers(getUsers());

    const catalog = await fetchCatalog();
    if (catalog) {
      if (catalog.poojas) setPoojaCount(catalog.poojas.length);
      if (catalog.temples) setTempleCount(catalog.temples.length);
    }

    const cfg = await adminConfig();
    setAdminEmail(cfg.email);
  };

  const handleLoginSuccess = (newToken: string) => {
    setAdminToken(newToken);
    setSession(true);
    setToken(newToken);
    loadData(newToken);
  };

  const handleLogout = async () => {
    if (token) await adminLogout(token);
    clearAdminToken();
    setSession(false);
    setToken(null);
  };

  const handleAuthError = () => {
    clearAdminToken();
    setSession(false);
    setToken(null);
  };

  const handleRefund = async (userId: string, bookingId: string) => {
    if (!token) return;
    const res = await refundBookingRemote(userId, bookingId, token);
    if (res.status === 401) {
      handleAuthError();
      return;
    }
    await loadData(token);
  };

  const handleResetPassword = async (phone: string, newPassword: string) => {
    if (!token) return;
    const res = await resetDevoteePassword(phone, newPassword, token);
    if (!res.ok) {
      if (res.status === 401) {
        handleAuthError();
      }
      throw new Error(res.error || "Failed to reset password.");
    }
    await loadData(token);
  };

  const handleDeleteUser = async (id: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to permanently delete this devotee account?")) return;
    const res = await deleteUserRemote(id, token);
    if (res.status === 401) {
      handleAuthError();
      return;
    }
    await loadData(token);
  };

  // Avoid hydration mismatch before reading client storage
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-saffron-500 border-t-transparent" />
          <span>Loading Admin Console...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AdminLoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AdminDashboard
      tab={tab}
      setTab={handleTabChange}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
      users={users}
      poojaCount={poojaCount}
      templeCount={templeCount}
      token={token}
      adminEmail={adminEmail}
      onLogout={handleLogout}
      onAuthError={handleAuthError}
      onRefund={handleRefund}
      onResetPassword={handleResetPassword}
      onDeleteUser={handleDeleteUser}
      onRefresh={() => loadData(token)}
    />
  );
}
