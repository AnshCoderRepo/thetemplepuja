"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Globe,
  Languages,
  Layers,
  LayoutGrid,
  Loader2,
  MapPin,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { fetchCatalog, saveCatalogSection } from "@/lib/api";
import { isPoojaActive, type Pooja, type PoojaPackage, type Temple } from "@/lib/data";
import { formatINR } from "@/lib/format";
import ConfirmDialog from "./ConfirmDialog";
import {
  DateInput,
  dateToDaysFromToday,
  daysFromTodayToDate,
  toISODateString,
} from "./manager-ui";

const WIZARD_STEPS = [
  { id: 1, label: "Basic Info", icon: BookOpen },
  { id: 2, label: "Media", icon: Flame },
  { id: 3, label: "Scheduling", icon: Calendar },
  { id: 4, label: "Availability", icon: Users },
  { id: 5, label: "Relationships", icon: MapPin },
  { id: 6, label: "Content", icon: Layers },
  { id: 7, label: "Packages", icon: Package },
  { id: 8, label: "Review", icon: Check },
] as const;

const CATEGORIES = [
  "Rashifal Pooja",
  "Dosha Nivaran",
  "Festival Special",
  "Havan & Yagya",
  "Health & Healing",
  "Wealth & Prosperity",
  "Family & Home",
];

const GRADIENTS = [
  { label: "Saffron Gold", value: "from-saffron-500 to-saffron-700" },
  { label: "Amber Orange", value: "from-amber-400 to-orange-600" },
  { label: "Sacred Blue", value: "from-indigo-500 to-purple-600" },
  { label: "Vedic Green", value: "from-emerald-500 to-teal-600" },
  { label: "Shani Dark", value: "from-slate-600 to-gray-900" },
  { label: "Devi Crimson", value: "from-red-500 to-rose-700" },
  { label: "Royal Gold", value: "from-yellow-400 to-amber-600" },
  { label: "Mahadev Sky", value: "from-sky-500 to-blue-700" },
];

const AVAILABLE_DEITIES = [
  "Lord Shiva",
  "Lord Ganesha",
  "Lord Hanuman",
  "Goddess Lakshmi",
  "Goddess Durga",
  "Goddess Saraswati",
  "Lord Vishnu / Satyanarayan",
  "Navagraha Devatas",
  "Lord Shani",
  "Lord Kuber",
];

const CHADHAVA_OFFERINGS = [
  "Contribute to Bhojan for 11 Brahmins",
  "Bappa Ji Janeu – Red/Yellow Cloth Arpan",
  "Panchamrit Abhishek Offering",
  "Bilva Patra & 108 Dhatura Mala",
  "Sindoor & Hanuman Chola Seva",
  "108 Lotus Flowers Archana",
];

interface PoojaDraft {
  slug: string;
  title: string;
  hindiTitle: string;
  teluguTitle: string;
  tamilTitle: string;
  category: string;
  type: "temple" | "home";
  online: boolean;
  price: string;
  duration: string;
  bestMuhurat: string;
  startDate: string;
  description: string;
  hindiDescription: string;
  teluguDescription: string;
  tamilDescription: string;
  benefits: string[];
  hindiBenefits: string[];
  teluguBenefits: string[];
  tamilBenefits: string[];
  emoji: string;
  gradient: string;
  imageUrl: string;
  daysFromToday: string;
  eventTime: string;
  seats: string;
  capacity: string;
  live: boolean;
  deities: string[];
  templeSlugs: string[];
  chadhavaOptions: string[];
  packages: PoojaPackage[];
  active: boolean;
}

const emptyDraft: PoojaDraft = {
  slug: "",
  title: "",
  hindiTitle: "",
  teluguTitle: "",
  tamilTitle: "",
  category: "Rashifal Pooja",
  type: "temple",
  online: true,
  price: "1101",
  duration: "1.5 hours",
  bestMuhurat: "Shukla Paksha Auspicious Muhurat",
  startDate: "2026-10-04",
  description: "",
  hindiDescription: "",
  teluguDescription: "",
  tamilDescription: "",
  benefits: ["Inner peace & spiritual protection", "Removal of persistent obstacles"],
  hindiBenefits: ["आत्मिक शांति और सुरक्षा", "कठिन बाधाओं का निवारण"],
  teluguBenefits: ["శాంతి మరియు దైవిక రక్షణ", "సకల విఘ్న నివారణ"],
  tamilBenefits: ["மன அமைதி மற்றும் பாதுகாப்பு", "தடைகள் நீங்குதல்"],
  emoji: "🪔",
  gradient: "from-saffron-500 to-saffron-700",
  imageUrl: "",
  daysFromToday: "",
  eventTime: "7:00 PM IST",
  seats: "20 spots open",
  capacity: "",
  live: false,
  deities: ["Lord Shiva"],
  templeSlugs: ["kashi-vishwanath"],
  chadhavaOptions: ["Contribute to Bhojan for 11 Brahmins"],
  packages: [
    { name: "Individual Sankalp", price: 1101, description: "1 Devotee name in Sankalp" },
    { name: "Family Havan Seva", price: 2101, description: "Full family gotra & name sankalp + blessed prasad" },
  ],
  active: true,
};

export default function PoojasManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [list, setList] = useState<Pooja[]>([]);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "temple" | "home">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deityFilter, setDeityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  
  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<PoojaDraft>(emptyDraft);
  const [newBenefit, setNewBenefit] = useState("");
  const [newPackage, setNewPackage] = useState<PoojaPackage>({ name: "", price: 501, description: "" });
  const [translatingTarget, setTranslatingTarget] = useState<"all" | "title" | "description" | "benefits" | null>(null);
  const isTranslating = translatingTarget !== null;
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pooja | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) {
        setList(c.poojas);
        if (c.temples) setTemples(c.temples);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const showNotification = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const translateTitleOnly = async () => {
    if (!draft.title.trim()) {
      setError("Please enter the English Puja Name first to translate.");
      return;
    }
    setTranslatingTarget("title");
    setError("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.title.trim(), targets: ["hi", "te", "ta"] }),
      });
      const data = await res.json();
      if (data.ok && data.translations) {
        setDraft((prev) => ({
          ...prev,
          hindiTitle: data.translations.hi || prev.hindiTitle,
          teluguTitle: data.translations.te || prev.teluguTitle,
          tamilTitle: data.translations.ta || prev.tamilTitle,
        }));
        showNotification("✨ Puja Name translated to Hindi, Telugu, and Tamil!");
      } else {
        setError(data.error || "Failed to translate Puja Name.");
      }
    } catch (e) {
      console.error("Title translate error:", e);
      setError("Could not complete title translation.");
    } finally {
      setTranslatingTarget(null);
    }
  };

  const translateDescriptionOnly = async () => {
    if (!draft.description.trim()) {
      setError("Please enter the English Spiritual Description first to translate.");
      return;
    }
    setTranslatingTarget("description");
    setError("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.description.trim(), targets: ["hi", "te", "ta"] }),
      });
      const data = await res.json();
      if (data.ok && data.translations) {
        setDraft((prev) => ({
          ...prev,
          hindiDescription: data.translations.hi || prev.hindiDescription,
          teluguDescription: data.translations.te || prev.teluguDescription,
          tamilDescription: data.translations.ta || prev.tamilDescription,
        }));
        showNotification("✨ Spiritual Description translated to Hindi, Telugu, and Tamil!");
      } else {
        setError(data.error || "Failed to translate description.");
      }
    } catch (e) {
      console.error("Description translate error:", e);
      setError("Could not complete description translation.");
    } finally {
      setTranslatingTarget(null);
    }
  };

  const translateBenefitsOnly = async () => {
    if (draft.benefits.length === 0) {
      setError("Please add at least one Devotee Benefit in English first to translate.");
      return;
    }
    setTranslatingTarget("benefits");
    setError("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: draft.benefits, targets: ["hi", "te", "ta"] }),
      });
      const data = await res.json();
      if (data.ok && data.translations) {
        setDraft((prev) => ({
          ...prev,
          hindiBenefits: data.translations.hi || prev.hindiBenefits,
          teluguBenefits: data.translations.te || prev.teluguBenefits,
          tamilBenefits: data.translations.ta || prev.tamilBenefits,
        }));
        showNotification("✨ Devotee Benefits translated to Hindi, Telugu, and Tamil!");
      } else {
        setError(data.error || "Failed to translate benefits.");
      }
    } catch (e) {
      console.error("Benefits translate error:", e);
      setError("Could not complete benefits translation.");
    } finally {
      setTranslatingTarget(null);
    }
  };

  const autoTranslateAll = async () => {
    if (!draft.title.trim() && !draft.description.trim()) {
      setError("Please enter the English Title or Description first to translate.");
      return;
    }
    setTranslatingTarget("all");
    setError("");
    try {
      // 1. Translate Title
      if (draft.title.trim()) {
        const resTitle = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.title.trim(), targets: ["hi", "te", "ta"] }),
        });
        const dataTitle = await resTitle.json();
        if (dataTitle.ok && dataTitle.translations) {
          setDraft((prev) => ({
            ...prev,
            hindiTitle: dataTitle.translations.hi || prev.hindiTitle,
            teluguTitle: dataTitle.translations.te || prev.teluguTitle,
            tamilTitle: dataTitle.translations.ta || prev.tamilTitle,
          }));
        }
      }

      // 2. Translate Description
      if (draft.description.trim()) {
        const resDesc = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.description.trim(), targets: ["hi", "te", "ta"] }),
        });
        const dataDesc = await resDesc.json();
        if (dataDesc.ok && dataDesc.translations) {
          setDraft((prev) => ({
            ...prev,
            hindiDescription: dataDesc.translations.hi || prev.hindiDescription,
            teluguDescription: dataDesc.translations.te || prev.teluguDescription,
            tamilDescription: dataDesc.translations.ta || prev.tamilDescription,
          }));
        }
      }

      // 3. Translate Benefits
      if (draft.benefits.length > 0) {
        const resBen = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: draft.benefits, targets: ["hi", "te", "ta"] }),
        });
        const dataBen = await resBen.json();
        if (dataBen.ok && dataBen.translations) {
          setDraft((prev) => ({
            ...prev,
            hindiBenefits: dataBen.translations.hi || prev.hindiBenefits,
            teluguBenefits: dataBen.translations.te || prev.teluguBenefits,
            tamilBenefits: dataBen.translations.ta || prev.tamilBenefits,
          }));
        }
      }

      showNotification("✨ AI Translated all content to Hindi, Telugu, and Tamil successfully!");
    } catch (e) {
      console.error("Auto-translate error:", e);
      setError("Could not complete automatic translation. Please try again.");
    } finally {
      setTranslatingTarget(null);
    }
  };

  const startAdd = () => {
    setEditingSlug(null);
    setDraft(emptyDraft);
    setCurrentStep(1);
    setError("");
    setIsWizardOpen(true);
  };

  const startEdit = (p: Pooja) => {
    setEditingSlug(p.slug);
    setDraft({
      slug: p.slug,
      title: p.title,
      hindiTitle: p.hindiTitle ?? "",
      teluguTitle: p.teluguTitle ?? "",
      tamilTitle: p.tamilTitle ?? "",
      category: p.category ?? "Rashifal Pooja",
      type: p.type ?? "temple",
      online: p.online ?? true,
      price: String(p.price),
      duration: p.duration ?? "1.5 hours",
      bestMuhurat: p.bestMuhurat ?? "",
      startDate: toISODateString(p.startDate) || p.startDate || "2026-10-04",
      description: p.description ?? "",
      hindiDescription: p.hindiDescription ?? "",
      teluguDescription: p.teluguDescription ?? "",
      tamilDescription: p.tamilDescription ?? "",
      benefits: p.benefits ?? [],
      hindiBenefits: p.hindiBenefits ?? [],
      teluguBenefits: p.teluguBenefits ?? [],
      tamilBenefits: p.tamilBenefits ?? [],
      emoji: p.emoji ?? "🪔",
      gradient: p.gradient ?? "from-saffron-500 to-saffron-700",
      imageUrl: p.imageUrl ?? "",
      daysFromToday: p.daysFromToday !== undefined ? String(p.daysFromToday) : "",
      eventTime: p.eventTime ?? "7:00 PM IST",
      seats: p.seats ?? "20 spots open",
      capacity: p.capacity !== undefined ? String(p.capacity) : "",
      live: p.live ?? false,
      deities: p.deities ?? ["Lord Shiva"],
      templeSlugs: p.templeSlugs ?? [],
      chadhavaOptions: p.chadhavaOptions ?? [],
      packages: p.packages ?? [
        { name: "Individual Sankalp", price: p.price, description: "1 Devotee name in Sankalp" },
      ],
      active: isPoojaActive(p),
    });
    setCurrentStep(1);
    setError("");
    setIsWizardOpen(true);
  };

  const toggleStatus = async (slug: string) => {
    const target = list.find((p) => p.slug === slug);
    if (!target) return;
    const nextActive = !isPoojaActive(target);
    const next = list.map((p) => (p.slug === slug ? { ...p, active: nextActive } : p));
    const res = await saveCatalogSection("poojas", next, token);
    if (!res.ok) {
      if (res.status === 401) onAuthError();
      return;
    }
    setList(next);
    showNotification(
      nextActive
        ? `🟢 Puja "${target.title}" is now ACTIVE & visible on the website!`
        : `⚪ Puja "${target.title}" is now HIDDEN from the website. You can edit and reactivate it anytime.`
    );
    setActiveActionMenu(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const next = list.filter((p) => p.slug !== deleteTarget.slug);
    const res = await saveCatalogSection("poojas", next, token);
    if (!res.ok) {
      if (res.status === 401) onAuthError();
      return;
    }
    setList(next);
    setDeleteTarget(null);
    setActiveActionMenu(null);
    showNotification("Pooja removed from catalog.");
  };

  const validateCurrentStep = (): boolean => {
    setError("");
    if (currentStep === 1) {
      if (!draft.title.trim()) {
        setError("Puja Name (English) is required.");
        return false;
      }
      if (!draft.slug.trim()) {
        setError("Slug is required.");
        return false;
      }
      if (!/^[a-z0-9-]+$/.test(draft.slug.trim())) {
        setError("Slug must contain lowercase letters, numbers and hyphens only.");
        return false;
      }
      if (list.some((p) => p.slug === draft.slug.trim() && p.slug !== editingSlug)) {
        setError("Another puja is already using this slug.");
        return false;
      }
      if (!draft.description.trim()) {
        setError("Description is required.");
        return false;
      }
    }
    if (currentStep === 3) {
      const price = Number(draft.price);
      if (Number.isNaN(price) || price <= 0) {
        setError("Base Price must be a valid positive number.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < 8) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setError("");
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const autoTranslateHindi = () => {
    if (!draft.title) return;
    // Helpful spiritual translation dictionary for quick transliteration
    const dict: Record<string, string> = {
      "ganesh": "गणेश",
      "shiva": "शिव",
      "rudrabhishek": "रुद्राभिषेक",
      "satyanarayan": "सत्यनारायण",
      "katha": "कथा",
      "pooja": "पूजा",
      "puja": "पूजा",
      "hanuman": "हनुमान",
      "shani": "शनि",
      "dev": "देव",
      "lakshmi": "लक्ष्मी",
      "durga": "दुर्गा",
      "navgraha": "नवग्रह",
      "shanti": "शांति",
      "jap": "जाप",
      "mool": "मूल",
      "mantra": "मंत्र",
      "anushthan": "अनुष्ठान",
    };
    const words = draft.title.toLowerCase().split(/\s+/);
    const translated = words.map((w) => dict[w] || w).join(" ");
    setDraft({ ...draft, hindiTitle: translated.charAt(0).toUpperCase() + translated.slice(1) });
  };

  const savePooja = async () => {
    if (!validateCurrentStep()) return;
    setSaving(true);
    setError("");

    const pooja: Pooja = {
      slug: draft.slug.trim(),
      title: draft.title.trim(),
      hindiTitle: draft.hindiTitle.trim() || draft.title.trim(),
      teluguTitle: draft.teluguTitle.trim() || undefined,
      tamilTitle: draft.tamilTitle.trim() || undefined,
      category: draft.category,
      type: draft.type,
      online: draft.online,
      price: Number(draft.price) || 1101,
      duration: draft.duration.trim() || "1.5 hours",
      bestMuhurat: draft.bestMuhurat.trim() || "Auspicious Muhurat",
      startDate: toISODateString(draft.startDate) || draft.startDate.trim() || "2026-10-04",
      description: draft.description.trim(),
      hindiDescription: draft.hindiDescription.trim() || undefined,
      teluguDescription: draft.teluguDescription.trim() || undefined,
      tamilDescription: draft.tamilDescription.trim() || undefined,
      benefits: draft.benefits.filter(Boolean),
      hindiBenefits: draft.hindiBenefits.filter(Boolean).length > 0 ? draft.hindiBenefits.filter(Boolean) : undefined,
      teluguBenefits: draft.teluguBenefits.filter(Boolean).length > 0 ? draft.teluguBenefits.filter(Boolean) : undefined,
      tamilBenefits: draft.tamilBenefits.filter(Boolean).length > 0 ? draft.tamilBenefits.filter(Boolean) : undefined,
      emoji: draft.emoji.trim() || "🪔",
      gradient: draft.gradient,
      imageUrl: draft.imageUrl.trim() || undefined,
      deities: draft.deities,
      templeSlugs: draft.templeSlugs,
      chadhavaOptions: draft.chadhavaOptions,
      packages: draft.packages.length > 0 ? draft.packages : undefined,
      active: draft.active,
    };

    if (draft.daysFromToday.trim() && !Number.isNaN(Number(draft.daysFromToday))) {
      pooja.daysFromToday = Number(draft.daysFromToday);
      pooja.eventTime = draft.eventTime.trim() || undefined;
      pooja.seats = draft.seats.trim() || undefined;
      if (draft.capacity.trim() && !Number.isNaN(Number(draft.capacity))) {
        pooja.capacity = Number(draft.capacity);
      }
      pooja.live = draft.live;
    }

    const next = editingSlug
      ? list.map((p) => (p.slug === editingSlug ? pooja : p))
      : [...list, pooja];

    const res = await saveCatalogSection("poojas", next, token);
    setSaving(false);

    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Failed to save puja changes.");
      return;
    }

    setList(next);
    setIsWizardOpen(false);
    showNotification(editingSlug ? "Puja updated successfully!" : "New Puja ceremony published!");
  };

  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    CATEGORIES.forEach((c) => set.add(c));
    list.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [list]);

  const dynamicDeities = useMemo(() => {
    const set = new Set<string>();
    AVAILABLE_DEITIES.forEach((d) => set.add(d));
    list.forEach((p) => {
      if (p.deities && Array.isArray(p.deities)) {
        p.deities.forEach((d) => {
          if (d && d.trim()) set.add(d.trim());
        });
      }
    });
    return Array.from(set);
  }, [list]);

  const hasActiveFilters = Boolean(
    search.trim() ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    deityFilter !== "all" ||
    sortBy !== "default"
  );

  const resetAllFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setDeityFilter("all");
    setSortBy("default");
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = list.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.hindiTitle && p.hindiTitle.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.deities && p.deities.some((d) => d.toLowerCase().includes(q)));

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "temple" && (p.type === "temple" || !p.type)) ||
        (typeFilter === "home" && p.type === "home");

      const matchesCat =
        categoryFilter === "all" ||
        (p.category ? p.category.toLowerCase().trim() === categoryFilter.toLowerCase().trim() : false);

      const matchesDeity =
        deityFilter === "all" ||
        (p.deities && p.deities.some((d) => d.toLowerCase().trim() === deityFilter.toLowerCase().trim()));

      const active = isPoojaActive(p);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return matchesSearch && matchesType && matchesCat && matchesDeity && matchesStatus;
    });

    if (sortBy === "name-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }

    return result;
  }, [list, search, typeFilter, categoryFilter, deityFilter, statusFilter, sortBy]);

  const activeCount = list.filter((p) => isPoojaActive(p)).length;
  const inactiveCount = list.filter((p) => !isPoojaActive(p)).length;
  const templeCount = list.filter((p) => p.type === "temple" || !p.type).length;
  const homeCount = list.filter((p) => p.type === "home").length;
  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="space-y-6">
      {/* ────────────────── WIZARD MODAL ────────────────── */}
      {isWizardOpen ? (
        <div className="rounded-3xl border border-saffron-200 bg-white shadow-xl overflow-hidden animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-saffron-100 bg-gradient-to-r from-orange-50/50 via-white to-purple-50/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-saffron-200 bg-white text-ink-soft hover:bg-saffron-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {editingSlug ? "Edit Puja Ceremony" : "Create New Puja"}
                </h2>
                <p className="text-xs text-ink-soft">
                  Add or update a puja ceremony in your digital catalog
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsWizardOpen(false)}
              className="text-ink-soft/60 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[580px]">
            {/* Step Navigation Sidebar */}
            <div className="border-r border-saffron-100 bg-cream/30 p-4 space-y-1.5">
              {WIZARD_STEPS.map((step) => {
                const isCurrent = currentStep === step.id;
                const isPassed = currentStep > step.id;
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (validateCurrentStep()) setCurrentStep(step.id);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-semibold transition-all text-left ${
                      isCurrent
                        ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-500/20"
                        : isPassed
                        ? "bg-white text-saffron-800 border border-saffron-100"
                        : "text-ink-soft hover:bg-white/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{step.label}</span>
                    </div>
                    {isPassed && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            {/* Step Content Form */}
            <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-6 max-w-3xl">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
                    {error}
                  </div>
                )}

                {/* ── STEP 1: Basic Info ── */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-saffron-100">
                      <div>
                        <h3 className="text-base font-bold text-ink">Basic Info & Multilingual Content</h3>
                        <p className="text-xs text-ink-soft">Step 1 of 8 — Enter in English or all 4 languages, or 1-click Auto-Translate</p>
                      </div>
                      <button
                        type="button"
                        onClick={autoTranslateAll}
                        disabled={translatingTarget !== null || (!draft.title.trim() && !draft.description.trim())}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-saffron-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {translatingTarget === "all" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Translating All to 3 Languages…</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>✨ AI Auto-Translate All (Title, Content & Benefits)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* English Title */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-ink">
                            Puja Name (English) *
                          </label>
                          <button
                            type="button"
                            onClick={translateTitleOnly}
                            disabled={translatingTarget !== null || !draft.title.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-saffron-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Translate English name into Hindi, Telugu, and Tamil"
                          >
                            {translatingTarget === "title" ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Translating Name…</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 text-amber-300" />
                                <span>✨ AI Auto-Translate Name</span>
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            const slug = !editingSlug && !draft.slug ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : draft.slug;
                            setDraft({ ...draft, title: val, slug });
                          }}
                          placeholder="e.g. Rahu-Ketu Mool Mantra Jap & Shanti Anushthan"
                          className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                        />
                      </div>

                      {/* 3 Regional Language Titles */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl border border-saffron-100 bg-saffron-50/40">
                        <div>
                          <label className="block text-[11px] font-bold text-saffron-900 mb-1">
                            🇮🇳 हिन्दी Name (Hindi)
                          </label>
                          <input
                            type="text"
                            value={draft.hindiTitle}
                            onChange={(e) => setDraft({ ...draft, hindiTitle: e.target.value })}
                            placeholder="पूजा का नाम (हिंदी)"
                            className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:border-saffron-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-saffron-900 mb-1">
                            🇮🇳 తెలుగు Name (Telugu)
                          </label>
                          <input
                            type="text"
                            value={draft.teluguTitle}
                            onChange={(e) => setDraft({ ...draft, teluguTitle: e.target.value })}
                            placeholder="పూజ పేరు (తెలుగు)"
                            className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:border-saffron-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-saffron-900 mb-1">
                            🇮🇳 தமிழ் Name (Tamil)
                          </label>
                          <input
                            type="text"
                            value={draft.tamilTitle}
                            onChange={(e) => setDraft({ ...draft, tamilTitle: e.target.value })}
                            placeholder="பூஜை பெயர் (தமிழ்)"
                            className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:border-saffron-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Category</label>
                          <select
                            value={draft.category}
                            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                            className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Ritual Type</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, type: "temple" })}
                              className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                                draft.type === "temple"
                                  ? "border-saffron-500 bg-saffron-50 text-saffron-700 shadow-sm"
                                  : "border-slate-200 text-ink-soft hover:bg-slate-50"
                              }`}
                            >
                              🛕 Temple
                            </button>
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, type: "home" })}
                              className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                                draft.type === "home"
                                  ? "border-saffron-500 bg-saffron-50 text-saffron-700 shadow-sm"
                                  : "border-slate-200 text-ink-soft hover:bg-slate-50"
                              }`}
                            >
                              🏠 Home
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* English Description */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-ink">
                            Spiritual Description / Content (English) *
                          </label>
                          <button
                            type="button"
                            onClick={translateDescriptionOnly}
                            disabled={translatingTarget !== null || !draft.description.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-saffron-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Translate English content into Hindi, Telugu, and Tamil"
                          >
                            {translatingTarget === "description" ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Translating Content…</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 text-amber-300" />
                                <span>✨ AI Auto-Translate Content (Hindi, Telugu, Tamil)</span>
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          placeholder="Brings deep mental peace, emotional stability & removes shadow planet dosha..."
                          className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                        />
                      </div>

                      {/* 3 Regional Descriptions */}
                      <div className="space-y-3 p-3.5 rounded-2xl border border-saffron-100 bg-saffron-50/40">
                        <div>
                          <label className="block text-[11px] font-bold text-saffron-900 mb-1">
                            🇮🇳 हिन्दी Description (Hindi)
                          </label>
                          <textarea
                            rows={2}
                            value={draft.hindiDescription}
                            onChange={(e) => setDraft({ ...draft, hindiDescription: e.target.value })}
                            placeholder="पूजा का आध्यात्मिक विवरण (हिंदी)"
                            className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:border-saffron-500 focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-saffron-900 mb-1">
                              🇮🇳 తెలుగు Description (Telugu)
                            </label>
                            <textarea
                              rows={2}
                              value={draft.teluguDescription}
                              onChange={(e) => setDraft({ ...draft, teluguDescription: e.target.value })}
                              placeholder="ఆధ్యాత్మిక వివరాలు (తెలుగు)"
                              className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:border-saffron-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-saffron-900 mb-1">
                              🇮🇳 தமிழ் Description (Tamil)
                            </label>
                            <textarea
                              rows={2}
                              value={draft.tamilDescription}
                              onChange={(e) => setDraft({ ...draft, tamilDescription: e.target.value })}
                              placeholder="ஆன்மீக விளக்கம் (தமிழ்)"
                              className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink focus:border-saffron-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Visibility / Show & Hide Toggle */}
                      <div className="rounded-2xl border border-saffron-200 bg-gradient-to-r from-orange-50/50 to-amber-50/40 p-4 flex items-center justify-between gap-4 shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink">Website Visibility (Show / Hide)</span>
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                draft.active
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-slate-200 text-slate-700 border border-slate-300"
                              }`}
                            >
                              {draft.active ? "🟢 Active (Visible to Devotees)" : "⚪ Hidden (Admin Draft)"}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-soft mt-0.5">
                            {draft.active
                              ? "Visible on the public website and available for devotees to book."
                              : "Hidden from the public website. You can edit this puja anytime and reactivate it for future dates/festivals without recreating it."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, active: !draft.active })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            draft.active ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                          title={draft.active ? "Click to set as hidden" : "Click to set as active"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              draft.active ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Media ── */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-ink">Media & Visual Aesthetics</h3>
                      <p className="text-xs text-ink-soft">Step 2 of 8 — Images, icons, and theme gradients</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Icon / Emoji</label>
                        <input
                          type="text"
                          value={draft.emoji}
                          onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
                          className="w-24 rounded-xl border border-saffron-200 bg-white px-4 py-2 text-center text-2xl focus:border-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Banner Image URL</label>
                        <input
                          type="text"
                          value={draft.imageUrl}
                          onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-2">Theme Gradient</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {GRADIENTS.map((g) => (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => setDraft({ ...draft, gradient: g.value })}
                              className={`h-12 rounded-xl bg-gradient-to-r ${g.value} flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform ${
                                draft.gradient === g.value ? "ring-4 ring-saffron-400 scale-105" : "opacity-85 hover:opacity-100"
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Scheduling ── */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-ink">Pricing & Muhurat Scheduling</h3>
                      <p className="text-xs text-ink-soft">Step 3 of 8 — Set baseline seva cost, duration, and timings</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Base Price (INR) *</label>
                        <input
                          type="number"
                          value={draft.price}
                          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                          className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2.5 text-sm text-ink font-semibold focus:border-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Ritual Duration</label>
                        <input
                          type="text"
                          value={draft.duration}
                          onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
                          placeholder="e.g. 1.5–2 hours"
                          className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Best Shubh Muhurat</label>
                        <input
                          type="text"
                          value={draft.bestMuhurat}
                          onChange={(e) => setDraft({ ...draft, bestMuhurat: e.target.value })}
                          placeholder="e.g. Wednesday & Amavasya"
                          className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink mb-1 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-saffron-600" />
                          Next Scheduled Date (Calendar)
                        </label>
                        <DateInput
                          value={draft.startDate}
                          onChange={(val) => setDraft({ ...draft, startDate: val })}
                          placeholder="Select auspicious date from calendar"
                        />
                        <p className="mt-1 text-[11px] text-ink-soft">
                          Choose the date directly from the calendar. Automatically scheduled for devotee bookings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Availability ── */}
                {currentStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-ink">Availability & Carousel Events</h3>
                      <p className="text-xs text-ink-soft">Step 4 of 8 — Configure live event carousel and capacity</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-saffron-100 bg-cream/40">
                        <input
                          type="checkbox"
                          id="online-toggle"
                          checked={draft.online}
                          onChange={(e) => setDraft({ ...draft, online: e.target.checked })}
                          className="h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500"
                        />
                        <label htmlFor="online-toggle" className="text-xs font-bold text-ink cursor-pointer">
                          🔴 Online Livestream Participation Available
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-ink mb-1 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-saffron-600" />
                            Carousel Event Date (Calendar)
                          </label>
                          <DateInput
                            value={draft.daysFromToday ? daysFromTodayToDate(draft.daysFromToday) : ""}
                            onChange={(val) => {
                              if (!val) {
                                setDraft({ ...draft, daysFromToday: "" });
                              } else {
                                const days = dateToDaysFromToday(val);
                                setDraft({ ...draft, daysFromToday: String(days) });
                              }
                            }}
                            placeholder="Select live event date from calendar"
                          />
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-ink-soft">
                            <span>Or Days from Today:</span>
                            <input
                              type="number"
                              min={0}
                              max={90}
                              value={draft.daysFromToday}
                              onChange={(e) => setDraft({ ...draft, daysFromToday: e.target.value })}
                              placeholder="e.g. 5"
                              className="w-20 rounded-lg border border-saffron-200 bg-white px-2.5 py-1 text-xs text-ink focus:border-saffron-500 focus:outline-none"
                            />
                            <span className="text-ink-soft/70">(auto-synced)</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Event Timing</label>
                          <input
                            type="text"
                            value={draft.eventTime}
                            onChange={(e) => setDraft({ ...draft, eventTime: e.target.value })}
                            placeholder="e.g. 7:00 PM IST"
                            className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Max Devotee Capacity</label>
                          <input
                            type="number"
                            value={draft.capacity}
                            onChange={(e) => setDraft({ ...draft, capacity: e.target.value })}
                            placeholder="e.g. 50"
                            className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">Seats Label</label>
                          <input
                            type="text"
                            value={draft.seats}
                            onChange={(e) => setDraft({ ...draft, seats: e.target.value })}
                            placeholder="e.g. Only 12 seats left"
                            className="w-full rounded-xl border border-saffron-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 5: Relationships (Matching Screenshot 5) ── */}
                {currentStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-ink">Relationships</h3>
                      <p className="text-xs text-ink-soft">Step 5 of 8 — Connect Deities, Chadhavas, and Temples</p>
                    </div>

                    <div className="space-y-4">
                      {/* Deities Multi-Select */}
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1.5">
                          Presiding Deities
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_DEITIES.map((deity) => {
                            const selected = draft.deities.includes(deity);
                            return (
                              <button
                                key={deity}
                                type="button"
                                onClick={() => {
                                  const deities = selected
                                    ? draft.deities.filter((d) => d !== deity)
                                    : [...draft.deities, deity];
                                  setDraft({ ...draft, deities });
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                  selected
                                    ? "bg-purple-600 text-white shadow-sm"
                                    : "bg-slate-100 text-ink-soft hover:bg-slate-200"
                                }`}
                              >
                                {deity} {selected && "✓"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Temples Selection */}
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1.5">
                          Sacred Temples
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {temples.map((temple) => {
                            const selected = draft.templeSlugs.includes(temple.slug);
                            return (
                              <button
                                key={temple.slug}
                                type="button"
                                onClick={() => {
                                  const templeSlugs = selected
                                    ? draft.templeSlugs.filter((s) => s !== temple.slug)
                                    : [...draft.templeSlugs, temple.slug];
                                  setDraft({ ...draft, templeSlugs });
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                  selected
                                    ? "bg-purple-700 text-white shadow-sm"
                                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                                }`}
                              >
                                🛕 {temple.name} ({temple.city}) {selected && "✕"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Chadhava Offerings */}
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1.5">
                          Chadhava & Seva Offerings
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {CHADHAVA_OFFERINGS.map((chadhava) => {
                            const selected = draft.chadhavaOptions.includes(chadhava);
                            return (
                              <button
                                key={chadhava}
                                type="button"
                                onClick={() => {
                                  const chadhavaOptions = selected
                                    ? draft.chadhavaOptions.filter((c) => c !== chadhava)
                                    : [...draft.chadhavaOptions, chadhava];
                                  setDraft({ ...draft, chadhavaOptions });
                                }}
                                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                                  selected
                                    ? "bg-purple-800 text-white shadow-sm"
                                    : "bg-slate-100 text-ink-soft hover:bg-slate-200"
                                }`}
                              >
                                🌸 {chadhava} {selected && "✓"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 6: Content ── */}
                {currentStep === 6 && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-saffron-100">
                      <div>
                        <h3 className="text-base font-bold text-ink">Content & Spiritual Benefits</h3>
                        <p className="text-xs text-ink-soft">Step 6 of 8 — Benefits devotees receive (available in all 4 languages)</p>
                      </div>
                      <button
                        type="button"
                        onClick={autoTranslateAll}
                        disabled={isTranslating || draft.benefits.length === 0}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-saffron-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {isTranslating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Translating…</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>✨ AI Translate Benefits</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* English Benefits */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-ink">
                          Devotee Benefits (English)
                        </label>
                        <button
                          type="button"
                          onClick={translateBenefitsOnly}
                          disabled={translatingTarget !== null || draft.benefits.length === 0}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-saffron-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Translate English benefits into Hindi, Telugu, and Tamil"
                        >
                          {translatingTarget === "benefits" ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Translating Benefits…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 text-amber-300" />
                              <span>✨ AI Auto-Translate Benefits (Hindi, Telugu, Tamil)</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newBenefit}
                          onChange={(e) => setNewBenefit(e.target.value)}
                          placeholder="e.g. Removal of planetary obstacles and bad dreams"
                          className="flex-1 rounded-xl border border-saffron-200 bg-white px-4 py-2 text-sm text-ink focus:border-saffron-500 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (!newBenefit.trim()) return;
                              setDraft({ ...draft, benefits: [...draft.benefits, newBenefit.trim()] });
                              setNewBenefit("");
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newBenefit.trim()) return;
                            setDraft({ ...draft, benefits: [...draft.benefits, newBenefit.trim()] });
                            setNewBenefit("");
                          }}
                          className="rounded-xl bg-saffron-500 px-4 py-2 text-xs font-bold text-white hover:bg-saffron-600"
                        >
                          + Add
                        </button>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {draft.benefits.map((benefit, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl bg-saffron-50/60 px-3 py-1.5 text-xs text-ink font-medium border border-saffron-100"
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="h-3 w-3 text-amber-500" />
                              {benefit}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = draft.benefits.filter((_, i) => i !== idx);
                                setDraft({ ...draft, benefits: next });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Regional Language Translated Benefits Display */}
                    {(draft.hindiBenefits.length > 0 || draft.teluguBenefits.length > 0 || draft.tamilBenefits.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl border border-saffron-100 bg-saffron-50/30">
                        {/* Hindi Benefits */}
                        <div>
                          <span className="block text-[11px] font-bold text-saffron-900 mb-1.5">
                            🇮🇳 हिन्दी Benefits ({draft.hindiBenefits.length})
                          </span>
                          <div className="space-y-1">
                            {draft.hindiBenefits.map((b, i) => (
                              <div key={i} className="rounded-lg bg-white px-2.5 py-1 text-[11px] text-ink border border-saffron-100">
                                {b}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Telugu Benefits */}
                        <div>
                          <span className="block text-[11px] font-bold text-saffron-900 mb-1.5">
                            🇮🇳 తెలుగు Benefits ({draft.teluguBenefits.length})
                          </span>
                          <div className="space-y-1">
                            {draft.teluguBenefits.map((b, i) => (
                              <div key={i} className="rounded-lg bg-white px-2.5 py-1 text-[11px] text-ink border border-saffron-100">
                                {b}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tamil Benefits */}
                        <div>
                          <span className="block text-[11px] font-bold text-saffron-900 mb-1.5">
                            🇮🇳 தமிழ் Benefits ({draft.tamilBenefits.length})
                          </span>
                          <div className="space-y-1">
                            {draft.tamilBenefits.map((b, i) => (
                              <div key={i} className="rounded-lg bg-white px-2.5 py-1 text-[11px] text-ink border border-saffron-100">
                                {b}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 7: Packages ── */}
                {currentStep === 7 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-ink">Packages & Seva Tiers</h3>
                      <p className="text-xs text-ink-soft">Step 7 of 8 — Individual, Couple, and Family packages</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3.5 rounded-2xl border border-saffron-100 bg-cream/40">
                        <input
                          type="text"
                          value={newPackage.name}
                          onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                          placeholder="Package Name"
                          className="rounded-lg border border-saffron-200 bg-white px-3 py-1.5 text-xs text-ink focus:outline-none"
                        />
                        <input
                          type="number"
                          value={newPackage.price}
                          onChange={(e) => setNewPackage({ ...newPackage, price: Number(e.target.value) || 0 })}
                          placeholder="Price"
                          className="rounded-lg border border-saffron-200 bg-white px-3 py-1.5 text-xs text-ink focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newPackage.name.trim()) return;
                            setDraft({ ...draft, packages: [...draft.packages, newPackage] });
                            setNewPackage({ name: "", price: 501, description: "" });
                          }}
                          className="rounded-lg bg-saffron-500 py-1.5 text-xs font-bold text-white hover:bg-saffron-600"
                        >
                          + Add Package Tier
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {draft.packages.map((pkg, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-ink">{pkg.name}</h4>
                                <span className="font-bold text-saffron-700 text-xs">
                                  {formatINR(pkg.price)}
                                </span>
                              </div>
                              {pkg.description && (
                                <p className="text-[11px] text-ink-soft mt-1">{pkg.description}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const next = draft.packages.filter((_, i) => i !== idx);
                                setDraft({ ...draft, packages: next });
                              }}
                              className="mt-3 text-[11px] text-red-500 font-semibold self-end hover:underline"
                            >
                              Remove Tier
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 8: Review & Publish ── */}
                {currentStep === 8 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-ink">Review & Confirmation</h3>
                      <p className="text-xs text-ink-soft">Step 8 of 8 — Verify everything before publishing</p>
                    </div>

                    <div className="rounded-2xl border border-saffron-200 bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{draft.emoji}</span>
                          <div>
                            <h4 className="text-base font-bold text-ink">{draft.title}</h4>
                            <p className="text-xs font-medium text-saffron-700">{draft.hindiTitle}</p>
                          </div>
                        </div>
                        <span className="text-base font-bold text-saffron-700">
                          {formatINR(Number(draft.price) || 0)}
                        </span>
                      </div>

                      <p className="text-xs text-ink-soft border-t border-saffron-100 pt-3">
                        {draft.description}
                      </p>

                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-md bg-saffron-100 px-2 py-1 font-semibold text-saffron-800">
                          📁 {draft.category}
                        </span>
                        <span className="rounded-md bg-purple-100 px-2 py-1 font-semibold text-purple-800">
                          🛕 {draft.type === "temple" ? "Temple Puja" : "Home Puja"}
                        </span>
                        <span className="rounded-md bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
                          {draft.online ? "🔴 Online" : "📍 In-Person"}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-ink-soft">
                          🕒 {draft.duration}
                        </span>
                      </div>

                      {/* Status Confirmation Card */}
                      <div className="rounded-xl border border-saffron-200 bg-white p-3.5 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink">Publish Status</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                draft.active
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {draft.active ? "🟢 Active (Visible on site)" : "⚪ Inactive (Hidden)"}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-soft mt-0.5">
                            {draft.active
                              ? "Will appear immediately on the website for devotees to book."
                              : "Will be saved as hidden draft in admin catalog. Devotees won't see it."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, active: !draft.active })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            draft.active ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              draft.active ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-saffron-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-200 px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-saffron-50 disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-ink-soft hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  {currentStep < 8 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 px-5 py-2 text-xs font-bold text-white hover:bg-saffron-600 shadow-md shadow-saffron-500/20"
                    >
                      Next Step <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={savePooja}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-2.5 text-xs font-bold text-white hover:from-saffron-600 hover:to-saffron-700 shadow-md shadow-saffron-500/20 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : editingSlug ? "Save Changes" : "Publish Ceremony"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ────────────────── CATALOG TABLE VIEW (Matching Screenshot 1) ────────────────── */
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                Puja Catalog
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Manage your puja ceremonies with advanced filtering and bulk actions
              </p>
            </div>
            <button
              type="button"
              onClick={startAdd}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700"
            >
              <Plus className="h-4 w-4" />
              + New Puja
            </button>
          </div>

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 animate-fadeIn">
              <Check className="h-4 w-4 text-emerald-600" />
              {success}
            </div>
          )}

          {/* ── Enhanced 2-Row Filter & Search Console ── */}
          <div className="bg-white rounded-3xl border border-saffron-100 shadow-sm p-4 space-y-3.5">
            {/* Row 1: Search Bar & Sort & Metrics */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Spacious Full Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-saffron-600/60" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search pujas by name, deity, category, benefits or slug..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl border border-saffron-200 bg-cream/30 text-ink placeholder:text-ink-soft/50 focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-100 transition-all font-medium"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft/40 hover:text-ink p-0.5 rounded-md"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown & Result Count */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 text-saffron-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:border-saffron-500 focus:outline-none shadow-xs"
                  >
                    <option value="default">Default Order</option>
                    <option value="name-asc">Name (A → Z)</option>
                    <option value="name-desc">Name (Z → A)</option>
                    <option value="price-asc">Price (Low → High)</option>
                    <option value="price-desc">Price (High → Low)</option>
                  </select>
                </div>

                <div className="flex items-center rounded-xl bg-saffron-50 px-3 py-2 text-xs font-bold text-saffron-900 border border-saffron-200 whitespace-nowrap">
                  {filtered.length} of {list.length} Pujas
                </div>
              </div>
            </div>

            {/* Row 2: Filter Controls (Status, Type, Category, Deity) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-saffron-100/70">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Segmented Control */}
                <div className="inline-flex rounded-xl bg-cream/70 p-1 border border-saffron-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setStatusFilter("all"); setPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      statusFilter === "all"
                        ? "bg-white text-saffron-900 shadow-xs font-bold"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    All ({list.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusFilter("active"); setPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      statusFilter === "active"
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-emerald-700 hover:text-emerald-800"
                    }`}
                  >
                    🟢 Active ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusFilter("inactive"); setPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      statusFilter === "inactive"
                        ? "bg-slate-700 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    ⚪ Hidden ({inactiveCount})
                  </button>
                </div>

                {/* Type Filter */}
                <div className="inline-flex rounded-xl bg-cream/70 p-1 border border-saffron-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setTypeFilter("all"); setPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      typeFilter === "all"
                        ? "bg-white text-saffron-900 shadow-xs font-bold"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter("temple"); setPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      typeFilter === "temple"
                        ? "bg-saffron-500 text-white shadow-xs font-bold"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    🛕 Temple ({templeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTypeFilter("home"); setPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      typeFilter === "home"
                        ? "bg-saffron-500 text-white shadow-xs font-bold"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    🏠 Home ({homeCount})
                  </button>
                </div>

                {/* Dynamic Category Dropdown with Item Counts */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold focus:outline-none transition-all shadow-xs ${
                      categoryFilter !== "all"
                        ? "border-saffron-500 bg-saffron-50 text-saffron-900 ring-1 ring-saffron-400 font-bold"
                        : "border-saffron-200 bg-white text-ink-soft hover:border-saffron-400"
                    }`}
                  >
                    <option value="all">📁 All Categories</option>
                    {dynamicCategories.map((cat) => {
                      const count = list.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} {count > 0 ? `(${count})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Dynamic Deity Dropdown */}
                <div className="relative">
                  <select
                    value={deityFilter}
                    onChange={(e) => {
                      setDeityFilter(e.target.value);
                      setPage(1);
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold focus:outline-none transition-all shadow-xs ${
                      deityFilter !== "all"
                        ? "border-purple-500 bg-purple-50 text-purple-900 ring-1 ring-purple-400 font-bold"
                        : "border-saffron-200 bg-white text-ink-soft hover:border-saffron-400"
                    }`}
                  >
                    <option value="all">🔱 All Deities</option>
                    {dynamicDeities.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset Filters Action Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-all shrink-0"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Filters
                </button>
              )}
            </div>

            {/* Active Filters Summary Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-saffron-100/60 text-xs">
                <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mr-1">
                  Active Filters:
                </span>
                {search && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-saffron-100/80 px-2 py-0.5 text-xs font-semibold text-saffron-900">
                    Query: &ldquo;{search}&rdquo;
                    <button type="button" onClick={() => { setSearch(""); setPage(1); }}>
                      <X className="h-3 w-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-saffron-100/80 px-2 py-0.5 text-xs font-semibold text-saffron-900">
                    Status: {statusFilter === "active" ? "Active" : "Hidden"}
                    <button type="button" onClick={() => { setStatusFilter("all"); setPage(1); }}>
                      <X className="h-3 w-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {typeFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-saffron-100/80 px-2 py-0.5 text-xs font-semibold text-saffron-900">
                    Type: {typeFilter === "temple" ? "Temple" : "Home"}
                    <button type="button" onClick={() => { setTypeFilter("all"); setPage(1); }}>
                      <X className="h-3 w-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {categoryFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-saffron-100/80 px-2 py-0.5 text-xs font-semibold text-saffron-900">
                    Category: {categoryFilter}
                    <button type="button" onClick={() => { setCategoryFilter("all"); setPage(1); }}>
                      <X className="h-3 w-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {deityFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100/80 px-2 py-0.5 text-xs font-semibold text-purple-900">
                    Deity: {deityFilter}
                    <button type="button" onClick={() => { setDeityFilter("all"); setPage(1); }}>
                      <X className="h-3 w-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {sortBy !== "default" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                    Sorted: {sortBy}
                    <button type="button" onClick={() => { setSortBy("default"); setPage(1); }}>
                      <X className="h-3 w-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink">
                <thead className="border-b border-saffron-100 bg-cream/40 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">Icon</th>
                    <th className="px-4 py-3.5">Puja Details</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5 text-center">Status (Show/Hide)</th>
                    <th className="px-4 py-3.5 text-center">Format</th>
                    <th className="px-4 py-3.5">Price & Muhurat</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-saffron-50">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-ink-soft">
                        <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-50 border border-saffron-200 text-2xl">
                            🔍
                          </div>
                          <h4 className="text-sm font-bold text-ink">No pujas match your filters</h4>
                          <p className="text-xs text-ink-soft">
                            We couldn&apos;t find any puja ceremonies matching your current filter combination.
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={resetAllFilters}
                              className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-saffron-600 transition-all"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reset All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((pooja) => {
                      const active = isPoojaActive(pooja);
                      return (
                        <tr
                          key={pooja.slug}
                          className={`transition-colors ${
                            active
                              ? "hover:bg-orange-50/30"
                              : "bg-slate-50/50 opacity-80 hover:bg-slate-100/50"
                          }`}
                        >
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-100 text-lg shadow-sm">
                              {pooja.emoji}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-ink text-xs leading-snug">
                                {pooja.title}
                              </span>
                              {!active && (
                                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                                  HIDDEN
                                </span>
                              )}
                            </div>
                            {pooja.hindiTitle && (
                              <div className="text-[11px] text-saffron-700 font-medium">
                                {pooja.hindiTitle}
                              </div>
                            )}
                            <div className="text-[10px] text-ink-soft/70 line-clamp-1 mt-0.5">
                              {pooja.description}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink-soft border border-saffron-100">
                              {pooja.category ?? "Rashifal Pooja"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {/* Interactive Toggle Switch Button */}
                            <button
                              type="button"
                              onClick={() => toggleStatus(pooja.slug)}
                              className={`group inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold transition-all shadow-sm ${
                                active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
                              }`}
                              title={
                                active
                                  ? "🟢 Active & Visible on website. Click to Hide/Deactivate."
                                  : "⚪ Hidden from website. Click to Show/Activate."
                              }
                            >
                              <span
                                className={`relative inline-block h-3.5 w-6 rounded-full transition-colors ${
                                  active ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform ${
                                    active ? "translate-x-2.5" : "translate-x-0"
                                  }`}
                                />
                              </span>
                              <span>{active ? "Active" : "Hidden"}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-saffron-800">
                              {pooja.online !== false ? "Online" : "Temple"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-ink">
                              {formatINR(pooja.price)}
                            </div>
                            <div className="text-[10px] text-ink-soft">
                              {pooja.bestMuhurat || "Auspicious"}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right relative">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => startEdit(pooja)}
                                className="p-1.5 rounded-lg border border-saffron-200 text-saffron-700 hover:bg-saffron-100"
                                title="Edit Puja Details & Settings"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(pooja)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                                title="Delete Puja Ceremony"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Matching Screenshot 1) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-saffron-100 px-4 py-3 bg-cream/20 text-xs text-ink-soft">
              <div>
                Showing {filtered.length > 0 ? (page - 1) * rowsPerPage + 1 : 0} to{" "}
                {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} results
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
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Puja Ceremony"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? Existing devotee booking history will remain historically valid.`}
        confirmLabel="Yes, Delete Puja"
        danger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
