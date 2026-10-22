"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LayoutTemplate,
  Sparkles,
  Megaphone,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RotateCcw,
  Languages,
  Eye,
  EyeOff,
  Pencil,
  X,
  Flame,
  ArrowRight,
} from "lucide-react";
import { fetchCatalog, saveCatalogSection, resetCatalogSection } from "@/lib/api";
import {
  DEFAULT_SITE_CONTENT,
  type SiteContent,
  type TickerItem,
  type VedicAssuranceItem,
  type HeroContentConfig,
} from "@/lib/cms-types";
import type { Pooja } from "@/lib/data";
import {
  translateFieldsToAllLanguages,
  translateTextToAllLanguages,
  type SupportedLocale,
} from "@/lib/translate-client";
import {
  Field,
  ManagerCard,
  ManagerHeader,
  SelectInput,
  TextAreaInput,
  TextInput,
  Toggle,
} from "./manager-ui";

type CmsSubTab = "announcement" | "hero" | "assurances" | "footer";

export default function CmsManager({
  token,
  onAuthError,
  onRefresh,
}: {
  token: string;
  onAuthError: () => void;
  onRefresh?: () => void;
}) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [activeTab, setActiveTab] = useState<CmsSubTab>("announcement");
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Announcement Strip draft states
  const [newTickerIcon, setNewTickerIcon] = useState("🙏");
  const [newTickerLabel, setNewTickerLabel] = useState("");
  const [newTickerHindi, setNewTickerHindi] = useState("");
  const [newTickerTelugu, setNewTickerTelugu] = useState("");
  const [newTickerTamil, setNewTickerTamil] = useState("");
  const [isTranslatingTicker, setIsTranslatingTicker] = useState(false);

  // Hero section multi-language states
  const [heroLangTab, setHeroLangTab] = useState<SupportedLocale>("en");
  const [isTranslatingHero, setIsTranslatingHero] = useState(false);

  // Vedic Assurances multi-language states
  const [assurancesLangTab, setAssurancesLangTab] = useState<SupportedLocale>("en");
  const [isTranslatingAssurances, setIsTranslatingAssurances] = useState(false);
  const [editingAssuranceIdx, setEditingAssuranceIdx] = useState<number | null>(null);
  const [editingAssuranceDraft, setEditingAssuranceDraft] = useState<VedicAssuranceItem | null>(null);
  const [assuranceItemLangTab, setAssuranceItemLangTab] = useState<SupportedLocale>("en");
  const [isTranslatingAssuranceItem, setIsTranslatingAssuranceItem] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const c = await fetchCatalog();
      if (c.siteContent) {
        setContent({
          announcementStrip: {
            enabled: c.siteContent.announcementStrip?.enabled !== false,
            items: c.siteContent.announcementStrip?.items || DEFAULT_SITE_CONTENT.announcementStrip?.items,
          },
          hero: {
            ...DEFAULT_SITE_CONTENT.hero,
            ...c.siteContent.hero,
          },
          vedicAssurances: {
            ...DEFAULT_SITE_CONTENT.vedicAssurances,
            ...c.siteContent.vedicAssurances,
          },
          footer: {
            ...DEFAULT_SITE_CONTENT.footer,
            ...c.siteContent.footer,
          },
        });
      }
      if (c.poojas) {
        setPoojas(c.poojas);
      }
    } catch {
      setError("Failed to load CMS content from server.");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (updatedContent: SiteContent) => {
    setIsSaving(true);
    setError("");
    try {
      const res = await saveCatalogSection("siteContent", updatedContent, token);
      if (!res.ok) {
        if (res.status === 401) {
          onAuthError();
          return;
        }
        setError(res.error || "Failed to save website content to MongoDB.");
        return;
      }
      setContent(updatedContent);
      setNotification("Website content successfully updated and published.");
      setTimeout(() => setNotification(""), 4000);
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to save content.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setIsSaving(true);
    setError("");
    try {
      const res = await resetCatalogSection("siteContent", token);
      if (!res.ok) {
        if (res.status === 401) onAuthError();
        setError(res.error || "Failed to reset website content.");
        return;
      }
      setContent(DEFAULT_SITE_CONTENT);
      setNotification("Website content reset to default configuration.");
      setTimeout(() => setNotification(""), 4000);
      setConfirmResetOpen(false);
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to reset content.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── 1. Announcement Marquee Strip Handlers ──
  const handleAutoTranslateTicker = async () => {
    const srcText =
      newTickerLabel.trim() ||
      newTickerHindi.trim() ||
      newTickerTelugu.trim() ||
      newTickerTamil.trim();
    if (!srcText) {
      setError("Please type text in at least one language to translate.");
      return;
    }

    const sourceLang: SupportedLocale = newTickerLabel.trim()
      ? "en"
      : newTickerHindi.trim()
      ? "hi"
      : newTickerTelugu.trim()
      ? "te"
      : "ta";

    setIsTranslatingTicker(true);
    setError("");
    try {
      const res = await translateTextToAllLanguages(srcText, sourceLang);
      setNewTickerLabel(res.en || srcText);
      setNewTickerHindi(res.hi || srcText);
      setNewTickerTelugu(res.te || srcText);
      setNewTickerTamil(res.ta || srcText);
      setNotification("✨ Announcement translated to all 4 languages!");
      setTimeout(() => setNotification(""), 3500);
    } catch {
      setError("Failed to translate announcement text.");
    } finally {
      setIsTranslatingTicker(false);
    }
  };

  const handleAddTickerItem = async () => {
    const primaryText =
      newTickerLabel.trim() ||
      newTickerHindi.trim() ||
      newTickerTelugu.trim() ||
      newTickerTamil.trim();
    if (!primaryText) return;

    let en = newTickerLabel.trim();
    let hi = newTickerHindi.trim();
    let te = newTickerTelugu.trim();
    let ta = newTickerTamil.trim();

    // Auto-translate if any language is missing
    if (!en || !hi || !te || !ta) {
      const sourceLang: SupportedLocale = en
        ? "en"
        : hi
        ? "hi"
        : te
        ? "te"
        : "ta";
      try {
        const res = await translateTextToAllLanguages(
          en || hi || te || ta,
          sourceLang
        );
        en = en || res.en || primaryText;
        hi = hi || res.hi || primaryText;
        te = te || res.te || primaryText;
        ta = ta || res.ta || primaryText;
      } catch (e) {
        console.warn("[CmsManager] Ticker auto-translate fallback:", e);
      }
    }

    const newItem: TickerItem = {
      icon: newTickerIcon.trim() || "🪔",
      label: en || primaryText,
      hindiLabel: hi || undefined,
      teluguLabel: te || undefined,
      tamilLabel: ta || undefined,
    };

    const updated = {
      ...content,
      announcementStrip: {
        ...content.announcementStrip,
        items: [...(content.announcementStrip?.items || []), newItem],
      },
    };
    handleSave(updated);
    setNewTickerLabel("");
    setNewTickerHindi("");
    setNewTickerTelugu("");
    setNewTickerTamil("");
  };

  const handleRemoveTickerItem = (index: number) => {
    const items = [...(content.announcementStrip?.items || [])];
    items.splice(index, 1);
    const updated = {
      ...content,
      announcementStrip: {
        ...content.announcementStrip,
        items,
      },
    };
    handleSave(updated);
  };

  // ── 2. Hero Content Synchronization Handlers ──
  const handleAutoTranslateHero = async (sourceLang: SupportedLocale = heroLangTab) => {
    const h = content.hero || {};
    let title = "";
    let titleHighlight = "";
    let subtitle = "";
    let badgeText = "";
    let ctaText = "";

    if (sourceLang === "en") {
      title = h.title || "";
      titleHighlight = h.titleHighlight || "";
      subtitle = h.subtitle || "";
      badgeText = h.badgeText || "";
      ctaText = h.ctaText || "";
    } else if (sourceLang === "hi") {
      title = h.hindiTitle || "";
      titleHighlight = h.hindiTitleHighlight || "";
      subtitle = h.hindiSubtitle || "";
      badgeText = h.hindiBadgeText || "";
      ctaText = h.hindiCtaText || "";
    } else if (sourceLang === "te") {
      title = h.teluguTitle || "";
      titleHighlight = h.teluguTitleHighlight || "";
      subtitle = h.teluguSubtitle || "";
      badgeText = h.teluguBadgeText || "";
      ctaText = h.teluguCtaText || "";
    } else {
      title = h.tamilTitle || "";
      titleHighlight = h.tamilTitleHighlight || "";
      subtitle = h.tamilSubtitle || "";
      badgeText = h.tamilBadgeText || "";
      ctaText = h.tamilCtaText || "";
    }

    if (!title && !subtitle) {
      // Fallback to English
      title = h.title || "";
      titleHighlight = h.titleHighlight || "";
      subtitle = h.subtitle || "";
      badgeText = h.badgeText || "";
      ctaText = h.ctaText || "";
      sourceLang = "en";
    }

    if (!title && !subtitle) {
      setError("Please enter a title or subtitle in at least one language to translate.");
      return;
    }

    setIsTranslatingHero(true);
    setError("");
    try {
      const res = await translateFieldsToAllLanguages(
        { title, titleHighlight, subtitle, badgeText, ctaText },
        sourceLang
      );

      const updatedHero: HeroContentConfig = {
        ...content.hero,
        title: sourceLang === "en" ? title : res.en?.title || content.hero?.title || title,
        titleHighlight: sourceLang === "en" ? titleHighlight : res.en?.titleHighlight || content.hero?.titleHighlight || titleHighlight,
        subtitle: sourceLang === "en" ? subtitle : res.en?.subtitle || content.hero?.subtitle || subtitle,
        badgeText: sourceLang === "en" ? badgeText : res.en?.badgeText || content.hero?.badgeText || badgeText,
        ctaText: sourceLang === "en" ? ctaText : res.en?.ctaText || content.hero?.ctaText || ctaText,

        hindiTitle: sourceLang === "hi" ? title : res.hi?.title || content.hero?.hindiTitle || title,
        hindiTitleHighlight: sourceLang === "hi" ? titleHighlight : res.hi?.titleHighlight || content.hero?.hindiTitleHighlight || titleHighlight,
        hindiSubtitle: sourceLang === "hi" ? subtitle : res.hi?.subtitle || content.hero?.hindiSubtitle || subtitle,
        hindiBadgeText: sourceLang === "hi" ? badgeText : res.hi?.badgeText || content.hero?.hindiBadgeText || badgeText,
        hindiCtaText: sourceLang === "hi" ? ctaText : res.hi?.ctaText || content.hero?.hindiCtaText || ctaText,

        teluguTitle: sourceLang === "te" ? title : res.te?.title || content.hero?.teluguTitle || title,
        teluguTitleHighlight: sourceLang === "te" ? titleHighlight : res.te?.titleHighlight || content.hero?.teluguTitleHighlight || titleHighlight,
        teluguSubtitle: sourceLang === "te" ? subtitle : res.te?.subtitle || content.hero?.teluguSubtitle || subtitle,
        teluguBadgeText: sourceLang === "te" ? badgeText : res.te?.badgeText || content.hero?.teluguBadgeText || badgeText,
        teluguCtaText: sourceLang === "te" ? ctaText : res.te?.ctaText || content.hero?.teluguCtaText || ctaText,

        tamilTitle: sourceLang === "ta" ? title : res.ta?.title || content.hero?.tamilTitle || title,
        tamilTitleHighlight: sourceLang === "ta" ? titleHighlight : res.ta?.tamilTitleHighlight || content.hero?.tamilTitleHighlight || titleHighlight,
        tamilSubtitle: sourceLang === "ta" ? subtitle : res.ta?.subtitle || content.hero?.tamilSubtitle || subtitle,
        tamilBadgeText: sourceLang === "ta" ? badgeText : res.ta?.badgeText || content.hero?.tamilBadgeText || badgeText,
        tamilCtaText: sourceLang === "ta" ? ctaText : res.ta?.ctaText || content.hero?.tamilCtaText || ctaText,
      };

      setContent((prev) => ({ ...prev, hero: updatedHero }));
      setNotification("✨ Hero content synchronized across all 4 languages!");
      setTimeout(() => setNotification(""), 3500);
    } catch {
      setError("Failed to translate hero content.");
    } finally {
      setIsTranslatingHero(false);
    }
  };

  const handleSaveHero = async () => {
    // Before saving, ensure all 4 languages have translations if any was updated
    let updatedHero = { ...content.hero };
    const hasEn = Boolean(updatedHero.title || updatedHero.subtitle);
    const hasHi = Boolean(updatedHero.hindiTitle || updatedHero.hindiSubtitle);
    const hasTe = Boolean(updatedHero.teluguTitle || updatedHero.teluguSubtitle);
    const hasTa = Boolean(updatedHero.tamilTitle || updatedHero.tamilSubtitle);

    if (hasEn && (!hasHi || !hasTe || !hasTa)) {
      try {
        const res = await translateFieldsToAllLanguages(
          {
            title: updatedHero.title || "",
            titleHighlight: updatedHero.titleHighlight || "",
            subtitle: updatedHero.subtitle || "",
            badgeText: updatedHero.badgeText || "",
            ctaText: updatedHero.ctaText || "",
          },
          "en"
        );
        updatedHero = {
          ...updatedHero,
          hindiTitle: updatedHero.hindiTitle || res.hi?.title,
          hindiTitleHighlight: updatedHero.hindiTitleHighlight || res.hi?.titleHighlight,
          hindiSubtitle: updatedHero.hindiSubtitle || res.hi?.subtitle,
          hindiBadgeText: updatedHero.hindiBadgeText || res.hi?.badgeText,
          hindiCtaText: updatedHero.hindiCtaText || res.hi?.ctaText,

          teluguTitle: updatedHero.teluguTitle || res.te?.title,
          teluguTitleHighlight: updatedHero.teluguTitleHighlight || res.te?.titleHighlight,
          teluguSubtitle: updatedHero.teluguSubtitle || res.te?.subtitle,
          teluguBadgeText: updatedHero.teluguBadgeText || res.te?.badgeText,
          teluguCtaText: updatedHero.teluguCtaText || res.te?.ctaText,

          tamilTitle: updatedHero.tamilTitle || res.ta?.title,
          tamilTitleHighlight: updatedHero.tamilTitleHighlight || res.ta?.tamilTitleHighlight,
          tamilSubtitle: updatedHero.tamilSubtitle || res.ta?.subtitle,
          tamilBadgeText: updatedHero.tamilBadgeText || res.ta?.badgeText,
          tamilCtaText: updatedHero.tamilCtaText || res.ta?.ctaText,
        };
      } catch (e) {
        console.warn("[CmsManager] Hero on-save sync warning:", e);
      }
    }

    handleSave({ ...content, hero: updatedHero });
  };

  // ── 3. Vedic Assurances Handlers ──
  const handleAutoTranslateAssuranceHeadings = async (sourceLang: SupportedLocale = assurancesLangTab) => {
    const va = content.vedicAssurances || {};
    let heading = "";
    let subheading = "";

    if (sourceLang === "en") {
      heading = va.heading || "";
      subheading = va.subheading || "";
    } else if (sourceLang === "hi") {
      heading = va.hindiHeading || "";
      subheading = va.hindiSubheading || "";
    } else if (sourceLang === "te") {
      heading = va.teluguHeading || "";
      subheading = va.teluguSubheading || "";
    } else {
      heading = va.tamilHeading || "";
      subheading = va.tamilSubheading || "";
    }

    if (!heading && !subheading) {
      heading = va.heading || "";
      subheading = va.subheading || "";
      sourceLang = "en";
    }

    if (!heading && !subheading) return;

    setIsTranslatingAssurances(true);
    try {
      const res = await translateFieldsToAllLanguages({ heading, subheading }, sourceLang);
      setContent((prev) => ({
        ...prev,
        vedicAssurances: {
          ...prev.vedicAssurances,
          heading: sourceLang === "en" ? heading : res.en?.heading || prev.vedicAssurances?.heading,
          subheading: sourceLang === "en" ? subheading : res.en?.subheading || prev.vedicAssurances?.subheading,
          hindiHeading: sourceLang === "hi" ? heading : res.hi?.heading || prev.vedicAssurances?.hindiHeading,
          hindiSubheading: sourceLang === "hi" ? subheading : res.hi?.subheading || prev.vedicAssurances?.hindiSubheading,
          teluguHeading: sourceLang === "te" ? heading : res.te?.heading || prev.vedicAssurances?.teluguHeading,
          teluguSubheading: sourceLang === "te" ? subheading : res.te?.subheading || prev.vedicAssurances?.teluguSubheading,
          tamilHeading: sourceLang === "ta" ? heading : res.ta?.heading || prev.vedicAssurances?.tamilHeading,
          tamilSubheading: sourceLang === "ta" ? subheading : res.ta?.subheading || prev.vedicAssurances?.tamilSubheading,
        },
      }));
      setNotification("✨ Vedic Assurance section headings synchronized across all languages!");
      setTimeout(() => setNotification(""), 3500);
    } catch {
      setError("Failed to translate assurance headings.");
    } finally {
      setIsTranslatingAssurances(false);
    }
  };

  const handleToggleAssurance = (index: number) => {
    const items = [...(content.vedicAssurances?.items || [])];
    if (items[index]) {
      items[index] = {
        ...items[index],
        active: items[index].active === false ? true : false,
      };
      const updated = {
        ...content,
        vedicAssurances: {
          ...content.vedicAssurances,
          items,
        },
      };
      handleSave(updated);
    }
  };

  const handleOpenEditAssurance = (index: number) => {
    const item = content.vedicAssurances?.items?.[index];
    if (!item) return;
    setEditingAssuranceIdx(index);
    setEditingAssuranceDraft({ ...item });
    setAssuranceItemLangTab("en");
  };

  const handleAutoTranslateAssuranceItem = async (sourceLang: SupportedLocale = assuranceItemLangTab) => {
    if (!editingAssuranceDraft) return;
    let title = "";
    let description = "";

    if (sourceLang === "en") {
      title = editingAssuranceDraft.title || "";
      description = editingAssuranceDraft.description || "";
    } else if (sourceLang === "hi") {
      title = editingAssuranceDraft.hindiTitle || "";
      description = editingAssuranceDraft.hindiDescription || "";
    } else if (sourceLang === "te") {
      title = editingAssuranceDraft.teluguTitle || "";
      description = editingAssuranceDraft.teluguDescription || "";
    } else {
      title = editingAssuranceDraft.tamilTitle || "";
      description = editingAssuranceDraft.tamilDescription || "";
    }

    if (!title && !description) {
      title = editingAssuranceDraft.title || "";
      description = editingAssuranceDraft.description || "";
      sourceLang = "en";
    }

    if (!title && !description) {
      setError("Please enter a title or description first.");
      return;
    }

    setIsTranslatingAssuranceItem(true);
    try {
      const res = await translateFieldsToAllLanguages({ title, description }, sourceLang);
      setEditingAssuranceDraft((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          title: sourceLang === "en" ? title : res.en?.title || prev.title || title,
          description: sourceLang === "en" ? description : res.en?.description || prev.description || description,
          hindiTitle: sourceLang === "hi" ? title : res.hi?.title || prev.hindiTitle || title,
          hindiDescription: sourceLang === "hi" ? description : res.hi?.description || prev.hindiDescription || description,
          teluguTitle: sourceLang === "te" ? title : res.te?.title || prev.teluguTitle || title,
          teluguDescription: sourceLang === "te" ? description : res.te?.description || prev.teluguDescription || description,
          tamilTitle: sourceLang === "ta" ? title : res.ta?.title || prev.tamilTitle || title,
          tamilDescription: sourceLang === "ta" ? description : res.ta?.description || prev.tamilDescription || description,
        };
      });
      setNotification("✨ Vedic Assurance item synchronized to all 4 languages!");
      setTimeout(() => setNotification(""), 3500);
    } catch {
      setError("Translation failed.");
    } finally {
      setIsTranslatingAssuranceItem(false);
    }
  };

  const handleSaveAssuranceItem = async () => {
    if (editingAssuranceIdx === null || !editingAssuranceDraft) return;
    const items = [...(content.vedicAssurances?.items || [])];

    // Ensure all 4 languages are filled before saving
    let finalItem = { ...editingAssuranceDraft };
    if (!finalItem.hindiTitle || !finalItem.teluguTitle || !finalItem.tamilTitle) {
      try {
        const res = await translateFieldsToAllLanguages(
          { title: finalItem.title, description: finalItem.description || "" },
          "en"
        );
        finalItem = {
          ...finalItem,
          hindiTitle: finalItem.hindiTitle || res.hi?.title,
          hindiDescription: finalItem.hindiDescription || res.hi?.description,
          teluguTitle: finalItem.teluguTitle || res.te?.title,
          teluguDescription: finalItem.teluguDescription || res.te?.description,
          tamilTitle: finalItem.tamilTitle || res.ta?.title,
          tamilDescription: finalItem.tamilDescription || res.ta?.description,
        };
      } catch (e) {
        console.warn("[CmsManager] Assurance item on-save translation warning:", e);
      }
    }

    items[editingAssuranceIdx] = finalItem;
    const updated = {
      ...content,
      vedicAssurances: {
        ...content.vedicAssurances,
        items,
      },
    };
    handleSave(updated);
    setEditingAssuranceIdx(null);
    setEditingAssuranceDraft(null);
  };

  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Website Content (CMS)"
        subtitle="Administer homepage headings, yellow announcement strip, hero featured puja placement, Vedic Assurances, and footer information with full cross-language synchronization."
        onAdd={() => setActiveTab("announcement")}
        onReset={() => setConfirmResetOpen(true)}
        addLabel="Edit Sections"
      />

      {/* Notifications and Alerts */}
      {notification && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-800 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {confirmResetOpen && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <RotateCcw className="h-4 w-4 text-amber-700" />
            <span>Confirm Reset to Default Website Content?</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            This will clear your customized CMS content and restore the authentic Vedic defaults for announcement strip, hero, assurances, and footer.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={isSaving}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold transition-colors"
            >
              Yes, Reset Content
            </button>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(false)}
              className="rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-saffron-100/80 pb-3">
        {[
          { id: "announcement", label: "Announcement Strip", icon: Megaphone },
          { id: "hero", label: "Hero & Featured Puja", icon: Sparkles },
          { id: "assurances", label: "Vedic Assurances & Inclusions", icon: ShieldCheck },
          { id: "footer", label: "Footer & Contact", icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as CmsSubTab)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-saffron-500 text-white shadow-xs"
                  : "bg-white text-ink-soft border border-slate-200 hover:bg-saffron-50 hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 1. Announcement Marquee Strip Tab ── */}
      {activeTab === "announcement" && (
        <ManagerCard>
          <div className="pb-3 border-b border-saffron-100 mb-4">
            <h3 className="font-display text-base font-bold text-ink">
              Scrolling Announcement / Marquee Strip
            </h3>
            <p className="text-xs text-ink-soft">
              Customize the continuous yellow scrolling announcement ticker directly below the hero section.
            </p>
          </div>
          <div className="space-y-4">
            <Toggle
              label="Enable Scrolling Announcement Strip"
              checked={content.announcementStrip?.enabled !== false}
              onChange={(checked) => {
                const updated = {
                  ...content,
                  announcementStrip: {
                    ...content.announcementStrip,
                    enabled: checked,
                  },
                };
                handleSave(updated);
              }}
            />

            <div className="space-y-3 pt-3 border-t border-saffron-100/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-saffron-900">
                Ticker Items ({content.announcementStrip?.items?.length || 0})
              </h4>

              <div className="space-y-2">
                {content.announcementStrip?.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-saffron-200/80 bg-amber-50/40 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base">{item.icon}</span>
                      <span className="font-bold text-ink">{item.label}</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">EN ✓</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${item.hindiLabel ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                          HI {item.hindiLabel ? "✓" : "—"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${item.teluguLabel ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                          TE {item.teluguLabel ? "✓" : "—"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${item.tamilLabel ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                          TA {item.tamilLabel ? "✓" : "—"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTickerItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Ticker Item Form with Auto-Translate */}
              <div className="p-4 rounded-2xl border border-dashed border-saffron-300 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Add Announcement Message</span>
                  <button
                    type="button"
                    onClick={handleAutoTranslateTicker}
                    disabled={isTranslatingTicker || (!newTickerLabel && !newTickerHindi && !newTickerTelugu && !newTickerTamil)}
                    className="text-xs font-bold text-saffron-700 bg-saffron-50 hover:bg-saffron-100 px-2.5 py-1 rounded-lg border border-saffron-200 flex items-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isTranslatingTicker ? "Translating..." : "Auto-Translate to All"}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  <div className="sm:col-span-1">
                    <TextInput
                      value={newTickerIcon}
                      onChange={(e) => setNewTickerIcon(e.target.value)}
                      placeholder="Icon (🪔)"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <TextInput
                      value={newTickerLabel}
                      onChange={(e) => setNewTickerLabel(e.target.value)}
                      placeholder="English Text"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <TextInput
                      value={newTickerHindi}
                      onChange={(e) => setNewTickerHindi(e.target.value)}
                      placeholder="हिंदी (Optional)"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <TextInput
                      value={newTickerTelugu}
                      onChange={(e) => setNewTickerTelugu(e.target.value)}
                      placeholder="తెలుగు (Optional)"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <TextInput
                      value={newTickerTamil}
                      onChange={(e) => setNewTickerTamil(e.target.value)}
                      placeholder="தமிழ் (Optional)"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddTickerItem}
                  disabled={(!newTickerLabel.trim() && !newTickerHindi.trim()) || isSaving}
                  className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add to Marquee</span>
                </button>
              </div>
            </div>
          </div>
        </ManagerCard>
      )}

      {/* ── 2. Hero & Featured Puja Placement Tab ── */}
      {activeTab === "hero" && (
        <ManagerCard>
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-saffron-100 mb-4 gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Hero Content & Featured Puja Placement
              </h3>
              <p className="text-xs text-ink-soft">
                Configure homepage hero headings, primary CTA, and which puja is featured prominently in the hero section.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAutoTranslateHero(heroLangTab)}
              disabled={isTranslatingHero}
              className="rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              title="Translate current hero content to all other languages"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isTranslatingHero ? "animate-spin" : ""}`} />
              <span>{isTranslatingHero ? "Translating..." : "✨ Auto-Translate to All Languages"}</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Language Selector for Hero */}
            <div className="flex items-center justify-between border-b border-saffron-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Languages className="h-4 w-4 text-saffron-600" />
                <span>Select Hero Language to Edit</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {[
                  { id: "en", label: "English", has: Boolean(content.hero?.title) },
                  { id: "hi", label: "हिंदी (HI)", has: Boolean(content.hero?.hindiTitle) },
                  { id: "te", label: "తెలుగు (TE)", has: Boolean(content.hero?.teluguTitle) },
                  { id: "ta", label: "தமிழ் (TA)", has: Boolean(content.hero?.tamilTitle) },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHeroLangTab(tab.id as SupportedLocale)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                      heroLangTab === tab.id
                        ? "bg-white text-saffron-700 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.has && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Completed" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Placement controls (common across all languages) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Featured Puja in Hero (Placement)">
                <SelectInput
                  options={[
                    { value: "", label: "Auto / Dynamic Placement" },
                    ...poojas.map((p) => ({ value: p.slug, label: `${p.title} (${p.slug})` })),
                  ]}
                  value={content.hero?.featuredPujaSlug || "satyanarayan-katha"}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, featuredPujaSlug: e.target.value },
                    })
                  }
                />
              </Field>

              <Field label="CTA Button Link">
                <TextInput
                  value={content.hero?.ctaLink || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, ctaLink: e.target.value },
                    })
                  }
                  placeholder="e.g. /#poojas"
                />
              </Field>
            </div>

            {/* 1. English Inputs */}
            {heroLangTab === "en" && (
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <Field label="Hero Badge Text (English)">
                  <TextInput
                    value={content.hero?.badgeText || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, badgeText: e.target.value },
                      })
                    }
                    placeholder="e.g. Authentic Vedic Seva"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Hero Title (English)">
                    <TextInput
                      value={content.hero?.title || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, title: e.target.value },
                        })
                      }
                      placeholder="e.g. Book Authentic Temple Pujas"
                    />
                  </Field>
                  <Field label="Hero Title Highlight (English)">
                    <TextInput
                      value={content.hero?.titleHighlight || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, titleHighlight: e.target.value },
                        })
                      }
                      placeholder="e.g. Online with Verified Pandits"
                    />
                  </Field>
                </div>
                <Field label="Hero Subtitle (English)">
                  <TextAreaInput
                    rows={2}
                    value={content.hero?.subtitle || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, subtitle: e.target.value },
                      })
                    }
                    placeholder="Experience divine blessings from renowned holy temples..."
                  />
                </Field>
                <Field label="CTA Button Text (English)">
                  <TextInput
                    value={content.hero?.ctaText || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, ctaText: e.target.value },
                      })
                    }
                    placeholder="e.g. Book Puja Now"
                  />
                </Field>
              </div>
            )}

            {/* 2. Hindi Inputs */}
            {heroLangTab === "hi" && (
              <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-saffron-200">
                <Field label="हीरो बैज (Hindi Badge Text)">
                  <TextInput
                    value={content.hero?.hindiBadgeText || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, hindiBadgeText: e.target.value },
                      })
                    }
                    placeholder="उदा. प्रामाणिक वैदिक सेवा"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="मुख्य शीर्षक (Hindi Title)">
                    <TextInput
                      value={content.hero?.hindiTitle || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, hindiTitle: e.target.value },
                        })
                      }
                      placeholder="उदा. प्रामाणिक मंदिर पूजा बुक करें"
                    />
                  </Field>
                  <Field label="शीर्षक हाइलाइट (Hindi Title Highlight)">
                    <TextInput
                      value={content.hero?.hindiTitleHighlight || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, hindiTitleHighlight: e.target.value },
                        })
                      }
                      placeholder="उदा. प्रमाणित पंडितों के साथ ऑनलाइन"
                    />
                  </Field>
                </div>
                <Field label="उपशीर्षक (Hindi Subtitle)">
                  <TextAreaInput
                    rows={2}
                    value={content.hero?.hindiSubtitle || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, hindiSubtitle: e.target.value },
                      })
                    }
                    placeholder="अपने घर बैठे भारत के प्रसिद्ध पावन मंदिरों से दिव्य आशीर्वाद प्राप्त करें।"
                  />
                </Field>
                <Field label="बटन टेक्स्ट (Hindi CTA Button Text)">
                  <TextInput
                    value={content.hero?.hindiCtaText || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, hindiCtaText: e.target.value },
                      })
                    }
                    placeholder="उदा. अभी पूजा बुक करें"
                  />
                </Field>
              </div>
            )}

            {/* 3. Telugu Inputs */}
            {heroLangTab === "te" && (
              <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-saffron-200">
                <Field label="హీరో బ్యాడ్జ్ (Telugu Badge Text)">
                  <TextInput
                    value={content.hero?.teluguBadgeText || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, teluguBadgeText: e.target.value },
                      })
                    }
                    placeholder="ప్రామాణిక వేద సేవ"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="ప్రధాన శీర్షిక (Telugu Title)">
                    <TextInput
                      value={content.hero?.teluguTitle || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, teluguTitle: e.target.value },
                        })
                      }
                      placeholder="ప్రామాణిక ఆలయ పూజలను బుక్ చేయండి"
                    />
                  </Field>
                  <Field label="శీర్షిక ముఖ్యాంశం (Telugu Title Highlight)">
                    <TextInput
                      value={content.hero?.teluguTitleHighlight || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, teluguTitleHighlight: e.target.value },
                        })
                      }
                      placeholder="ధృవీకరించబడిన పండితులతో ఆన్‌లైన్"
                    />
                  </Field>
                </div>
                <Field label="ఉపశీర్షిక (Telugu Subtitle)">
                  <TextAreaInput
                    rows={2}
                    value={content.hero?.teluguSubtitle || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, teluguSubtitle: e.target.value },
                      })
                    }
                    placeholder="మీ ఇంటి వద్ద నుండే పవిత్ర ఆలయాల నుండి దైవిక ఆశీస్సులను పొందండి."
                  />
                </Field>
                <Field label="బటన్ వచనం (Telugu CTA Button Text)">
                  <TextInput
                    value={content.hero?.teluguCtaText || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, teluguCtaText: e.target.value },
                      })
                    }
                    placeholder="ఇప్పుడే పూజను బుక్ చేయండి"
                  />
                </Field>
              </div>
            )}

            {/* 4. Tamil Inputs */}
            {heroLangTab === "ta" && (
              <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-saffron-200">
                <Field label="ஹீரோ பேட்ஜ் (Tamil Badge Text)">
                  <TextInput
                    value={content.hero?.tamilBadgeText || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, tamilBadgeText: e.target.value },
                      })
                    }
                    placeholder="வேத முறை பூசை சேவைகள்"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="முக்கிய தலைப்பு (Tamil Title)">
                    <TextInput
                      value={content.hero?.tamilTitle || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, tamilTitle: e.target.value },
                        })
                      }
                      placeholder="அங்கீகரிக்கப்பட்ட கோயில் பூஜைகளை பதிவு செய்யுங்கள்"
                    />
                  </Field>
                  <Field label="தலைப்பு சிறப்பம்சம் (Tamil Title Highlight)">
                    <TextInput
                      value={content.hero?.tamilTitleHighlight || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: { ...content.hero, tamilTitleHighlight: e.target.value },
                        })
                      }
                      placeholder="சான்றளிக்கப்பட்ட பண்டிதர்களுடன் ஆன்லைனில்"
                    />
                  </Field>
                </div>
                <Field label="துணைத்தலைப்பு (Tamil Subtitle)">
                  <TextAreaInput
                    rows={2}
                    value={content.hero?.tamilSubtitle || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, tamilSubtitle: e.target.value },
                      })
                    }
                    placeholder="உங்கள் வீட்டிலிருந்தே புகழ்பெற்ற புனித கோயில்களின் தெய்வீக அருளைப் பெறுங்கள்."
                  />
                </Field>
                <Field label="பொத்தான் உரை (Tamil CTA Button Text)">
                  <TextInput
                    value={content.hero?.tamilCtaText || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, tamilCtaText: e.target.value },
                      })
                    }
                    placeholder="இப்போதே பூஜை பதிவு செய்யுங்கள்"
                  />
                </Field>
              </div>
            )}

            <div className="pt-3 border-t border-saffron-100/80 flex justify-end">
              <button
                type="button"
                onClick={handleSaveHero}
                disabled={isSaving}
                className="btn-primary !py-2 !px-5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Hero Settings</span>
              </button>
            </div>
          </div>
        </ManagerCard>
      )}

      {/* ── 3. Vedic Assurances & Inclusions Tab ── */}
      {activeTab === "assurances" && (
        <ManagerCard>
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-saffron-100 mb-4 gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Vedic Assurances & Inclusions
              </h3>
              <p className="text-xs text-ink-soft">
                Manage the 5 authentic Vedic guarantees displayed at the top of mobile and desktop puja booking pages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAutoTranslateAssuranceHeadings(assurancesLangTab)}
              disabled={isTranslatingAssurances}
              className="rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isTranslatingAssurances ? "Translating..." : "✨ Auto-Translate Headings"}</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Language Selector for Section Heading */}
            <div className="flex items-center justify-between border-b border-saffron-100 pb-2">
              <span className="text-xs font-bold text-ink">Heading Language:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {[
                  { id: "en", label: "English" },
                  { id: "hi", label: "हिंदी" },
                  { id: "te", label: "తెలుగు" },
                  { id: "ta", label: "தமிழ்" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAssurancesLangTab(tab.id as SupportedLocale)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      assurancesLangTab === tab.id
                        ? "bg-white text-saffron-700 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {assurancesLangTab === "en" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Section Heading (English)">
                  <TextInput
                    value={content.vedicAssurances?.heading || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        vedicAssurances: {
                          ...content.vedicAssurances,
                          heading: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Vedic Assurances & Inclusions"
                  />
                </Field>
                <Field label="Section Subheading (English)">
                  <TextInput
                    value={content.vedicAssurances?.subheading || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        vedicAssurances: {
                          ...content.vedicAssurances,
                          subheading: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Sacred guarantees that ensure every puja is conducted with utmost Vedic sanctity."
                  />
                </Field>
              </div>
            )}

            {assurancesLangTab === "hi" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="शीर्षक (Hindi Heading)">
                  <TextInput
                    value={content.vedicAssurances?.hindiHeading || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        vedicAssurances: {
                          ...content.vedicAssurances,
                          hindiHeading: e.target.value,
                        },
                      })
                    }
                    placeholder="वैदिक आश्वासन एवं सुविधाएं"
                  />
                </Field>
                <Field label="उपशीर्षक (Hindi Subheading)">
                  <TextInput
                    value={content.vedicAssurances?.hindiSubheading || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        vedicAssurances: {
                          ...content.vedicAssurances,
                          hindiSubheading: e.target.value,
                        },
                      })
                    }
                    placeholder="पवित्र वैदिक मर्यादा और शास्त्रोक्त शुद्धता के साथ सेवा।"
                  />
                </Field>
              </div>
            )}

            {assurancesLangTab === "te" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="శీర్షిక (Telugu Heading)">
                  <TextInput
                    value={content.vedicAssurances?.teluguHeading || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        vedicAssurances: {
                          ...content.vedicAssurances,
                          teluguHeading: e.target.value,
                        },
                      })
                    }
                    placeholder="వేద హామీలు మరియు ప్రత్యేకతలు"
                  />
                </Field>
                <Field label="ఉపశీర్షిక (Telugu Subheading)">
                  <TextInput
                    value={content.vedicAssurances?.teluguSubheading || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        vedicAssurances: {
                          ...content.vedicAssurances,
                          teluguSubheading: e.target.value,
                        },
                      })
                    }
                    placeholder="ప్రతి పూజ సంపూర్ణ వేద పద్ధతిలో నిర్వహించబడుతుందని పవిత్రమైన హామీ."
                  />
                </Field>
              </div>
            )}

            {assurancesLangTab === "ta" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="தலைப்பு (Tamil Heading)">
                  <TextInput
                    value={content.vedicAssurances?.tamilHeading || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        vedicAssurances: {
                          ...content.vedicAssurances,
                          tamilHeading: e.target.value,
                        },
                      })
                    }
                    placeholder="வேத உத்தரவாதங்கள் & சிறப்பம்சங்கள்"
                  />
                </Field>
                <Field label="துணைத்தலைப்பு (Tamil Subheading)">
                  <TextInput
                    value={content.vedicAssurances?.tamilSubheading || ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        vedicAssurances: {
                          ...content.vedicAssurances,
                          tamilSubheading: e.target.value,
                        },
                      })
                    }
                    placeholder="ஒவ்வொரு பூஜையும் உன்னதமான வேத தூய்மையுடன் நடத்தப்படும் புனித உத்தரவாதம்."
                  />
                </Field>
              </div>
            )}

            {/* Edit Assurance Item Modal */}
            {editingAssuranceDraft && editingAssuranceIdx !== null && (
              <div className="p-4 rounded-2xl border-2 border-saffron-300 bg-amber-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-saffron-600" />
                    <span>Edit Assurance Item #{editingAssuranceIdx + 1}</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAutoTranslateAssuranceItem(assuranceItemLangTab)}
                      disabled={isTranslatingAssuranceItem}
                      className="rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-2.5 py-1 text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{isTranslatingAssuranceItem ? "Translating..." : "Auto-Translate"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAssuranceIdx(null);
                        setEditingAssuranceDraft(null);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Assurance Language Tabs */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl text-xs font-bold border border-saffron-200">
                  {[
                    { id: "en", label: "English" },
                    { id: "hi", label: "हिंदी" },
                    { id: "te", label: "తెలుగు" },
                    { id: "ta", label: "தமிழ்" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAssuranceItemLangTab(tab.id as SupportedLocale)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        assuranceItemLangTab === tab.id
                          ? "bg-saffron-500 text-white shadow-2xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {assuranceItemLangTab === "en" && (
                  <div className="space-y-2">
                    <Field label="Title (English)">
                      <TextInput
                        value={editingAssuranceDraft.title}
                        onChange={(e) =>
                          setEditingAssuranceDraft({ ...editingAssuranceDraft, title: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Description (English)">
                      <TextAreaInput
                        rows={2}
                        value={editingAssuranceDraft.description || ""}
                        onChange={(e) =>
                          setEditingAssuranceDraft({ ...editingAssuranceDraft, description: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                )}

                {assuranceItemLangTab === "hi" && (
                  <div className="space-y-2">
                    <Field label="शीर्षक (Hindi Title)">
                      <TextInput
                        value={editingAssuranceDraft.hindiTitle || ""}
                        onChange={(e) =>
                          setEditingAssuranceDraft({ ...editingAssuranceDraft, hindiTitle: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="विवरण (Hindi Description)">
                      <TextAreaInput
                        rows={2}
                        value={editingAssuranceDraft.hindiDescription || ""}
                        onChange={(e) =>
                          setEditingAssuranceDraft({ ...editingAssuranceDraft, hindiDescription: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                )}

                {assuranceItemLangTab === "te" && (
                  <div className="space-y-2">
                    <Field label="శీర్షిక (Telugu Title)">
                      <TextInput
                        value={editingAssuranceDraft.teluguTitle || ""}
                        onChange={(e) =>
                          setEditingAssuranceDraft({ ...editingAssuranceDraft, teluguTitle: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="వివరణ (Telugu Description)">
                      <TextAreaInput
                        rows={2}
                        value={editingAssuranceDraft.teluguDescription || ""}
                        onChange={(e) =>
                          setEditingAssuranceDraft({ ...editingAssuranceDraft, teluguDescription: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                )}

                {assuranceItemLangTab === "ta" && (
                  <div className="space-y-2">
                    <Field label="தலைப்பு (Tamil Title)">
                      <TextInput
                        value={editingAssuranceDraft.tamilTitle || ""}
                        onChange={(e) =>
                          setEditingAssuranceDraft({ ...editingAssuranceDraft, tamilTitle: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="விளக்கம் (Tamil Description)">
                      <TextAreaInput
                        rows={2}
                        value={editingAssuranceDraft.tamilDescription || ""}
                        onChange={(e) =>
                          setEditingAssuranceDraft({ ...editingAssuranceDraft, tamilDescription: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAssuranceIdx(null);
                      setEditingAssuranceDraft(null);
                    }}
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssuranceItem}
                    className="btn-primary !py-1.5 !px-3.5 text-xs font-bold"
                  >
                    Save Assurance Item
                  </button>
                </div>
              </div>
            )}

            {/* List of Assurance Items */}
            <div className="space-y-2.5 pt-2 border-t border-saffron-100/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-saffron-900">
                Assurance Badges ({content.vedicAssurances?.items?.length || 0})
              </h4>

              <div className="space-y-2">
                {content.vedicAssurances?.items?.map((item, idx) => {
                  const isHidden = item.active === false;
                  return (
                    <div
                      key={item.id || idx}
                      className={`rounded-2xl border p-3 flex items-center justify-between gap-3 ${
                        isHidden
                          ? "border-slate-200 bg-slate-50 opacity-60"
                          : "border-saffron-200/80 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xl shrink-0">{item.icon || "🪔"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-display font-bold text-xs text-ink truncate">
                              {item.title}
                            </h5>
                            <div className="flex items-center gap-1 text-[9px]">
                              <span className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold">EN ✓</span>
                              <span className={`px-1 py-0.2 rounded font-bold ${item.hindiTitle ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                                HI {item.hindiTitle ? "✓" : "—"}
                              </span>
                              <span className={`px-1 py-0.2 rounded font-bold ${item.teluguTitle ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                                TE {item.teluguTitle ? "✓" : "—"}
                              </span>
                              <span className={`px-1 py-0.2 rounded font-bold ${item.tamilTitle ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                                TA {item.tamilTitle ? "✓" : "—"}
                              </span>
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-ink-soft truncate">{item.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAssurance(idx)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="Edit assurance item"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAssurance(idx)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                          title={isHidden ? "Show badge" : "Hide badge"}
                        >
                          {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-saffron-100/80 flex justify-end">
              <button
                type="button"
                onClick={() => handleSave(content)}
                disabled={isSaving}
                className="btn-primary !py-2 !px-5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Assurances</span>
              </button>
            </div>
          </div>
        </ManagerCard>
      )}

      {/* ── 4. Footer & Contact Tab ── */}
      {activeTab === "footer" && (
        <ManagerCard>
          <div className="pb-3 border-b border-saffron-100 mb-4">
            <h3 className="font-display text-base font-bold text-ink">
              Footer & Contact Information
            </h3>
            <p className="text-xs text-ink-soft">
              Update public brand tagline, about text, official phone, email, WhatsApp, and address.
            </p>
          </div>
          <div className="space-y-4">
            <Field label="About TemplePujaSewa">
              <TextAreaInput
                rows={3}
                value={content.footer?.aboutText || ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    footer: { ...content.footer, aboutText: e.target.value },
                  })
                }
                placeholder="Enter company description..."
              />
            </Field>

            <Field label="Brand Tagline">
              <TextInput
                value={content.footer?.tagline || ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    footer: { ...content.footer, tagline: e.target.value },
                  })
                }
                placeholder="e.g. Connecting Devotees to Divine Blessings Worldwide"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Official Phone">
                <TextInput
                  value={content.footer?.phone || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      footer: { ...content.footer, phone: e.target.value },
                    })
                  }
                  placeholder="+91 9988776655"
                />
              </Field>

              <Field label="Support Email">
                <TextInput
                  value={content.footer?.email || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      footer: { ...content.footer, email: e.target.value },
                    })
                  }
                  placeholder="infotemplepujasewa@gmail.com"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="WhatsApp Support Number">
                <TextInput
                  value={content.footer?.whatsappNumber || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      footer: { ...content.footer, whatsappNumber: e.target.value },
                    })
                  }
                  placeholder="+91 9988776655"
                />
              </Field>

              <Field label="Registered Address">
                <TextInput
                  value={content.footer?.address || ""}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      footer: { ...content.footer, address: e.target.value },
                    })
                  }
                  placeholder="Kashi Sanctuary, Varanasi, India"
                />
              </Field>
            </div>

            <div className="pt-3 border-t border-saffron-100/80 flex justify-end">
              <button
                type="button"
                onClick={() => handleSave(content)}
                disabled={isSaving}
                className="btn-primary !py-2 !px-5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Footer Details</span>
              </button>
            </div>
          </div>
        </ManagerCard>
      )}
    </div>
  );
}
