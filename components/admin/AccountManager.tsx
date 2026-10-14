"use client";

import { useEffect, useState, useCallback } from "react";
import {
  KeyRound,
  RotateCcw,
  Save,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  CheckCheck,
  RefreshCw,
  Reply,
  ExternalLink,
} from "lucide-react";
import {
  adminConfig,
  changeAdminCredentials,
  fetchChatbotConfigRemote,
  fetchCeoMessagesRemote,
  updateCeoMessageStatusRemote,
  type CeoMessageRemote,
  resetAdminCredentials,
  savePlatformSettingsRemote,
} from "@/lib/api";
import { Field, ManagerCard, TextInput } from "./manager-ui";

export default function AccountManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  // Platform settings: WhatsApp Channel
  const [channelUrl, setChannelUrl] = useState("");
  const [channelMsg, setChannelMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingChannel, setSavingChannel] = useState(false);

  // CEO Inbox & Devotee Direct Messages
  const [ceoMessages, setCeoMessages] = useState<CeoMessageRemote[]>([]);
  const [loadingCeoMessages, setLoadingCeoMessages] = useState(false);
  const [ceoFilter, setCeoFilter] = useState<"all" | "new" | "read" | "responded">("all");

  const loadCeoMessages = useCallback(async () => {
    setLoadingCeoMessages(true);
    const res = await fetchCeoMessagesRemote(token);
    setLoadingCeoMessages(false);
    if (res.status === 401) {
      onAuthError();
      return;
    }
    setCeoMessages(res.messages);
  }, [token, onAuthError]);

  useEffect(() => {
    let live = true;
    adminConfig().then((c) => {
      if (live) setSavedEmail(c.email);
    });
    fetchChatbotConfigRemote(token).then((res) => {
      if (live && res.platformSettings?.whatsappChannelUrl) {
        setChannelUrl(res.platformSettings.whatsappChannelUrl);
      }
    });
    void loadCeoMessages();
    return () => {
      live = false;
    };
  }, [token, loadCeoMessages]);

  const saveChannel = async () => {
    const raw = channelUrl.trim();
    if (!raw) {
      setChannelMsg({ ok: false, text: "Channel URL cannot be empty." });
      return;
    }
    if (!raw.startsWith("https://") && !raw.startsWith("http://")) {
      setChannelMsg({
        ok: false,
        text: "Please enter a valid URL starting with https:// (e.g. https://whatsapp.com/channel/...)",
      });
      return;
    }

    setSavingChannel(true);
    setChannelMsg(null);
    const res = await savePlatformSettingsRemote({ whatsappChannelUrl: raw }, token);
    setSavingChannel(false);

    if (res.status === 401) {
      onAuthError();
      return;
    }

    if (res.ok) {
      setChannelMsg({
        ok: true,
        text: "Official WhatsApp Channel URL updated! The public website link is now live.",
      });
    } else {
      setChannelMsg({
        ok: false,
        text: res.error || "Failed to update channel URL.",
      });
    }
  };

  const save = async () => {
    if (!newEmail.trim() && !newPassword) {
      setMsg({
        ok: false,
        text: "Nothing to change — enter a new email and/or a new password.",
      });
      return;
    }
    if (newPassword.length > 0) {
      if (newPassword.length < 6) {
        setMsg({ ok: false, text: "New password must be at least 6 characters." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMsg({ ok: false, text: "New password and its confirmation do not match." });
        return;
      }
    }
    const res = await changeAdminCredentials({
      currentPassword,
      email: newEmail.trim(),
      newPassword,
      token,
    });
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setMsg({
        ok: false,
        text: res.error ?? "Could not update credentials.",
      });
      return;
    }
    setMsg({
      ok: true,
      text: "Admin credentials updated. Use them the next time you sign in.",
    });
    setCurrentPassword("");
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    const c = await adminConfig();
    setSavedEmail(c.email);
  };

  const reset = async () => {
    if (
      !window.confirm(
        "Reset the admin account to the default demo credentials?"
      )
    ) {
      return;
    }
    const res = await resetAdminCredentials(token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setMsg({ ok: false, text: res.error ?? "Could not reset credentials." });
      return;
    }
    setMsg({
      ok: true,
      text: "Credentials have been reset to defaults. You will need to sign in with the default credentials.",
    });
    setCurrentEmail("");
    setCurrentPassword("");
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    const c = await adminConfig();
    setSavedEmail(c.email);
  };

  return (
    <ManagerCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
            <KeyRound className="h-5 w-5 text-saffron-600" />
            Admin Account
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Change the email and password used to sign in to this dashboard.
          </p>
        </div>
        <button onClick={reset} className="btn-outline !px-4 !py-2.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to defaults
        </button>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-saffron-50 px-4 py-2.5 text-xs font-semibold text-ink-soft">
        Current sign-in email:{" "}
        <span className="font-mono font-bold text-saffron-700">
          {savedEmail ?? "loading…"}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-saffron-200 bg-cream/60 p-5">
        <h3 className="mb-4 font-display text-base font-bold text-ink">
          Update Credentials
        </h3>
        <p className="mb-4 text-xs text-ink-soft">
          Enter your current password to confirm, then set the new email and/or
          password. Changes are saved on the server and apply on every device.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current email *">
            <TextInput
              type="email"
              value={currentEmail}
              onChange={(e) => {
                setCurrentEmail(e.target.value);
                setMsg(null);
              }}
              placeholder={savedEmail ?? "admin@thetemplepuja.com"}
              autoComplete="username"
            />
          </Field>
          <Field label="Current password *">
            <TextInput
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setMsg(null);
              }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <Field label="New email" hint="Optional — blank keeps the current email">
            <TextInput
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setMsg(null);
              }}
              placeholder={savedEmail ?? "admin@thetemplepuja.com"}
              autoComplete="off"
            />
          </Field>
          <div className="hidden sm:block" />
          <Field label="New password" hint="Optional — at least 6 characters">
            <TextInput
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setMsg(null);
              }}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setMsg(null);
              }}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
        </div>

        {msg && (
          <p
            className={`mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold ${
              msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {msg.text}
          </p>
        )}

        <button onClick={save} className="btn-primary mt-5">
          <Save className="h-4 w-4" />
          Save New Credentials
        </button>
      </div>

      {/* Official WhatsApp Channel Configuration */}
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-sm">
            📢
          </span>
          <h3 className="font-display text-base font-bold text-ink">
            Official WhatsApp Channel Configuration
          </h3>
        </div>
        <p className="mb-4 text-xs text-ink-soft">
          Configure the official WhatsApp Channel URL shown on the public website (e.g. for daily Panchang, darshan updates, and auspicious festival reminders).
          This is separate from direct 1-on-1 customer support.
        </p>

        <div className="space-y-4">
          <Field
            label="WhatsApp Channel URL *"
            hint="Must be a valid channel invite link (e.g. https://whatsapp.com/channel/...)"
          >
            <TextInput
              type="url"
              value={channelUrl}
              onChange={(e) => {
                setChannelUrl(e.target.value);
                setChannelMsg(null);
              }}
              placeholder="https://whatsapp.com/channel/0029Vaexample"
            />
          </Field>

          {channelMsg && (
            <p
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
                channelMsg.ok ? "bg-emerald-100/80 text-emerald-800" : "bg-red-50 text-red-600"
              }`}
            >
              {channelMsg.text}
            </p>
          )}

          <button
            type="button"
            onClick={saveChannel}
            disabled={savingChannel}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-800 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{savingChannel ? "Saving Channel..." : "Save WhatsApp Channel URL"}</span>
          </button>
        </div>
      </div>

      {/* CEO Inbox & Devotee Direct Messages */}
      <div className="mt-8 rounded-2xl border border-saffron-200 bg-saffron-50/40 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-600 text-white font-bold text-xs shadow-sm">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                CEO Inbox &amp; Devotee Direct Feedback
              </h3>
              <p className="text-xs text-ink-soft">
                Messages submitted via the public &quot;A Message to Our CEO&quot; portal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-100 px-3 py-1 text-xs font-semibold text-saffron-800">
              Total: {ceoMessages.length}
            </span>
            {ceoMessages.filter((m) => m.status === "new").length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white animate-pulse">
                {ceoMessages.filter((m) => m.status === "new").length} New
              </span>
            )}
            <button
              type="button"
              onClick={loadCeoMessages}
              disabled={loadingCeoMessages}
              className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-saffron-50 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingCeoMessages ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 mb-4 border-b border-saffron-200/60 pb-3">
          {(["all", "new", "read", "responded"] as const).map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setCeoFilter(filterKey)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                ceoFilter === filterKey
                  ? "bg-saffron-600 text-white shadow-xs"
                  : "bg-white/80 text-ink-soft hover:bg-white"
              }`}
            >
              {filterKey === "all" && `All (${ceoMessages.length})`}
              {filterKey === "new" && `New (${ceoMessages.filter((m) => m.status === "new").length})`}
              {filterKey === "read" && `Read (${ceoMessages.filter((m) => m.status === "read").length})`}
              {filterKey === "responded" && `Responded (${ceoMessages.filter((m) => m.status === "responded").length})`}
            </button>
          ))}
        </div>

        {/* Message List */}
        {loadingCeoMessages && ceoMessages.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-soft">
            Loading messages...
          </div>
        ) : ceoMessages.length === 0 ? (
          <div className="py-8 text-center rounded-xl bg-white/70 border border-saffron-100">
            <p className="text-xs text-ink-soft">No messages received yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {ceoMessages
              .filter((m) => (ceoFilter === "all" ? true : m.status === ceoFilter))
              .map((msg) => {
                const isPhone = /^\+?[0-9\s\-()]{7,15}$/.test(msg.contact.replace(/\s/g, ""));
                const isEmail = msg.contact.includes("@");
                const cleanPhone = msg.contact.replace(/\D/g, "");

                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl border p-4 transition-all ${
                      msg.status === "new"
                        ? "border-amber-300 bg-amber-50/50 shadow-xs"
                        : "border-saffron-100 bg-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">{msg.name}</span>
                        {msg.status === "new" && (
                          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            NEW
                          </span>
                        )}
                        {msg.status === "read" && (
                          <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                            READ
                          </span>
                        )}
                        {msg.status === "responded" && (
                          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            RESPONDED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-ink-soft">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(msg.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                    </div>

                    {msg.subject && (
                      <p className="text-xs font-semibold text-ink-soft mb-1.5">
                        Subject: <span className="text-ink">{msg.subject}</span>
                      </p>
                    )}

                    <div className="rounded-lg bg-sand-50/80 border border-sand-200/50 p-3 text-xs text-ink leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-saffron-100/70">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-ink-soft font-medium">Contact:</span>
                        <span className="font-semibold text-ink">{msg.contact}</span>

                        {isPhone && (
                          <div className="flex items-center gap-1 ml-2">
                            <a
                              href={`tel:${msg.contact}`}
                              className="inline-flex items-center gap-1 rounded-md bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-ink hover:bg-sand-200 transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-200 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}

                        {isEmail && (
                          <a
                            href={`mailto:${msg.contact}`}
                            className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800 hover:bg-sky-200 transition-colors ml-2"
                          >
                            <Mail className="h-3 w-3" />
                            <span>Email</span>
                          </a>
                        )}
                      </div>

                      {/* Status toggle actions */}
                      <div className="flex items-center gap-1.5">
                        {msg.status !== "read" && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updateCeoMessageStatusRemote(msg.id, "read", token);
                              void loadCeoMessages();
                            }}
                            className="rounded-md border border-saffron-200 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-soft hover:bg-saffron-50 transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
                        {msg.status !== "responded" && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updateCeoMessageStatusRemote(msg.id, "responded", token);
                              void loadCeoMessages();
                            }}
                            className="rounded-md bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors"
                          >
                            Mark Responded
                          </button>
                        )}
                        {msg.status !== "new" && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updateCeoMessageStatusRemote(msg.id, "new", token);
                              void loadCeoMessages();
                            }}
                            className="rounded-md border border-sand-200 bg-white px-2 py-0.5 text-[11px] text-ink-soft hover:bg-sand-50 transition-colors"
                          >
                            Mark New
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-ink-soft/70">
        🔒 Credentials and platform settings live on the server and sync across every device pointing at this deployment.
      </p>
    </ManagerCard>
  );
}
