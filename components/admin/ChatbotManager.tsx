"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Save,
  MessageSquare,
  Send,
  RotateCcw,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings2,
} from "lucide-react";
import {
  fetchChatbotConfigRemote,
  saveChatbotKnowledgeRemote,
  saveChatbotSettingsRemote,
  sendChatMessage,
} from "@/lib/api";
import type {
  ChatbotCategory,
  ChatbotKnowledgeEntry,
  ChatbotSettings,
} from "@/lib/chatbot-types";
import {
  DEFAULT_CHATBOT_KNOWLEDGE,
  DEFAULT_CHATBOT_SETTINGS,
} from "@/lib/chatbot-types";
import { Field, ManagerCard, TextArea, TextInput } from "./manager-ui";

const CATEGORIES: { id: "all" | ChatbotCategory; label: string; emoji: string }[] = [
  { id: "all", label: "All Categories", emoji: "📚" },
  { id: "pujas", label: "Pujas & Rituals", emoji: "🪔" },
  { id: "temples", label: "Sacred Temples", emoji: "🛕" },
  { id: "bookings", label: "Bookings & Muhurat", emoji: "📅" },
  { id: "payments", label: "Payments & Receipts", emoji: "💳" },
  { id: "chadhava", label: "Chadhava & Prasad", emoji: "📦" },
  { id: "events", label: "Festivals & Events", emoji: "✨" },
  { id: "faqs", label: "General FAQs", emoji: "❓" },
];

export default function ChatbotManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"knowledge" | "instructions" | "simulator">("knowledge");
  const [knowledge, setKnowledge] = useState<ChatbotKnowledgeEntry[]>([]);
  const [settings, setSettings] = useState<ChatbotSettings>(DEFAULT_CHATBOT_SETTINGS);
  const [selectedCategory, setSelectedCategory] = useState<"all" | ChatbotCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<ChatbotKnowledgeEntry> | null>(null);
  const [keywordsInput, setKeywordsInput] = useState("");

  // Simulator State
  const [simMessages, setSimMessages] = useState<Array<{ from: "bot" | "user"; text: string }>>([
    {
      from: "bot",
      text: "🙏 Namaste! I am Pandit AI. Ask me anything about poojas, pricing, booking procedures, or festivals to test my training.",
    },
  ]);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetchChatbotConfigRemote(token);
    if (res.status === 401) {
      onAuthError();
      return;
    }
    setKnowledge(res.knowledge?.length ? res.knowledge : DEFAULT_CHATBOT_KNOWLEDGE);
    if (res.settings && Object.keys(res.settings).length > 0) {
      setSettings(res.settings);
    }
    setLoading(false);
  }, [token, onAuthError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingEntry({
      id: "kb-" + Date.now().toString(36),
      title: "",
      category: selectedCategory === "all" ? "pujas" : selectedCategory,
      question: "",
      answer: "",
      keywords: [],
    });
    setKeywordsInput("");
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (entry: ChatbotKnowledgeEntry) => {
    setEditingEntry({ ...entry });
    setKeywordsInput((entry.keywords || []).join(", "));
    setModalOpen(true);
  };

  // Save Entry (Add or Update)
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry?.title?.trim() || !editingEntry?.answer?.trim()) {
      showToast("error", "Please provide both a Title/Question and an Answer.");
      return;
    }

    const cleanedKeywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const fullEntry: ChatbotKnowledgeEntry = {
      id: editingEntry.id || "kb-" + Date.now().toString(36),
      title: editingEntry.title.trim(),
      category: editingEntry.category || "pujas",
      question: editingEntry.question?.trim() || editingEntry.title.trim(),
      answer: editingEntry.answer.trim(),
      keywords: cleanedKeywords,
      updatedAt: new Date().toISOString(),
    };

    const exists = knowledge.some((k) => k.id === fullEntry.id);
    const updated = exists
      ? knowledge.map((k) => (k.id === fullEntry.id ? fullEntry : k))
      : [fullEntry, ...knowledge];

    setKnowledge(updated);
    setModalOpen(false);

    const res = await saveChatbotKnowledgeRemote(updated, token);
    if (res.status === 401) {
      onAuthError();
      return;
    }
    if (res.ok) {
      showToast("success", exists ? "Knowledge entry updated successfully." : "New training entry added successfully.");
    } else {
      showToast("error", res.error || "Failed to persist knowledge entry.");
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the training entry: "${title}"?`)) return;

    const filtered = knowledge.filter((k) => k.id !== id);
    setKnowledge(filtered);

    const res = await saveChatbotKnowledgeRemote(filtered, token);
    if (res.status === 401) {
      onAuthError();
      return;
    }
    if (res.ok) {
      showToast("success", `Entry "${title}" deleted.`);
    } else {
      showToast("error", res.error || "Failed to delete knowledge entry.");
    }
  };

  // Save Persona Instructions
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveChatbotSettingsRemote(settings, token);
    if (res.status === 401) {
      onAuthError();
      return;
    }
    if (res.ok) {
      showToast("success", "Chatbot instructions and persona settings updated.");
    } else {
      showToast("error", res.error || "Failed to update chatbot settings.");
    }
  };

  // Simulator Test Message
  const handleSendSim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim() || simLoading) return;

    const userText = simInput.trim();
    const newMessages = [...simMessages, { from: "user" as const, text: userText }];
    setSimMessages(newMessages);
    setSimInput("");
    setSimLoading(true);

    const res = await sendChatMessage(newMessages);
    setSimLoading(false);
    setSimMessages([...newMessages, { from: "bot", text: res.reply }]);
  };

  // Reset simulator
  const handleResetSim = () => {
    setSimMessages([
      {
        from: "bot",
        text: "🙏 Namaste! Simulator reset. Ask any question to test chatbot answers.",
      },
    ]);
  };

  // Filtered entries
  const filteredKnowledge = knowledge.filter((entry) => {
    const matchesCategory =
      selectedCategory === "all" || entry.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(q) ||
      (entry.question && entry.question.toLowerCase().includes(q)) ||
      entry.answer.toLowerCase().includes(q) ||
      (entry.keywords && entry.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-semibold shadow-md transition-all ${
            notification.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Header Card */}
      <ManagerCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-saffron-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-amber-600 text-white shadow-md shadow-saffron-500/20">
                <Bot className="h-5 w-5" />
              </span>
              <h2 className="font-display text-xl font-bold text-ink">
                AI Chatbot Training & Knowledge Base
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              Train your website AI assistant with custom business information, puja pricing, temple tie-ups, and frequently asked questions.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center gap-2 bg-cream/70 p-1.5 rounded-2xl border border-saffron-100 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("knowledge")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "knowledge"
                  ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <span>Knowledge Entries ({knowledge.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("instructions")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "instructions"
                  ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Persona & Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "simulator"
                  ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Test Simulator</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: KNOWLEDGE BASE ── */}
        {activeTab === "knowledge" && (
          <div className="pt-4 space-y-5">
            {/* Action Bar: Search, Category Filter, and Add Button */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions, answers, keywords..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-saffron-100 bg-cream/40 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Add New Knowledge Button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 transition-all shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add Knowledge Entry</span>
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat.id
                      ? "bg-saffron-500 text-white border-saffron-500 shadow-sm"
                      : "bg-white text-ink-soft border-saffron-100 hover:bg-cream/60 hover:text-ink"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Knowledge Entries List */}
            {loading ? (
              <div className="py-12 text-center text-xs text-ink-soft animate-pulse">
                Loading trained knowledge base...
              </div>
            ) : filteredKnowledge.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-saffron-200 bg-cream/30 p-8 text-center space-y-2">
                <HelpCircle className="h-8 w-8 text-saffron-400 mx-auto" />
                <p className="text-xs font-bold text-ink">No knowledge entries found</p>
                <p className="text-[11px] text-ink-soft">
                  {searchQuery ? "Try refining your search terms or selecting another category." : "Add your first business Q&A entry using the button above."}
                </p>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {filteredKnowledge.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col justify-between rounded-2xl border border-saffron-100 bg-white p-4 shadow-xs hover:border-saffron-300 hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Badge & Category */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-saffron-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-saffron-700 border border-saffron-100">
                          {entry.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1 rounded-lg text-ink-soft hover:bg-saffron-50 hover:text-saffron-700 transition-colors"
                            title="Edit Entry"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id, entry.title)}
                            className="p-1 rounded-lg text-ink-soft hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Question */}
                      <h4 className="text-xs font-bold text-ink leading-snug mb-1">
                        {entry.title}
                      </h4>
                      {entry.question && entry.question !== entry.title && (
                        <p className="text-[11px] font-medium text-saffron-800/80 mb-2 italic">
                          &ldquo;{entry.question}&rdquo;
                        </p>
                      )}

                      {/* Answer Snippet */}
                      <p className="text-[11px] leading-relaxed text-ink-soft line-clamp-3 mb-3 whitespace-pre-line">
                        {entry.answer}
                      </p>
                    </div>

                    {/* Keywords Tag Row */}
                    {entry.keywords && entry.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-saffron-50">
                        <Tag className="h-3 w-3 text-saffron-400 shrink-0" />
                        {entry.keywords.slice(0, 4).map((kw, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-cream/80 px-1.5 py-0.5 text-[10px] text-ink-soft font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                        {entry.keywords.length > 4 && (
                          <span className="text-[9px] text-ink-soft/60">
                            +{entry.keywords.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PERSONA & INSTRUCTIONS ── */}
        {activeTab === "instructions" && (
          <form onSubmit={handleSaveSettings} className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business / Brand Name" hint="How the chatbot identifies the organization">
                <TextInput
                  value={settings.businessName || ""}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  placeholder="templepujasewa"

                />
              </Field>

              <Field label="Devotee Support Helpline Phone" hint="Included in fallbacks and booking escalations">
                <TextInput
                  value={settings.supportPhone || ""}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  placeholder="+91 87653 01563"
                />
              </Field>
            </div>

            <Field
              label="Welcome Message"
              hint="Initial greeting shown when a devotee opens the chatbot widget"
            >
              <TextInput
                value={settings.welcomeMessage || ""}
                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                placeholder="🙏 Namaste! I am your Pandit AI Spiritual Guide..."
              />
            </Field>

            <Field
              label="Fallback Response Message"
              hint="Shown when an inquiry is outside current business knowledge (WhatsApp link is appended automatically)"
            >
              <TextArea
                rows={3}
                value={settings.fallbackMessage || ""}
                onChange={(e) => setSettings({ ...settings, fallbackMessage: e.target.value })}
                placeholder="🪔 For personalized guidance or specific queries not covered here, please connect directly with our temple coordinators on WhatsApp."
              />
            </Field>

            <Field
              label="Master System Instructions & Persona"
              hint="Controls the tone, reverence, privacy rules, and response guardrails"
            >
              <TextArea
                rows={9}
                value={settings.systemInstructions || ""}
                onChange={(e) => setSettings({ ...settings, systemInstructions: e.target.value })}
                placeholder="You are Pandit AI, a spiritual guide for templepujasewa..."

                className="font-mono text-xs leading-relaxed"
              />
            </Field>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Save Chatbot Instructions</span>
            </button>
          </form>
        )}

        {/* ── TAB 3: LIVE TEST SIMULATOR ── */}
        {activeTab === "simulator" && (
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-saffron-100">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-ink">
                  Interactive Live Simulator (Testing Active Knowledge & Catalog)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetSim}
                className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-saffron-600 font-semibold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Chat</span>
              </button>
            </div>

            {/* Simulator Chat Stream */}
            <div className="h-[380px] overflow-y-auto rounded-2xl border border-saffron-100 bg-cream/30 p-4 space-y-3 text-xs">
              {simMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-line ${
                      msg.from === "user"
                        ? "rounded-br-xs bg-saffron-500 text-white shadow-sm"
                        : "rounded-bl-xs border border-saffron-100 bg-white text-ink shadow-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {simLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs border border-saffron-100 bg-white p-3 text-ink-soft shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-saffron-500 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-saffron-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-saffron-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Test Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-ink-soft font-semibold shrink-0">Try asking:</span>
              {[
                "What poojas do you offer?",
                "What is the starting price?",
                "Do I need to be physically present?",
                "How do I track my booking status?",
                "What chadhava items are available?",
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSimInput(sample)}
                  className="rounded-lg bg-white border border-saffron-100 px-2.5 py-1 text-ink-soft hover:bg-saffron-50 hover:text-saffron-800 transition-colors whitespace-nowrap shrink-0"
                >
                  {sample}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendSim} className="flex gap-2">
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="Ask Pandit AI a question to verify training response..."
                className="flex-1 rounded-xl border border-saffron-100 bg-white px-4 py-2.5 text-xs text-ink outline-none focus:border-saffron-500 shadow-xs"
              />
              <button
                type="submit"
                disabled={simLoading || !simInput.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-saffron-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-saffron-600 transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </ManagerCard>

      {/* ── MODAL: ADD / EDIT KNOWLEDGE ENTRY ── */}
      {modalOpen && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-saffron-100 bg-white p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-saffron-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-100 text-saffron-700">
                  <Bot className="h-4 w-4" />
                </span>
                <h3 className="font-display text-base font-bold text-ink">
                  {knowledge.some((k) => k.id === editingEntry.id) ? "Edit Knowledge Entry" : "Add Training Information"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-soft hover:bg-cream"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <Field label="Category *" hint="Helps organize knowledge topics">
                <select
                  value={editingEntry.category || "pujas"}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      category: e.target.value as ChatbotCategory,
                    })
                  }
                  className="w-full rounded-xl border border-saffron-100 bg-cream/40 px-3.5 py-2.5 text-xs text-ink outline-none focus:border-saffron-400 focus:bg-white"
                >
                  <option value="pujas">🪔 Pujas & Rituals</option>
                  <option value="temples">🛕 Sacred Temples</option>
                  <option value="bookings">📅 Bookings & Muhurat</option>
                  <option value="payments">💳 Payments & Receipts</option>
                  <option value="chadhava">📦 Chadhava & Prasad</option>
                  <option value="events">✨ Festivals & Events</option>
                  <option value="faqs">❓ General FAQs</option>
                  <option value="general">🌐 General Business Info</option>
                </select>
              </Field>

              <Field
                label="Topic Title / Question *"
                hint="e.g. 'Can I book a puja for my parents?' or 'Kaal Sarp Dosh Puja Details'"
              >
                <TextInput
                  value={editingEntry.title || ""}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, title: e.target.value })
                  }
                  placeholder="e.g. Which packages are available for Griha Pravesh?"
                  required
                />
              </Field>

              <Field
                label="Devotee Trigger Query (Optional)"
                hint="Alternative phrase or question devotee might ask"
              >
                <TextInput
                  value={editingEntry.question || ""}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, question: e.target.value })
                  }
                  placeholder="e.g. How much does a home puja cost?"
                />
              </Field>

              <Field
                label="Verified Business Answer *"
                hint="The exact, authentic answer the chatbot will supply"
              >
                <TextArea
                  rows={5}
                  value={editingEntry.answer || ""}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, answer: e.target.value })
                  }
                  placeholder="Provide complete, accurate business details. Do not guess prices or false dates."
                  required
                />
              </Field>

              <Field
                label="Keywords (Optional)"
                hint="Comma-separated trigger words (e.g. price, griha pravesh, cost, dakshina)"
              >
                <TextInput
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="griha pravesh, home puja, cost, family"
                />
              </Field>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-saffron-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Knowledge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
