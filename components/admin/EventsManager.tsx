"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Languages,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { fetchCatalog, resetCatalogSection, saveCatalogSection } from "@/lib/api";
import {
  getFestivalStatus,
  isEventActive,
  isFestivalActive,
  seatsLabel,
  type FestivalEvent,
  type Pooja,
  type UpcomingEventSpec,
} from "@/lib/data";
import {
  Field,
  GradientPicker,
  ManagerCard,
  ManagerHeader,
  NumberInput,
  TextInput,
  Toggle,
  DateInput,
  daysFromTodayToDate,
  dateToDaysFromToday,
  toISODateString,
} from "./manager-ui";

interface FestivalDraft {
  id: string;
  name: string;
  hindiName: string;
  teluguName: string;
  tamilName: string;
  badge: string;
  hindiBadge: string;
  teluguBadge: string;
  tamilBadge: string;
  heroTitle: string;
  hindiHeroTitle: string;
  teluguHeroTitle: string;
  tamilHeroTitle: string;
  heroSubtitle: string;
  hindiHeroSubtitle: string;
  teluguHeroSubtitle: string;
  tamilHeroSubtitle: string;
  startDate: string;
  endDate: string;
  daysFromToday: string;
  durationDays: string;
  heroImage: string;
  relatedPoojaSlugs: string[];
  ctaText: string;
  hindiCtaText: string;
  teluguCtaText: string;
  tamilCtaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  hindiSecondaryCtaText: string;
  teluguSecondaryCtaText: string;
  tamilSecondaryCtaText: string;
  secondaryCtaLink: string;
  priority: string;
  active: boolean;
}

const emptyFestivalDraft: FestivalDraft = {
  id: "",
  name: "",
  hindiName: "",
  teluguName: "",
  tamilName: "",
  badge: "🪔 UPCOMING FESTIVAL",
  hindiBadge: "🪔 आगामी पावन पर्व",
  teluguBadge: "🪔 రాబోయే పండుగ",
  tamilBadge: "🪔 வரவிருக்கும் திருவிழா",
  heroTitle: "",
  hindiHeroTitle: "",
  teluguHeroTitle: "",
  tamilHeroTitle: "",
  heroSubtitle: "",
  hindiHeroSubtitle: "",
  teluguHeroSubtitle: "",
  tamilHeroSubtitle: "",
  startDate: daysFromTodayToDate(7),
  endDate: daysFromTodayToDate(16),
  daysFromToday: "7",
  durationDays: "9",
  heroImage: "/festivals/durga-puja.jpg",
  relatedPoojaSlugs: [],
  ctaText: "Book Festival Puja",
  hindiCtaText: "त्योहार पूजा बुक करें",
  teluguCtaText: "పండుగ పూజ బుక్ చేయండి",
  tamilCtaText: "திருவிழா பூஜை பதிவு செய்க",
  ctaLink: "#poojas",
  secondaryCtaText: "Explore All Pujas",
  hindiSecondaryCtaText: "सभी पूजाएं देखें",
  teluguSecondaryCtaText: "అన్ని పూజలు చూడండి",
  tamilSecondaryCtaText: "அனைத்து பூஜைகளையும் காண்க",
  secondaryCtaLink: "#poojas",
  priority: "1",
  active: true,
};

interface EventDraft {
  title: string;
  slug: string;
  daysFromToday: string;
  time: string;
  seats: string;
  capacity: string;
  live: boolean;
  price: string;
  emoji: string;
  gradient: string;
}

const emptyEventDraft: EventDraft = {
  title: "",
  slug: "",
  daysFromToday: "7",
  time: "7:00 PM IST",
  seats: "20 spots open",
  capacity: "",
  live: true,
  price: "₹1,001",
  emoji: "🪔",
  gradient: "from-saffron-500 to-saffron-700",
};

export default function EventsManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"festivals" | "events">("festivals");

  // Festivals state
  const [festivals, setFestivals] = useState<FestivalEvent[]>([]);
  const [festivalDraft, setFestivalDraft] = useState<FestivalDraft>(emptyFestivalDraft);
  const [editingFestival, setEditingFestival] = useState<string | null>(null);
  const [addingFestival, setAddingFestival] = useState(false);

  // Scheduled Events state
  const [events, setEvents] = useState<UpcomingEventSpec[]>([]);
  const [eventDraft, setEventDraft] = useState<EventDraft>(emptyEventDraft);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [addingEvent, setAddingEvent] = useState(false);

  // Catalog poojas for multi-select
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [error, setError] = useState("");

  // Status filter for both tabs
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const activeFestivalsCount = festivals.filter(isFestivalActive).length;
  const inactiveFestivalsCount = festivals.filter((f) => !isFestivalActive(f)).length;
  const filteredFestivals = festivals.filter((f) => {
    if (statusFilter === "active") return isFestivalActive(f);
    if (statusFilter === "inactive") return !isFestivalActive(f);
    return true;
  });

  const activeEventsCount = events.filter(isEventActive).length;
  const inactiveEventsCount = events.filter((e) => !isEventActive(e)).length;
  const filteredEvents = events.filter((e) => {
    if (statusFilter === "active") return isEventActive(e);
    if (statusFilter === "inactive") return !isEventActive(e);
    return true;
  });

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) {
        setFestivals(c.festivals || []);
        setEvents(c.events || []);
        setPoojas(c.poojas || []);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  // ---------------- FESTIVALS MANAGEMENT ----------------
  const validateFestival = (): string | null => {
    if (!festivalDraft.name.trim() || !festivalDraft.id.trim()) {
      return "Festival name and ID are required.";
    }
    if (!/^[a-z0-9-]+$/.test(festivalDraft.id.trim())) {
      return "Festival ID must be lowercase letters, numbers and dashes only.";
    }
    if (!festivalDraft.heroTitle.trim() || !festivalDraft.heroSubtitle.trim()) {
      return "Hero title and subtitle are required.";
    }
    if (
      festivals.some(
        (f) => f.id === festivalDraft.id.trim() && f.id !== editingFestival
      )
    ) {
      return "Another festival already uses this ID.";
    }
    return null;
  };

  const toFestivalSpec = (): FestivalEvent => ({
    id: festivalDraft.id.trim(),
    name: festivalDraft.name.trim(),
    hindiName: festivalDraft.hindiName.trim() || undefined,
    teluguName: festivalDraft.teluguName.trim() || undefined,
    tamilName: festivalDraft.tamilName.trim() || undefined,
    badge: festivalDraft.badge.trim() || "🪔 UPCOMING FESTIVAL",
    hindiBadge: festivalDraft.hindiBadge.trim() || undefined,
    teluguBadge: festivalDraft.teluguBadge.trim() || undefined,
    tamilBadge: festivalDraft.tamilBadge.trim() || undefined,
    heroTitle: festivalDraft.heroTitle.trim(),
    hindiHeroTitle: festivalDraft.hindiHeroTitle.trim() || undefined,
    teluguHeroTitle: festivalDraft.teluguHeroTitle.trim() || undefined,
    tamilHeroTitle: festivalDraft.tamilHeroTitle.trim() || undefined,
    heroSubtitle: festivalDraft.heroSubtitle.trim(),
    hindiHeroSubtitle: festivalDraft.hindiHeroSubtitle.trim() || undefined,
    teluguHeroSubtitle: festivalDraft.teluguHeroSubtitle.trim() || undefined,
    tamilHeroSubtitle: festivalDraft.tamilHeroSubtitle.trim() || undefined,
    startDate: festivalDraft.startDate.trim() || undefined,
    endDate: festivalDraft.endDate.trim() || undefined,
    daysFromToday: festivalDraft.daysFromToday.trim()
      ? Number(festivalDraft.daysFromToday.trim())
      : 7,
    durationDays: festivalDraft.durationDays.trim()
      ? Number(festivalDraft.durationDays.trim())
      : 9,
    heroImage: festivalDraft.heroImage.trim() || undefined,
    relatedPoojaSlugs: festivalDraft.relatedPoojaSlugs,
    ctaText: festivalDraft.ctaText.trim() || "Book Festival Puja",
    hindiCtaText: festivalDraft.hindiCtaText.trim() || undefined,
    teluguCtaText: festivalDraft.teluguCtaText.trim() || undefined,
    tamilCtaText: festivalDraft.tamilCtaText.trim() || undefined,
    ctaLink: festivalDraft.ctaLink.trim() || "#poojas",
    secondaryCtaText: festivalDraft.secondaryCtaText.trim() || "Explore All Pujas",
    hindiSecondaryCtaText: festivalDraft.hindiSecondaryCtaText.trim() || undefined,
    teluguSecondaryCtaText: festivalDraft.teluguSecondaryCtaText.trim() || undefined,
    tamilSecondaryCtaText: festivalDraft.tamilSecondaryCtaText.trim() || undefined,
    secondaryCtaLink: festivalDraft.secondaryCtaLink.trim() || "#poojas",
    priority: festivalDraft.priority.trim() ? Number(festivalDraft.priority.trim()) : 1,
    active: festivalDraft.active,
  });

  const [isTranslatingFest, setIsTranslatingFest] = useState(false);
  const [activeFestLangTab, setActiveFestLangTab] = useState<"hi" | "te" | "ta">("hi");

  const handleAutoTranslateFestival = async () => {
    if (!festivalDraft.heroTitle.trim() && !festivalDraft.name.trim()) {
      setError("Please fill in the English Festival Name or Hero Title first.");
      return;
    }
    setIsTranslatingFest(true);
    setError("");
    try {
      const textsToTranslate = [
        festivalDraft.name.trim(),
        festivalDraft.badge.trim() || "UPCOMING FESTIVAL",
        festivalDraft.heroTitle.trim(),
        festivalDraft.heroSubtitle.trim(),
        festivalDraft.ctaText.trim() || "Book Festival Puja",
        festivalDraft.secondaryCtaText.trim() || "Explore All Pujas",
      ];

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: textsToTranslate, targets: ["hi", "te", "ta"] }),
      });
      const data = await res.json();
      if (data.ok && data.translations) {
        const hi = data.translations.hi || [];
        const te = data.translations.te || [];
        const ta = data.translations.ta || [];

        setFestivalDraft((prev) => ({
          ...prev,
          hindiName: hi[0] || prev.hindiName,
          teluguName: te[0] || prev.teluguName,
          tamilName: ta[0] || prev.tamilName,
          hindiBadge: hi[1] ? `🪔 ${hi[1].replace(/^[^\w\u0900-\u097F]+/, "").trim()}` : prev.hindiBadge,
          teluguBadge: te[1] ? `🪔 ${te[1].replace(/^[^\w\u0C00-\u0C7F]+/, "").trim()}` : prev.teluguBadge,
          tamilBadge: ta[1] ? `🪔 ${ta[1].replace(/^[^\w\u0B80-\u0BFF]+/, "").trim()}` : prev.tamilBadge,
          hindiHeroTitle: hi[2] || prev.hindiHeroTitle,
          teluguHeroTitle: te[2] || prev.teluguHeroTitle,
          tamilHeroTitle: ta[2] || prev.tamilHeroTitle,
          hindiHeroSubtitle: hi[3] || prev.hindiHeroSubtitle,
          teluguHeroSubtitle: te[3] || prev.teluguHeroSubtitle,
          tamilHeroSubtitle: ta[3] || prev.tamilHeroSubtitle,
          hindiCtaText: hi[4] || prev.hindiCtaText,
          teluguCtaText: te[4] || prev.teluguCtaText,
          tamilCtaText: ta[4] || prev.tamilCtaText,
          hindiSecondaryCtaText: hi[5] || prev.hindiSecondaryCtaText,
          teluguSecondaryCtaText: te[5] || prev.teluguSecondaryCtaText,
          tamilSecondaryCtaText: ta[5] || prev.tamilSecondaryCtaText,
        }));
      } else {
        setError(data.error || "Translation API was unable to translate festival.");
      }
    } catch (e) {
      console.error("[EventsManager] Festival translate error:", e);
      setError("Failed to communicate with translation API.");
    } finally {
      setIsTranslatingFest(false);
    }
  };

  const saveFestival = async () => {
    const problem = validateFestival();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const spec = toFestivalSpec();
    const next = editingFestival
      ? festivals.map((f) => (f.id === editingFestival ? spec : f))
      : [...festivals, spec];

    const res = await saveCatalogSection("festivals", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not save festival changes.");
      return;
    }
    setFestivals(next);
    setAddingFestival(false);
    setEditingFestival(null);
    setFestivalDraft(emptyFestivalDraft);
  };

  const toggleFestivalActive = async (f: FestivalEvent) => {
    const next = festivals.map((x) =>
      x.id === f.id ? { ...x, active: !isFestivalActive(x) } : x
    );
    const res = await saveCatalogSection("festivals", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not update festival.");
      return;
    }
    setError("");
    setFestivals(next);
  };

  const removeFestival = async (id: string) => {
    if (!window.confirm(`Delete festival "${id}"?`)) return;
    const next = festivals.filter((f) => f.id !== id);
    const res = await saveCatalogSection("festivals", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not delete festival.");
      return;
    }
    setFestivals(next);
  };

  const resetFestivals = async () => {
    if (
      !window.confirm(
        "Reset the festivals list to the default seed? Any custom changes will be lost."
      )
    ) {
      return;
    }
    const res = await resetCatalogSection("festivals", token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not reset festivals.");
      return;
    }
    const c = await fetchCatalog();
    setFestivals(c.festivals);
  };

  // ---------------- SCHEDULED EVENTS MANAGEMENT ----------------
  const validateEvent = (): string | null => {
    if (!eventDraft.title.trim() || !eventDraft.slug.trim()) {
      return "Title and slug are required.";
    }
    if (!/^[a-z0-9-]+$/.test(eventDraft.slug.trim())) {
      return "Slug must be lowercase letters, numbers and dashes only.";
    }
    const days = Number(eventDraft.daysFromToday);
    if (Number.isNaN(days) || days < 0) {
      return "Days from today must be 0 or more.";
    }
    if (!eventDraft.time.trim() || !eventDraft.price.trim()) {
      return "Time and price are required.";
    }
    const cap = Number(eventDraft.capacity);
    if (eventDraft.capacity.trim() && (!Number.isInteger(cap) || cap < 1)) {
      return "Capacity must be a whole number of 1 or more (leave blank for unlimited).";
    }
    if (
      events.some(
        (e) =>
          e.slug.trim().toLowerCase() === eventDraft.slug.trim().toLowerCase() &&
          e.slug.trim().toLowerCase() !== editingEvent?.trim().toLowerCase()
      )
    ) {
      return "Another event already uses this slug.";
    }
    return null;
  };

  const toEventSpec = (): UpcomingEventSpec => ({
    title: eventDraft.title.trim(),
    slug: eventDraft.slug.trim(),
    daysFromToday: Number(eventDraft.daysFromToday),
    time: eventDraft.time.trim(),
    seats: eventDraft.seats.trim() || "Open",
    capacity: eventDraft.capacity.trim() ? Number(eventDraft.capacity.trim()) : undefined,
    live: eventDraft.live,
    price: eventDraft.price.trim(),
    emoji: eventDraft.emoji.trim() || "🪔",
    gradient: eventDraft.gradient,
  });

  const saveEvent = async () => {
    const problem = validateEvent();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const spec = toEventSpec();
    const next = editingEvent
      ? events.map((e) => (e.slug === editingEvent ? spec : e))
      : [...events, spec];
    const res = await saveCatalogSection("events", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not save event changes.");
      return;
    }
    setEvents(next);
    setAddingEvent(false);
    setEditingEvent(null);
    setEventDraft(emptyEventDraft);
  };

  const toggleEventActive = async (e: UpcomingEventSpec) => {
    const next = events.map((x) =>
      x.slug === e.slug ? { ...x, active: !isEventActive(x) } : x
    );
    const res = await saveCatalogSection("events", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not update the event.");
      return;
    }
    setError("");
    setEvents(next);
  };

  const removeEvent = async (slug: string) => {
    if (!window.confirm(`Delete event "${slug}" from the schedule?`)) return;
    const next = events.filter((e) => e.slug !== slug);
    const res = await saveCatalogSection("events", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not delete the event.");
      return;
    }
    setEvents(next);
  };

  const resetEvents = async () => {
    if (
      !window.confirm(
        "Reset the events schedule to the default list? Any admin changes will be lost."
      )
    ) {
      return;
    }
    const res = await resetCatalogSection("events", token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not reset the schedule.");
      return;
    }
    const c = await fetchCatalog();
    setEvents(c.events);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Festivals & Hero Campaigns vs Scheduled Rituals */}
      <div className="flex items-center gap-2 border-b border-saffron-200 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("festivals");
            setError("");
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "festivals"
              ? "bg-saffron-600 text-white shadow-soft"
              : "bg-white text-ink-soft hover:bg-saffron-50 hover:text-saffron-700"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Upcoming Festivals & Hero Campaigns ({festivals.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("events");
            setError("");
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "events"
              ? "bg-saffron-600 text-white shadow-soft"
              : "bg-white text-ink-soft hover:bg-saffron-50 hover:text-saffron-700"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Scheduled Live Rituals ({events.length})
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* ======================= FESTIVALS TAB ======================= */}
      {activeTab === "festivals" && (
        <>
          <ManagerHeader
            title="Festivals & Top Hero Campaigns"
            subtitle="Configure upcoming Hindu festivals and seasonal campaigns displayed in the homepage hero carousel."
            onAdd={() => {
              setFestivalDraft(emptyFestivalDraft);
              setEditingFestival(null);
              setAddingFestival(true);
              setError("");
            }}
            onReset={resetFestivals}
            addLabel="Add Festival"
          />

          {/* Festival Edit/Add Form Modal */}
          {(addingFestival || editingFestival) && (
            <div className="rounded-2xl border-2 border-saffron-300 bg-white p-5 shadow-card space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-saffron-100 pb-3">
                <h3 className="font-display text-base font-bold text-ink">
                  {editingFestival ? `Edit Festival (${editingFestival})` : "New Festival Campaign"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAddingFestival(false);
                    setEditingFestival(null);
                    setFestivalDraft(emptyFestivalDraft);
                  }}
                  className="rounded-lg p-1 text-ink-soft hover:bg-saffron-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Festival Name (e.g. Navratri 2026)">
                  <TextInput
                    value={festivalDraft.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({
                        ...d,
                        name: v,
                        id: d.id || v.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      }));
                    }}
                    placeholder="Navratri 2026"
                  />
                </Field>

                <Field label="Unique ID / Slug">
                  <TextInput
                    value={festivalDraft.id}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({ ...d, id: v }));
                    }}
                    placeholder="navratri-2026"
                    disabled={Boolean(editingFestival)}
                  />
                </Field>

                <Field label="Hero Badge (e.g. 🪔 UPCOMING FESTIVAL)">
                  <TextInput
                    value={festivalDraft.badge}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({ ...d, badge: v }));
                    }}
                    placeholder="🪔 UPCOMING FESTIVAL"
                  />
                </Field>

                <Field label="Display Priority (1 = Highest)">
                  <NumberInput
                    value={festivalDraft.priority}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({ ...d, priority: v }));
                    }}
                    placeholder="1"
                    min={1}
                  />
                </Field>

                <Field label="Hero Title" className="md:col-span-2">
                  <TextInput
                    value={festivalDraft.heroTitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({ ...d, heroTitle: v }));
                    }}
                    placeholder="Celebrate Navratri with Divine Pujas"
                  />
                </Field>

                <Field label="Hero Subtitle / Description" className="md:col-span-2">
                  <textarea
                    value={festivalDraft.heroSubtitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({ ...d, heroSubtitle: v }));
                    }}
                    rows={2}
                    className="w-full rounded-xl border border-saffron-200 p-2.5 text-xs text-ink focus:border-saffron-500 focus:outline-none"
                    placeholder="Book authentic Navratri Pujas from trusted temples and bring divine blessings to your home."
                  />
                </Field>

                <Field label="Festival Start Date (Calendar)" hint="Pick start date from calendar">
                  <DateInput
                    value={festivalDraft.startDate}
                    onChange={(val) => {
                      setFestivalDraft((d) => {
                        const next = { ...d, startDate: val };
                        if (val) {
                          next.daysFromToday = String(dateToDaysFromToday(val));
                          if (next.endDate) {
                            const s = new Date(val + "T00:00:00");
                            const e = new Date(next.endDate + "T00:00:00");
                            const diff = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
                            next.durationDays = String(diff);
                          }
                        }
                        return next;
                      });
                    }}
                    placeholder="Select festival start date"
                  />
                </Field>

                <Field label="Festival End Date (Calendar)" hint="Pick end date from calendar">
                  <DateInput
                    value={festivalDraft.endDate}
                    min={festivalDraft.startDate}
                    onChange={(val) => {
                      setFestivalDraft((d) => {
                        const next = { ...d, endDate: val };
                        if (val && next.startDate) {
                          const s = new Date(next.startDate + "T00:00:00");
                          const e = new Date(val + "T00:00:00");
                          const diff = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
                          next.durationDays = String(diff);
                        }
                        return next;
                      });
                    }}
                    placeholder="Select festival end date"
                  />
                </Field>

                <Field label="Starts In (Days from Today)" hint="Auto-synced with start date">
                  <NumberInput
                    value={festivalDraft.daysFromToday}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => {
                        const next = { ...d, daysFromToday: v };
                        if (v !== "") {
                          next.startDate = daysFromTodayToDate(v);
                          if (next.durationDays) {
                            next.endDate = daysFromTodayToDate(Number(v) + Number(next.durationDays));
                          }
                        }
                        return next;
                      });
                    }}
                    placeholder="7"
                    min={0}
                  />
                </Field>

                <Field label="Festival Duration (Days)" hint="Auto-synced with end date">
                  <NumberInput
                    value={festivalDraft.durationDays}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => {
                        const next = { ...d, durationDays: v };
                        if (v !== "" && next.startDate) {
                          const s = new Date(next.startDate + "T00:00:00");
                          s.setDate(s.getDate() + Math.max(0, Number(v) - 1));
                          const year = s.getFullYear();
                          const month = String(s.getMonth() + 1).padStart(2, "0");
                          const day = String(s.getDate()).padStart(2, "0");
                          next.endDate = `${year}-${month}-${day}`;
                        }
                        return next;
                      });
                    }}
                    placeholder="9"
                    min={1}
                  />
                </Field>

                <Field label="Primary CTA Button Text">
                  <TextInput
                    value={festivalDraft.ctaText}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({ ...d, ctaText: v }));
                    }}
                    placeholder="Book Navratri Puja"
                  />
                </Field>

                <Field label="Primary CTA Destination (e.g. /book/durga-saptashati-path or #poojas)">
                  <TextInput
                    value={festivalDraft.ctaLink}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({ ...d, ctaLink: v }));
                    }}
                    placeholder="/book/durga-saptashati-path"
                  />
                </Field>

                <Field label="Hero Background Image URL" className="md:col-span-2">
                  <TextInput
                    value={festivalDraft.heroImage}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFestivalDraft((d) => ({ ...d, heroImage: v }));
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </Field>

                {/* Related Pujas Selection */}
                <Field label="Associated Pujas (Quick booking chips)" className="md:col-span-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-saffron-100 rounded-xl bg-saffron-50/30">
                    {poojas.map((p) => {
                      const isSelected = festivalDraft.relatedPoojaSlugs.includes(p.slug);
                      return (
                        <button
                          key={p.slug}
                          type="button"
                          onClick={() => {
                            setFestivalDraft((d) => ({
                              ...d,
                              relatedPoojaSlugs: isSelected
                                ? d.relatedPoojaSlugs.filter((s) => s !== p.slug)
                                : [...d.relatedPoojaSlugs, p.slug],
                            }));
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-all ${
                            isSelected
                              ? "border border-saffron-500 bg-saffron-100 font-semibold text-saffron-900"
                              : "border border-slate-200 bg-white text-ink hover:bg-saffron-50"
                          }`}
                        >
                          <span>{p.emoji}</span>
                          <span className="truncate flex-1">{p.title}</span>
                          {isSelected && <span className="text-saffron-600 font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              {/* AI Auto-Translation Banner Button */}
              <div className="rounded-2xl border border-saffron-200/90 bg-gradient-to-r from-saffron-50 via-amber-50 to-cream p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-saffron-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-saffron-600 shrink-0" />
                      <span>1-Click AI Auto-Translation for Hero Festival</span>
                    </h5>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      Translates festival name, hero title, subtitle & buttons to Hindi, Telugu, and Tamil instantly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoTranslateFestival}
                    disabled={isTranslatingFest || (!festivalDraft.name.trim() && !festivalDraft.heroTitle.trim())}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-600 to-saffron-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:from-saffron-500 hover:to-saffron-600 disabled:opacity-50"
                  >
                    <Languages className="h-4 w-4" />
                    <span>{isTranslatingFest ? "Translating with AI…" : "Auto-Translate to 3 Languages"}</span>
                  </button>
                </div>
              </div>

              {/* Regional Language Tabs */}
              <div className="border border-saffron-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-saffron-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-saffron-600" />
                    <span className="text-xs font-bold text-ink">Regional Language Translations (Hero Content)</span>
                  </div>
                  <div className="flex rounded-lg bg-saffron-100/70 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveFestLangTab("hi")}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        activeFestLangTab === "hi"
                          ? "bg-white text-saffron-900 shadow-2xs font-bold"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      हिन्दी (HI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFestLangTab("te")}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        activeFestLangTab === "te"
                          ? "bg-white text-saffron-900 shadow-2xs font-bold"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      తెలుగు (TE)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFestLangTab("ta")}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        activeFestLangTab === "ta"
                          ? "bg-white text-saffron-900 shadow-2xs font-bold"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      தமிழ் (TA)
                    </button>
                  </div>
                </div>

                {activeFestLangTab === "hi" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Festival Name (हिन्दी)">
                        <TextInput
                          value={festivalDraft.hindiName}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, hindiName: e.target.value })}
                          placeholder="उदा. महा शिवरात्रि महापर्व"
                        />
                      </Field>
                      <Field label="Hero Badge (हिन्दी)">
                        <TextInput
                          value={festivalDraft.hindiBadge}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, hindiBadge: e.target.value })}
                          placeholder="उदा. 🪔 आगामी पावन पर्व"
                        />
                      </Field>
                    </div>
                    <Field label="Hero Title (हिन्दी)">
                      <TextInput
                        value={festivalDraft.hindiHeroTitle}
                        onChange={(e) => setFestivalDraft({ ...festivalDraft, hindiHeroTitle: e.target.value })}
                        placeholder="उदा. महा शिवरात्रि 2026: 12 ज्योतिर्लिंगों से दिव्य आशीर्वाद"
                      />
                    </Field>
                    <Field label="Hero Subtitle (हिन्दी)">
                      <TextInput
                        value={festivalDraft.hindiHeroSubtitle}
                        onChange={(e) => setFestivalDraft({ ...festivalDraft, hindiHeroSubtitle: e.target.value })}
                        placeholder="उदा. भगवान शिव के पावन पर्व पर अपने व परिवार के नाम से विशेष रुद्राभिषेक कराएं..."
                      />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Primary Button Text (हिन्दी)">
                        <TextInput
                          value={festivalDraft.hindiCtaText}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, hindiCtaText: e.target.value })}
                          placeholder="उदा. पर्व पूजा बुक करें"
                        />
                      </Field>
                      <Field label="Secondary Button Text (हिन्दी)">
                        <TextInput
                          value={festivalDraft.hindiSecondaryCtaText}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, hindiSecondaryCtaText: e.target.value })}
                          placeholder="उदा. सभी पूजाएं देखें"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {activeFestLangTab === "te" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Festival Name (తెలుగు)">
                        <TextInput
                          value={festivalDraft.teluguName}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, teluguName: e.target.value })}
                          placeholder="ఉదా. మహా శివరాత్రి మహోత్సవం"
                        />
                      </Field>
                      <Field label="Hero Badge (తెలుగు)">
                        <TextInput
                          value={festivalDraft.teluguBadge}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, teluguBadge: e.target.value })}
                          placeholder="ఉదా. 🪔 రాబోయే పవిత్ర పండుగ"
                        />
                      </Field>
                    </div>
                    <Field label="Hero Title (తెలుగు)">
                      <TextInput
                        value={festivalDraft.teluguHeroTitle}
                        onChange={(e) => setFestivalDraft({ ...festivalDraft, teluguHeroTitle: e.target.value })}
                        placeholder="ఉదా. మహా శివరాత్రి 2026: 12 జ్యోతిర్లింగాల నుండి దివ్య ఆశీస్సులు"
                      />
                    </Field>
                    <Field label="Hero Subtitle (తెలుగు)">
                      <TextInput
                        value={festivalDraft.teluguHeroSubtitle}
                        onChange={(e) => setFestivalDraft({ ...festivalDraft, teluguHeroSubtitle: e.target.value })}
                        placeholder="ఉదా. పరమశివుని పవిత్ర పర్వదినాన మీ మరియు మీ కుటుంబం పేరిట ప్రత్యేక రుద్రాభిషేకం..."
                      />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Primary Button Text (తెలుగు)">
                        <TextInput
                          value={festivalDraft.teluguCtaText}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, teluguCtaText: e.target.value })}
                          placeholder="ఉదా. పండుగ పూజ బుక్ చేయండి"
                        />
                      </Field>
                      <Field label="Secondary Button Text (తెలుగు)">
                        <TextInput
                          value={festivalDraft.teluguSecondaryCtaText}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, teluguSecondaryCtaText: e.target.value })}
                          placeholder="ఉదా. అన్ని పూజలను చూడండి"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {activeFestLangTab === "ta" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Festival Name (தமிழ்)">
                        <TextInput
                          value={festivalDraft.tamilName}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, tamilName: e.target.value })}
                          placeholder="उदा. மகா சிவராத்திரி பெருவிழா"
                        />
                      </Field>
                      <Field label="Hero Badge (தமிழ்)">
                        <TextInput
                          value={festivalDraft.tamilBadge}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, tamilBadge: e.target.value })}
                          placeholder="उदा. 🪔 வரவிருக்கும் திருவிழா"
                        />
                      </Field>
                    </div>
                    <Field label="Hero Title (தமிழ்)">
                      <TextInput
                        value={festivalDraft.tamilHeroTitle}
                        onChange={(e) => setFestivalDraft({ ...festivalDraft, tamilHeroTitle: e.target.value })}
                        placeholder="उदा. மகா சிவராத்திரி 2026: 12 ஜோதிர்லிங்கங்களிலிருந்து தெய்வீக ஆசிகள்"
                      />
                    </Field>
                    <Field label="Hero Subtitle (தமிழ்)">
                      <TextInput
                        value={festivalDraft.tamilHeroSubtitle}
                        onChange={(e) => setFestivalDraft({ ...festivalDraft, tamilHeroSubtitle: e.target.value })}
                        placeholder="उदा. சிவபெருமானின் புனித நாளில் உங்களுக்கும் உங்கள் குடும்பத்தினருக்கும் ருத்ராபிஷேகம்..."
                      />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Primary Button Text (தமிழ்)">
                        <TextInput
                          value={festivalDraft.tamilCtaText}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, tamilCtaText: e.target.value })}
                          placeholder="उदा. திருவிழா பூஜை பதிவு செய்க"
                        />
                      </Field>
                      <Field label="Secondary Button Text (தமிழ்)">
                        <TextInput
                          value={festivalDraft.tamilSecondaryCtaText}
                          onChange={(e) => setFestivalDraft({ ...festivalDraft, tamilSecondaryCtaText: e.target.value })}
                          placeholder="उदा. அனைத்து பூஜைகளையும் காண்க"
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-saffron-100 pt-3">
                <Toggle
                  label="Active in Hero Carousel"
                  checked={festivalDraft.active}
                  onChange={(v) => setFestivalDraft((d) => ({ ...d, active: v }))}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingFestival(false);
                      setEditingFestival(null);
                      setFestivalDraft(emptyFestivalDraft);
                    }}
                    className="btn-outline !py-2 !px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveFestival}
                    className="btn-primary !py-2 !px-5 text-xs"
                  >
                    {editingFestival ? "Save Changes" : "Create Festival"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-saffron-100/70 pb-3">
            <div className="flex items-center gap-1 rounded-xl bg-cream/70 p-1 border border-saffron-100 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white text-saffron-800 shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All ({festivals.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Active ({activeFestivalsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  statusFilter === "inactive"
                    ? "bg-white text-slate-700 shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Inactive ({inactiveFestivalsCount})
              </button>
            </div>
          </div>

          {/* Festivals Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFestivals.length === 0 ? (
              <p className="col-span-full rounded-xl bg-saffron-50 px-4 py-8 text-center text-sm text-ink-soft">
                No {statusFilter !== "all" ? statusFilter : ""} festivals found.
              </p>
            ) : (
              filteredFestivals.map((fest) => {
              const status = getFestivalStatus(fest);
              const isActive = isFestivalActive(fest);

              return (
                <ManagerCard key={fest.id} active={isActive}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-600 bg-saffron-50 px-2 py-0.5 rounded-full">
                        Priority #{fest.priority ?? 1}
                      </span>
                      <h4 className="font-display text-base font-bold text-ink mt-1">
                        {fest.name}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        status.isLive
                          ? "bg-emerald-100 text-emerald-800"
                          : status.isUpcoming
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {status.isLive ? "🔴 Live Now" : status.countdownText}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-ink line-clamp-1">
                    {fest.heroTitle}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-soft line-clamp-2">
                    {fest.heroSubtitle}
                  </p>

                  {/* Associated Pujas Count */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-ink-soft border-t border-saffron-50 pt-2">
                    <span>{fest.relatedPoojaSlugs?.length || 0} Associated Pujas</span>
                    <span>CTA: {fest.ctaText}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-between border-t border-saffron-100 pt-3">
                    <button
                      type="button"
                      onClick={() => toggleFestivalActive(fest)}
                      className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
                    >
                      {isActive ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFestivalDraft({
                            id: fest.id,
                            name: fest.name,
                            hindiName: fest.hindiName || "",
                            teluguName: fest.teluguName || "",
                            tamilName: fest.tamilName || "",
                            badge: fest.badge || "🪔 UPCOMING FESTIVAL",
                            hindiBadge: fest.hindiBadge || "",
                            teluguBadge: fest.teluguBadge || "",
                            tamilBadge: fest.tamilBadge || "",
                            heroTitle: fest.heroTitle,
                            hindiHeroTitle: fest.hindiHeroTitle || "",
                            teluguHeroTitle: fest.teluguHeroTitle || "",
                            tamilHeroTitle: fest.tamilHeroTitle || "",
                            heroSubtitle: fest.heroSubtitle,
                            hindiHeroSubtitle: fest.hindiHeroSubtitle || "",
                            teluguHeroSubtitle: fest.teluguHeroSubtitle || "",
                            tamilHeroSubtitle: fest.tamilHeroSubtitle || "",
                            startDate: fest.startDate ? toISODateString(fest.startDate) : daysFromTodayToDate(fest.daysFromToday ?? 7),
                            endDate: fest.endDate ? toISODateString(fest.endDate) : daysFromTodayToDate((fest.daysFromToday ?? 7) + (fest.durationDays ?? 9)),
                            daysFromToday: String(fest.daysFromToday ?? 7),
                            durationDays: String(fest.durationDays ?? 9),
                            heroImage: fest.heroImage || "",
                            relatedPoojaSlugs: fest.relatedPoojaSlugs || [],
                            ctaText: fest.ctaText || "Book Festival Puja",
                            hindiCtaText: fest.hindiCtaText || "",
                            teluguCtaText: fest.teluguCtaText || "",
                            tamilCtaText: fest.tamilCtaText || "",
                            ctaLink: fest.ctaLink || "#poojas",
                            secondaryCtaText: fest.secondaryCtaText || "Explore All Pujas",
                            hindiSecondaryCtaText: fest.hindiSecondaryCtaText || "",
                            teluguSecondaryCtaText: fest.teluguSecondaryCtaText || "",
                            tamilSecondaryCtaText: fest.tamilSecondaryCtaText || "",
                            secondaryCtaLink: fest.secondaryCtaLink || "#poojas",
                            priority: String(fest.priority ?? 1),
                            active: fest.active !== false,
                          });
                          setEditingFestival(fest.id);
                          setAddingFestival(false);
                          setError("");
                        }}
                        className="rounded-lg p-1.5 text-ink-soft hover:bg-saffron-100 hover:text-saffron-700"
                        title="Edit Festival"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFestival(fest.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        title="Delete Festival"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </ManagerCard>
              );
            }))}
          </div>
        </>
      )}

      {/* ======================= SCHEDULED EVENTS TAB ======================= */}
      {activeTab === "events" && (
        <>
          <ManagerHeader
            title="Live Scheduled Rituals"
            subtitle="Manage timed auspicious muhurat events displayed in the carousel feed."
            onAdd={() => {
              setEventDraft(emptyEventDraft);
              setEditingEvent(null);
              setAddingEvent(true);
              setError("");
            }}
            onReset={resetEvents}
            addLabel="Add Ritual Event"
          />

          {(addingEvent || editingEvent) && (
            <div className="rounded-2xl border-2 border-saffron-300 bg-white p-5 shadow-card space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-saffron-100 pb-3">
                <h3 className="font-display text-base font-bold text-ink">
                  {editingEvent ? `Edit Event (${editingEvent})` : "New Live Ritual"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAddingEvent(false);
                    setEditingEvent(null);
                    setEventDraft(emptyEventDraft);
                  }}
                  className="rounded-lg p-1 text-ink-soft hover:bg-saffron-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Event Title">
                  <TextInput
                    value={eventDraft.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEventDraft((d) => ({
                        ...d,
                        title: v,
                        slug: d.slug || v.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      }));
                    }}
                    placeholder="Hanuman Pooja"
                  />
                </Field>

                <Field label="Pooja Slug">
                  <TextInput
                    value={eventDraft.slug}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEventDraft((d) => ({ ...d, slug: v }));
                    }}
                    placeholder="hanuman-pooja"
                  />
                </Field>

                <Field label="Event Date (Calendar)" hint="Pick ritual date directly from calendar">
                  <DateInput
                    value={eventDraft.daysFromToday ? daysFromTodayToDate(eventDraft.daysFromToday) : ""}
                    onChange={(val) => {
                      if (!val) {
                        setEventDraft((d) => ({ ...d, daysFromToday: "" }));
                      } else {
                        const days = dateToDaysFromToday(val);
                        setEventDraft((d) => ({ ...d, daysFromToday: String(days) }));
                      }
                    }}
                    placeholder="Select event date from calendar"
                  />
                </Field>

                <Field label="Days from Today" hint="Auto-synced with calendar date">
                  <NumberInput
                    value={eventDraft.daysFromToday}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEventDraft((d) => ({ ...d, daysFromToday: v }));
                    }}
                    placeholder="7"
                    min={0}
                  />
                </Field>

                <Field label="Time (IST)">
                  <TextInput
                    value={eventDraft.time}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEventDraft((d) => ({ ...d, time: v }));
                    }}
                    placeholder="7:00 PM IST"
                  />
                </Field>

                <Field label="Dakshina / Price">
                  <TextInput
                    value={eventDraft.price}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEventDraft((d) => ({ ...d, price: v }));
                    }}
                    placeholder="₹1,001"
                  />
                </Field>

                <Field label="Seats Capacity">
                  <NumberInput
                    value={eventDraft.capacity}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEventDraft((d) => ({ ...d, capacity: v }));
                    }}
                    placeholder="25"
                    min={1}
                  />
                </Field>

                <Field label="Emoji">
                  <TextInput
                    value={eventDraft.emoji}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEventDraft((d) => ({ ...d, emoji: v }));
                    }}
                    placeholder="🪔"
                  />
                </Field>

                <Field label="Gradient Accent">
                  <GradientPicker
                    value={eventDraft.gradient}
                    onChange={(v) => setEventDraft((d) => ({ ...d, gradient: v }))}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between border-t border-saffron-100 pt-3">
                <Toggle
                  label="Live Stream Available"
                  checked={eventDraft.live}
                  onChange={(v) => setEventDraft((d) => ({ ...d, live: v }))}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingEvent(false);
                      setEditingEvent(null);
                      setEventDraft(emptyEventDraft);
                    }}
                    className="btn-outline !py-2 !px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEvent}
                    className="btn-primary !py-2 !px-5 text-xs"
                  >
                    {editingEvent ? "Save Changes" : "Create Event"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-saffron-100/70 pb-3">
            <div className="flex items-center gap-1 rounded-xl bg-cream/70 p-1 border border-saffron-100 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white text-saffron-800 shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Active ({activeEventsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  statusFilter === "inactive"
                    ? "bg-white text-slate-700 shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Inactive ({inactiveEventsCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.length === 0 ? (
              <p className="col-span-full rounded-xl bg-saffron-50 px-4 py-8 text-center text-sm text-ink-soft">
                No {statusFilter !== "all" ? statusFilter : ""} live rituals found.
              </p>
            ) : (
              filteredEvents.map((e) => {
                const isActive = isEventActive(e);
                return (
                  <ManagerCard key={e.slug} active={isActive}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{e.emoji}</span>
                      <h4 className="font-display text-sm font-bold text-ink">{e.title}</h4>
                    </div>
                    <span className="text-xs font-bold text-saffron-700">{e.price}</span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-ink-soft">
                    <p>In {e.daysFromToday} days • {e.time}</p>
                    <p>{seatsLabel(e)}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-saffron-100 pt-3">
                    <button
                      type="button"
                      onClick={() => toggleEventActive(e)}
                      className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
                    >
                      {isActive ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEventDraft({
                            title: e.title,
                            slug: e.slug,
                            daysFromToday: String(e.daysFromToday),
                            time: e.time,
                            seats: e.seats,
                            capacity: e.capacity ? String(e.capacity) : "",
                            live: e.live,
                            price: e.price,
                            emoji: e.emoji,
                            gradient: e.gradient,
                          });
                          setEditingEvent(e.slug);
                          setAddingEvent(false);
                          setError("");
                        }}
                        className="rounded-lg p-1.5 text-ink-soft hover:bg-saffron-100 hover:text-saffron-700"
                        title="Edit Event"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeEvent(e.slug)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        title="Delete Event"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </ManagerCard>
              );
            }))}
          </div>
        </>
      )}
    </div>
  );
}
