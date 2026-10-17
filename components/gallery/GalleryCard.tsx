"use client";

import Image from "next/image";
import { Camera, Play, Sparkles } from "lucide-react";
import type { GalleryItem } from "@/lib/gallery-types";

interface GalleryCardProps {
  item: GalleryItem;
  onOpen: (item: GalleryItem) => void;
  priority?: boolean;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function GalleryCard({ item, onOpen, priority = false }: GalleryCardProps) {
  const isVideo = item.mediaType === "video";
  const hasYouTube = Boolean(isVideo && item.youtubeUrl && item.youtubeVideoId);
  const displayImage = item.thumbnailUrl || item.imageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80";

  return (
    <div
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      aria-label={`View ${item.title} (${isVideo ? "Video" : "Photo"})`}
      className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-saffron-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-saffron-400 hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:ring-offset-2"
    >
      {/* Media Image / Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900/5">
        <Image
          src={displayImage}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Subtle Dark Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

        {/* Top Badges: Category & Media Type */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs border border-white/20">
            <Sparkles className="h-3 w-3 text-saffron-400" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">{item.category}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {/* YouTube Recognition Badge */}
            {hasYouTube && (
              <span
                title="Watch on YouTube"
                className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md border border-white/20 animate-fadeIn"
              >
                {/* Authentic YouTube Play SVG */}
                <svg
                  className="h-3 w-3 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="hidden xs:inline">YouTube</span>
              </span>
            )}

            {/* Media Type / Duration Pill */}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-ink shadow-xs border border-white/60">
              {isVideo ? (
                <>
                  <Play className="h-3 w-3 text-saffron-600 fill-saffron-600" />
                  <span>{item.videoDurationSeconds ? formatDuration(item.videoDurationSeconds) : "Video"}</span>
                </>
              ) : (
                <>
                  <Camera className="h-3 w-3 text-saffron-600" />
                  <span>Photo</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Center Video Play Button Overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-500/90 text-white shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-115 group-hover:bg-saffron-600 ring-4 ring-white/30">
              <Play className="h-6 w-6 fill-white ml-0.5" />
            </span>
          </div>
        )}

        {/* Bottom Title on Image for Mobile / Compact Views */}
        <div className="absolute bottom-0 inset-x-0 p-4 text-white">
          <h3 className="font-display text-base sm:text-lg font-bold leading-tight drop-shadow-sm group-hover:text-amber-200 transition-colors">
            {item.title}
          </h3>
        </div>
      </div>

      {/* Card Body: Description and Details */}
      <div className="flex flex-1 flex-col justify-between p-4 bg-white">
        <p className="text-xs sm:text-sm text-ink-soft line-clamp-2 leading-relaxed">
          {item.description || "Sacred Vedic rituals and spiritual moments consecrated by certified Acharyas."}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-saffron-100/70 pt-2.5 text-xs">
          <span className="font-semibold text-saffron-700 group-hover:text-saffron-900 transition-colors inline-flex items-center gap-1">
            {isVideo ? "Watch Sacred Video" : "View Photo"} →
          </span>

          {item.isDemo && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Demo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
