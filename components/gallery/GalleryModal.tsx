"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Sparkles,
  ExternalLink,
  Play,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Film,
  RotateCw,
  AlertCircle,
} from "lucide-react";
import {
  type GalleryItem,
  getGalleryItemImages,
  getGalleryItemVideos,
  hasYouTubeVideo,
  getYouTubeThumbnailUrl,
  isValidYouTubeVideoId,
  extractYouTubeVideoId,
  buildYouTubeEmbedUrl,
  buildYouTubeWatchUrl,
} from "@/lib/gallery-types";
import { useBookingModal } from "@/components/providers";

interface GalleryModalProps {
  item: GalleryItem | null;
  onClose: () => void;
  initialTab?: "photos" | "video";
  initialPhotoIndex?: number;
}

export default function GalleryModal({
  item,
  onClose,
  initialTab = "photos",
  initialPhotoIndex = 0,
}: GalleryModalProps) {
  const { openBooking } = useBookingModal();
  const modalRef = useRef<HTMLDivElement>(null);

  const photos = item ? getGalleryItemImages(item) : [];
  const videos = item ? getGalleryItemVideos(item) : [];
  const hasVideo = videos.length > 0;
  const hasYouTube = videos.some((v) => v.isYouTube) || (item ? hasYouTubeVideo(item) : false);

  const [activeTab, setActiveTab] = useState<"photos" | "video">("photos");
  const [photoIndex, setPhotoIndex] = useState<number>(0);
  const [videoIndex, setVideoIndex] = useState<number>(0);
  const [embedError, setEmbedError] = useState<boolean>(false);

  // Sync state whenever the selected item changes
  useEffect(() => {
    if (!item) return;

    const itemPhotos = getGalleryItemImages(item);
    const itemVideos = getGalleryItemVideos(item);
    const itemHasVideo = itemVideos.length > 0;

    if (initialTab === "video" && itemHasVideo) {
      setActiveTab("video");
    } else if (itemPhotos.length > 0) {
      setActiveTab("photos");
    } else if (itemHasVideo) {
      setActiveTab("video");
    } else {
      setActiveTab("photos");
    }

    if (
      typeof initialPhotoIndex === "number" &&
      initialPhotoIndex >= 0 &&
      initialPhotoIndex < itemPhotos.length
    ) {
      setPhotoIndex(initialPhotoIndex);
    } else {
      setPhotoIndex(0);
    }
    setVideoIndex(0);
    setEmbedError(false);
  }, [item, initialTab, initialPhotoIndex]);

  // Reset embed error whenever active tab or video selection changes
  useEffect(() => {
    setEmbedError(false);
  }, [activeTab, videoIndex]);

  // Listen for YouTube IFrame API error signals (e.g. error 101/150: embedding restricted)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data);
        if (
          data.event === "onError" ||
          data.info === 101 ||
          data.info === 150 ||
          data.info === 100
        ) {
          setEmbedError(true);
        }
      } catch {
        // Non-JSON postMessage, ignore
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handlePrevPhoto = useCallback(() => {
    if (photos.length <= 1) return;
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNextPhoto = useCallback(() => {
    if (photos.length <= 1) return;
    setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Handle keyboard events (Escape, Left Arrow, Right Arrow)
  useEffect(() => {
    if (!item) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && activeTab === "photos") {
        handlePrevPhoto();
      } else if (e.key === "ArrowRight" && activeTab === "photos") {
        handleNextPhoto();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose, activeTab, handlePrevPhoto, handleNextPhoto]);

  if (!item) return null;

  const currentPhoto = photos[photoIndex] || item.imageUrl || item.thumbnailUrl || "/logo.jpeg";
  const currentVideo = videos[videoIndex] || videos[0];
  const youtubeId = currentVideo ? (currentVideo.youtubeId || extractYouTubeVideoId(currentVideo.url)) : null;
  const isYouTubeValid = isValidYouTubeVideoId(youtubeId);
  const youtubeEmbedUrl = isYouTubeValid ? buildYouTubeEmbedUrl(youtubeId, { autoplay: true, rel: 0, modestbranding: 1 }) : null;
  const youtubeWatchUrl = isYouTubeValid ? buildYouTubeWatchUrl(youtubeId) : (currentVideo?.url || null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-5 md:p-8 animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-saffron-100 bg-[#FFFDF9] px-3.5 py-2.5 sm:px-6 sm:py-3.5 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-700 border border-saffron-200">
              {activeTab === "video" ? (
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-xs sm:text-base md:text-lg font-bold text-ink truncate">
                {item.title}
              </h3>
              <p className="text-[10px] sm:text-xs font-medium text-saffron-800 truncate">
                {item.category}
              </p>
            </div>
          </div>

          {/* Tab Switcher & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* If BOTH photos and video exist: Show Tab Selector */}
            {photos.length > 0 && hasVideo && (
              <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("photos")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "photos"
                      ? "bg-white text-saffron-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Camera className="h-3.5 w-3.5 text-saffron-600" />
                  <span>Photos ({photos.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("video")}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "video"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-red-600"
                  }`}
                >
                  <svg className="h-3.5 w-3.5 fill-current" width="14" height="14" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span>{videos.length > 1 ? `Videos (${videos.length})` : "Video"}</span>
                </button>
              </div>
            )}

            {/* YouTube Direct Link (if current video is YouTube) */}
            {currentVideo?.isYouTube && (youtubeWatchUrl || currentVideo.url) && (
              <a
                href={youtubeWatchUrl || currentVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                title="Open video on YouTube in a new tab"
                aria-label="Open on YouTube"
              >
                <svg className="h-3.5 w-3.5 fill-current shrink-0" width="14" height="14" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="hidden sm:inline">YouTube</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-saffron-200/80 bg-white text-ink transition-colors hover:bg-saffron-50 hover:text-saffron-800 active:scale-95 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Media Body */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[380px] md:min-h-[460px] bg-black flex items-center justify-center overflow-hidden">
          {activeTab === "video" ? (
            currentVideo ? (
              currentVideo.isYouTube ? (
                embedError ? (
                  /* Dedicated Fallback: Video Embedding Disabled by Owner / Browser restriction */
                  <div className="p-6 sm:p-8 text-center text-white max-w-md mx-auto space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30">
                      <svg className="h-7 w-7 fill-current" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-display text-base sm:text-lg font-bold text-white">
                        Playback Restricted by Video Owner
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        The video creator has disabled embedding on external websites, or playback is restricted. You can watch this sacred ceremony video directly on YouTube.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                      {youtubeWatchUrl && (
                        <a
                          href={youtubeWatchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all w-full sm:w-auto"
                        >
                          <span>Watch on YouTube</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setEmbedError(false)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition-colors w-full sm:w-auto"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>Retry Player</span>
                      </button>
                    </div>
                  </div>
                ) : isYouTubeValid && youtubeEmbedUrl ? (
                  <div className="relative w-full h-full aspect-video flex flex-col justify-between">
                    <div className="relative flex-1 w-full h-full min-h-[220px]">
                      <iframe
                        key={youtubeId}
                        src={youtubeEmbedUrl}
                        title={`${item.title} - Video ${videoIndex + 1}`}
                        className="w-full h-full absolute inset-0 border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        onError={() => setEmbedError(true)}
                      />
                    </div>
                    {/* Fallback Toolbar / Direct Escape Hatch */}
                    {youtubeWatchUrl && (
                      <div className="bg-slate-950/90 border-t border-white/10 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-300 shrink-0">
                        <span className="truncate">Sacred Ritual Video • Video not playing?</span>
                        <a
                          href={youtubeWatchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold shrink-0 ml-2"
                        >
                          <span>Open in YouTube</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Invalid / Malformed Video ID */
                  <div className="p-8 text-center text-white max-w-md mx-auto space-y-3">
                    <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
                    <h4 className="text-base font-bold text-white">Video Link Unavailable</h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      The video identifier is unsupported for in-page playback. You may open the video directly in your browser.
                    </p>
                    {currentVideo.url && (
                      <a
                        href={currentVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                      >
                        <span>Open Video Link</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )
              ) : (
                /* Non-YouTube direct MP4/WebM video */
                <video
                  key={currentVideo.url}
                  src={currentVideo.url}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <div className="p-8 text-center text-white">
                <Film className="h-10 w-10 text-white/40 mx-auto mb-2" />
                <p className="text-sm font-medium">Video source unavailable.</p>
              </div>
            )
          ) : (
            /* Photos Tab */
            <div className="relative w-full h-full min-h-[300px] sm:min-h-[440px] flex items-center justify-center">
              <Image
                src={currentPhoto}
                alt={`${item.title} - photo ${photoIndex + 1}`}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 900px"
              />

              {/* Multi-Photo Navigation Controls (only if > 1 photo) */}
              {photos.length > 1 && (
                <>
                  {/* Left Prev Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevPhoto();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all hover:bg-black/85 hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>

                  {/* Right Next Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextPhoto();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all hover:bg-black/85 hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>

                  {/* Photo Counter Pill */}
                  <div className="absolute top-3 right-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-white/20">
                    Photo {photoIndex + 1} of {photos.length}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Thumbnail Selector Row (When viewing Photos tab with > 1 photo) */}
        {activeTab === "photos" && photos.length > 1 && (
          <div className="bg-slate-950/90 border-t border-white/10 px-4 py-2 flex items-center justify-center gap-2.5 overflow-x-auto">
            {photos.map((photoUrl, idx) => {
              const isSelected = idx === photoIndex;
              return (
                <button
                  key={`${photoUrl}-${idx}`}
                  type="button"
                  onClick={() => setPhotoIndex(idx)}
                  className={`relative h-11 w-14 sm:h-14 sm:w-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "border-saffron-500 ring-2 ring-saffron-400 scale-105"
                      : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/70"
                  }`}
                  aria-label={`Select photo ${idx + 1}`}
                >
                  <Image
                    src={photoUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[9px] font-bold text-white">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Video Selector Row (When viewing Video tab with > 1 video) */}
        {activeTab === "video" && videos.length > 1 && (
          <div className="bg-slate-950/90 border-t border-white/10 px-4 py-2.5 flex items-center justify-center gap-2 overflow-x-auto">
            {videos.map((vid, idx) => {
              const isSelected = idx === videoIndex;
              return (
                <button
                  key={`${vid.url}-${idx}`}
                  type="button"
                  onClick={() => setVideoIndex(idx)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 text-xs font-bold ${
                    isSelected
                      ? "bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-400"
                      : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
                  }`}
                  aria-label={`Select video ${idx + 1}`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Video {idx + 1}</span>
                  {vid.isYouTube && <span className="text-[10px] opacity-80">(YouTube)</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Footer: Description & Booking Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FFFDF9] border-t border-saffron-100 px-4 py-3 sm:px-6 sm:py-3.5 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed line-clamp-2">
              {item.description ||
                "Authentic Vedic rituals and spiritual devotion recorded with utmost sanctity."}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                openBooking();
              }}
              className="btn-primary !py-2 !px-4 !text-xs w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Puja Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
