"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Star, MessageSquareQuote, Sparkles, Heart, ChevronRight, Loader2 } from "lucide-react";
import { SectionHeading } from "@/components/common";
import { useI18n } from "@/components/providers";
import type { PublicFeedbackItem } from "@/lib/feedback-store";

export default function Testimonials() {
  const { t } = useI18n();
  const [feedbackList, setFeedbackList] = useState<PublicFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadFeedback = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback", {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.feedback)) {
          setFeedbackList(json.feedback);
        }
      }
    } catch (err) {
      console.warn("[Testimonials] Error fetching live feedback:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();

    const handleUpdate = () => {
      void loadFeedback();
    };

    window.addEventListener("feedback-updated", handleUpdate);
    window.addEventListener("catalog-updated", handleUpdate);
    return () => {
      window.removeEventListener("feedback-updated", handleUpdate);
      window.removeEventListener("catalog-updated", handleUpdate);
    };
  }, [loadFeedback]);

  // Sacred Avatar color gradients
  const getAvatarGradient = (index: number) => {
    const gradients = [
      "from-amber-400 to-orange-600",
      "from-rose-400 to-pink-600",
      "from-emerald-400 to-teal-600",
      "from-purple-400 to-indigo-600",
      "from-saffron-500 to-amber-700",
    ];
    return gradients[index % gradients.length];
  };

  const getInitials = (name: string) => {
    if (!name) return "🪔";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <section
      id="testimonials"
      className="section-pad bg-gradient-to-b from-cream via-white to-cream overflow-hidden"
    >
      <div className="container-px">
        <SectionHeading
          eyebrow={t("testimonials.title") || "Devotee Experiences"}
          title={`${t("testimonials.title") || "Divine"} ${t("testimonials.titleHighlight") || "Experiences & Blessings"}`}
          subtitle={
            t("testimonials.subtitle") ||
            "Authentic reviews and spiritual experiences shared by devotees across India who booked Vedic rituals through TemplePujaSewa."
          }
        />

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100/60" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-amber-100/60 rounded-md w-28" />
                    <div className="h-3 bg-amber-50 rounded-md w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-md w-full" />
                  <div className="h-3 bg-slate-100 rounded-md w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State when no approved feedback exists yet */}
        {!isLoading && feedbackList.length === 0 && (
          <div className="mt-10 text-center max-w-lg mx-auto p-8 rounded-3xl bg-amber-50/60 border border-amber-200/80 shadow-xs space-y-4">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-saffron-100 text-saffron-700 shadow-xs">
              <Sparkles className="h-7 w-7 text-saffron-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-ink">
                Be the First Devotee to Share Your Blessings
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                Have you participated in our temple or home pujas? We would be honoured to hear your spiritual thoughts.
              </p>
            </div>
            <a
              href="#feedback"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold text-xs shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 transition-all"
            >
              <span>Share Your Feedback</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Dynamic Approved Feedback Grid */}
        {!isLoading && feedbackList.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbackList.map((item, idx) => {
              const isLong = item.message.length > 200;
              const isExpanded = expandedId === item.id;
              const displayMessage = isLong && !isExpanded ? `${item.message.slice(0, 200)}...` : item.message;

              return (
                <div
                  key={item.id}
                  className="relative flex flex-col justify-between rounded-3xl border border-saffron-200/70 bg-white p-6 sm:p-7 shadow-card hover:shadow-lg hover:border-saffron-300 transition-all duration-300 group"
                >
                  <div>
                    {/* Top Header: Avatar + Name + Date + Rating */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                            idx
                          )} text-white font-bold text-sm shadow-md shadow-saffron-500/20 shrink-0`}
                        >
                          {getInitials(item.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-ink text-sm sm:text-base truncate group-hover:text-saffron-900 transition-colors">
                            {item.name}
                          </h4>
                          {item.createdAt && (
                            <p className="text-[11px] text-ink-soft/70">
                              {formatDate(item.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Featured Badge */}
                      {item.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] shrink-0 border border-amber-200 shadow-2xs">
                          <Sparkles className="h-2.5 w-2.5 text-amber-600" /> Featured
                        </span>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-3.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (item.rating || 5)
                              ? "fill-amber-400 text-amber-400 drop-shadow-2xs"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-900 ml-1.5">
                        {item.rating || 5}.0
                      </span>
                    </div>

                    {/* Feedback Message */}
                    <p className="text-xs sm:text-sm text-ink-soft leading-relaxed italic relative">
                      <span className="text-saffron-500/40 font-serif text-2xl leading-none select-none -ml-1">
                        &ldquo;
                      </span>
                      {displayMessage}
                      <span className="text-saffron-500/40 font-serif text-2xl leading-none select-none">
                        &rdquo;
                      </span>
                    </p>

                    {/* Read More / Read Less Toggle */}
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-[11px] font-bold text-saffron-700 hover:text-saffron-800 mt-2 block"
                      >
                        {isExpanded ? "Show less" : "Read full review"}
                      </button>
                    )}
                  </div>

                  {/* Sacred Verification Footer */}
                  <div className="mt-5 pt-4 border-t border-saffron-100/70 flex items-center justify-between text-[11px] text-saffron-900/80 font-medium">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <Heart className="h-3 w-3 fill-emerald-600 text-emerald-600" /> Verified Devotee Seva
                    </span>
                    <span className="text-ink-soft/60">Vedic Rituals</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
