"use client";

import type { ReactNode } from "react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

// Demo puja media — a real aarti-at-the-mandir clip (Pexels) so devotees can
// experience a live pooja before and after booking. Swap these URLs to show
// actual pooja recordings later.
export const AARTI_VIDEO =
  "https://videos.pexels.com/video-files/28884117/12503838_1920_1080_50fps.mp4";
export const AARTI_POSTER =
  "https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=80&w=1280&auto=format&fit=crop";
export const AARTI_BG =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop";

interface PoojaExperienceProps {
  title: string;
  date?: string;
  scrollHint?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

export default function PoojaExperience({
  title,
  date = "Live Aarti at the Mandir",
  scrollHint = "Scroll to reveal the pooja experience",
  textBlend = true,
  children,
}: PoojaExperienceProps) {
  return (
    <section className="relative bg-ink">
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc={AARTI_VIDEO}
        posterSrc={AARTI_POSTER}
        bgImageSrc={AARTI_BG}
        title={title}
        date={date}
        scrollToExpand={scrollHint}
        textBlend={textBlend}
      >
        {children}
      </ScrollExpandMedia>
    </section>
  );
}
