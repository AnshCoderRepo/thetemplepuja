"use client";

import { useEffect, useState } from "react";
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

export default function AdminPage() {
  const [session, setSession] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("analytics");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [poojaCount, setPoojaCount] = useState(12);
  const [templeCount, setTempleCount] = useState(6);
  const [adminEmail, setAdminEmail] = useState("admin@thetemplepuja.com");

  useEffect(() => {
    const isAuth = isAdminSession();
    const storedToken = getAdminToken();
    setSession(isAuth);
    setToken(storedToken);

    if (isAuth) {
      loadData(storedToken);
    }
  }, []);

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

  if (!session) {
    return <AdminLoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AdminDashboard
      tab={tab}
      setTab={setTab}
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
