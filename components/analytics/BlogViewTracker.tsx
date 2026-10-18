"use client";

import { useEffect } from "react";
import { trackCustomEvent } from "@/lib/meta-pixel";

export default function BlogViewTracker({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  useEffect(() => {
    trackCustomEvent("BlogView", {
      content_name: title,
      content_ids: [slug],
      content_type: "article",
    });
  }, [title, slug]);

  return null;
}
