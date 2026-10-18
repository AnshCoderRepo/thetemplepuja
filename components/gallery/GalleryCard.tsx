"use client";

import Image from "next/image";
import { Camera, Play, Sparkles } from "lucide-react";
import {
  type GalleryItem,
  getGalleryItemImages,
  getGalleryItemVideos,
  hasYouTubeVideo,
  getYouTubeThumbnailUrl,
} from "@/lib/gallery-types";

export interface GalleryCardOpenOptions {
  initialTab?: "photos" | "video";
  photoIndex?: number;
}

interface GalleryCardProps {
  item: GalleryItem;
  onOpen: (item: GalleryItem, options?: GalleryCardOpenOptions) => void;
  priority?: boolean;
}

export default function GalleryCard({ item, onOpen, priority = false }: GalleryCardProps) {
  const photos = getGalleryItemImages(item);
  const videos = getGalleryItemVideos(item);
  const hasVideo = videos.length > 0;
  const hasYouTube = videos.some((v) => v.isYouTube) || hasYouTubeVideo(item);

  const handleCardClick = () => {
    // If the card has photos, open on photos; if video only, open on video
    if (photos.length > 0) {
      onOpen(item, { initialTab: "photos", photoIndex: 0 });
    } else {
      onOpen(item, { initialTab: "video" });
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen(item, { initialTab: "video" });
  };

  const handlePhotoClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onOpen(item, { initialTab: "photos", photoIndex: index });
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`View gallery card ${item.title}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-saffron-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-saffron-400 hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:ring-offset-2"
    >
      {/* ────────────────── RESPONSIVE MEDIA CONTAINER (UNLIMITED PHOTOS & VIDEOS) ────────────────── */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-slate-900/10">
        {/* ── 3 OR MORE PHOTOS COLLAGE ── */}
        {photos.length >= 3 && (
          <div className="grid grid-cols-3 gap-1 h-full w-full">
            {/* Main Primary Photo (2 Columns Wide) */}
            <div
              className="col-span-2 relative h-full overflow-hidden cursor-pointer"
              onClick={(e) => handlePhotoClick(e, 0)}
              title="Click to view photo 1"
            >
              <Image
                src={photos[0]}
                alt={`${item.title} - photo 1`}
                fill
                sizes="(max-width: 640px) 66vw, (max-width: 1024px) 33vw, 22vw"
                priority={priority}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>

            {/* 2 Stacked Supporting Photos (1 Column Wide) */}
            <div className="col-span-1 grid grid-rows-2 gap-1 h-full">
              <div
                className="relative h-full overflow-hidden cursor-pointer"
                onClick={(e) => handlePhotoClick(e, 1)}
                title="Click to view photo 2"
              >
                <Image
                  src={photos[1]}
                  alt={`${item.title} - photo 2`}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 11vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
              <div
                className="relative h-full overflow-hidden cursor-pointer group/more"
                onClick={(e) => handlePhotoClick(e, 2)}
                title={photos.length > 3 ? `View all ${photos.length} photos` : "Click to view photo 3"}
              >
                <Image
                  src={photos[2]}
                  alt={`${item.title} - photo 3`}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 11vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                {photos.length > 3 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white transition-colors group-hover/more:bg-black/75">
                    <span className="font-extrabold text-xs sm:text-sm md:text-base leading-none">
                      +{photos.length - 2}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-amber-300">
                      More
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 2 PHOTOS SIDE-BY-SIDE ── */}
        {photos.length === 2 && (
          <div className="grid grid-cols-2 gap-1 h-full w-full">
            <div
              className="relative h-full overflow-hidden cursor-pointer"
              onClick={(e) => handlePhotoClick(e, 0)}
              title="Click to view photo 1"
            >
              <Image
                src={photos[0]}
                alt={`${item.title} - photo 1`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                priority={priority}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <div
              className="relative h-full overflow-hidden cursor-pointer"
              onClick={(e) => handlePhotoClick(e, 1)}
              title="Click to view photo 2"
            >
              <Image
                src={photos[1]}
                alt={`${item.title} - photo 2`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
          </div>
        )}

        {/* ── 1 PHOTO FULL BLEED ── */}
        {photos.length === 1 && (
          <div
            className="relative h-full w-full overflow-hidden cursor-pointer"
            onClick={(e) => handlePhotoClick(e, 0)}
            title="Click to view photo"
          >
            <Image
              src={photos[0]}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        )}

        {/* ── 0 PHOTOS (Fallback to Video Thumbnail) ── */}
        {photos.length === 0 && (
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={
                item.thumbnailUrl ||
                (item.youtubeVideoId ? getYouTubeThumbnailUrl(item.youtubeVideoId) || "/logo.jpeg" : "/logo.jpeg")
              }
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        )}

        {/* Dark Gradient Overlay for Badges & Title Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />

        {/* ── TOP BADGES: Category + YouTube / Photos Count ── */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          {/* Category Pill */}
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white shadow-xs border border-white/20">
            <Sparkles className="h-3 w-3 text-saffron-400 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-[150px]">{item.category}</span>
          </span>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* If video is provided: show Video Button */}
            {hasVideo && (
              <button
                type="button"
                onClick={handleVideoClick}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white shadow-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title={videos.length > 1 ? `Play ${videos.length} Videos` : "Play Video"}
                aria-label={`Play video for ${item.title}`}
              >
                {/* Authentic YouTube / Video Icon */}
                <svg className="h-3.5 w-3.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>{videos.length > 1 ? `${videos.length} Videos` : "Video"}</span>
              </button>
            )}

            {/* Photos Count Pill */}
            {photos.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-ink shadow-xs border border-white/60">
                <Camera className="h-3 w-3 text-saffron-600" />
                <span>{photos.length} {photos.length === 1 ? "Photo" : "Photos"}</span>
              </span>
            )}
          </div>
        </div>

        {/* ── VIDEO PLAY BUTTON (Only if video is provided) ── */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={handleVideoClick}
              className="pointer-events-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-red-600/90 text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-115 hover:bg-red-600 ring-4 ring-white/30 cursor-pointer"
              title={videos.length > 1 ? `Play ${videos.length} Videos` : "Play Video"}
              aria-label={`Play Video for ${item.title}`}
            >
              <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-white ml-0.5" />
            </button>
          </div>
        )}

        {/* Bottom Title on Media Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-3.5 text-white pointer-events-none">
          <h3 className="font-display text-sm sm:text-base md:text-lg font-bold leading-tight drop-shadow-sm group-hover:text-amber-200 transition-colors line-clamp-1">
            {item.title}
          </h3>
        </div>
      </div>

      {/* ────────────────── CARD BODY ────────────────── */}
      <div className="flex flex-1 flex-col justify-between p-4 bg-white">
        <p className="text-xs sm:text-sm text-ink-soft line-clamp-2 leading-relaxed">
          {item.description || "Sacred Vedic rituals and spiritual moments consecrated by certified Acharyas."}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-saffron-100/70 pt-2.5 text-xs">
          <span className="font-semibold text-saffron-700 group-hover:text-saffron-900 transition-colors inline-flex items-center gap-1">
            {hasVideo && photos.length > 0
              ? `View ${photos.length} ${photos.length === 1 ? "Photo" : "Photos"} & ${videos.length} ${videos.length === 1 ? "Video" : "Videos"} →`
              : hasVideo
              ? (videos.length > 1 ? `Watch ${videos.length} Sacred Videos →` : "Watch Sacred Video →")
              : `View ${photos.length} ${photos.length === 1 ? "Photo" : "Photos"} →`}
          </span>
        </div>
      </div>
    </div>
  );
}
