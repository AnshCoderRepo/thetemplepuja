/**
 * YouTube Utility Helper
 * Safe extraction of YouTube video IDs and optional server-side duration verification.
 */

/**
 * Parses ISO 8601 duration format (e.g., PT2M30S, PT1H2M10S, PT45S) into total seconds.
 */
export function parseIsoDuration(durationStr: string): number {
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Verifies YouTube video duration on the server.
 * Uses YOUTUBE_API_KEY if configured in environment variables.
 * Never exposes private API keys to the client.
 */
export async function verifyYouTubeDuration(videoId: string): Promise<{
  verified: boolean;
  durationSeconds?: number;
  title?: string;
  reason?: string;
  error?: string;
}> {
  const apiKey = (process.env.YOUTUBE_API_KEY || "").trim();
  if (!apiKey) {
    // API key not configured — clearly report unverified rather than falsely claiming verification
    return {
      verified: false,
      reason: "NO_API_KEY",
      error: "YOUTUBE_API_KEY not configured. Duration cannot be verified server-side.",
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${encodeURIComponent(
      videoId
    )}&key=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return { verified: false, error: `YouTube API returned HTTP ${res.status}` };
    }

    const data = await res.json();
    const item = data?.items?.[0];
    if (!item) {
      return { verified: false, error: "Video not found on YouTube" };
    }

    const rawDuration = item.contentDetails?.duration;
    if (!rawDuration) {
      return { verified: false, error: "Duration metadata unavailable" };
    }

    const durationSeconds = parseIsoDuration(rawDuration);
    return {
      verified: true,
      durationSeconds,
      title: item.snippet?.title,
    };
  } catch (err: any) {
    return {
      verified: false,
      error: err?.message || "Failed to reach YouTube Data API",
    };
  }
}
