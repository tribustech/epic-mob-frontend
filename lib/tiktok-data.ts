// TikTok "reel wall" data for the homepage "Din atelier" section
// (components/home/warm/warm-reels). We pull the official cover + title for each
// video via TikTok's oEmbed endpoint, render our own clean vertical cards, and
// open the official TikTok player in a lightbox on click — no heavy embed.js on
// first paint. Ordered most-recent first.

// ── Videos ────────────────────────────────────────────────────────────────────
// Paste the share link of each TikTok VIDEO (Share → Copy link). Only /video/
// links work — /photo/ carousel posts are NOT supported by TikTok oEmbed.
// The homepage shows the first HOMEPAGE_REEL_COUNT of these; the rest live here
// as a record and are one line away from being shown.
export const tiktokVideoUrls: string[] = [
  "https://www.tiktok.com/@epic_mob/video/7673463654494342422",
  // photo post 7670551199749262614 omitted — oEmbed doesn't support /photo/
  "https://www.tiktok.com/@epic_mob/video/7669850775949954326",
  "https://www.tiktok.com/@epic_mob/video/7668725456966880514",
  "https://www.tiktok.com/@epic_mob/video/7668292919429827862",
  "https://www.tiktok.com/@epic_mob/video/7662367313164782870",
  "https://www.tiktok.com/@epic_mob/video/7660580320282021142",
  "https://www.tiktok.com/@epic_mob/video/7659793985375898902",
  "https://www.tiktok.com/@epic_mob/video/7659474870652177686",
  "https://www.tiktok.com/@epic_mob/video/7659040518386584854",
  "https://www.tiktok.com/@epic_mob/video/7658711224485481750",
  "https://www.tiktok.com/@epic_mob/video/7658248695690906883",
  "https://www.tiktok.com/@epic_mob/video/7657937912398580994",
  "https://www.tiktok.com/@epic_mob/video/7657611168223169815",
];

// How many reels to render on the homepage (2×2 grid beside the social card).
export const HOMEPAGE_REEL_COUNT = 4;

// TikTok profile for the "Follow" button — kept in sync with business-data sameAs.
export const tiktokProfileUrl = "https://www.tiktok.com/@epic_mob";

export type TiktokVideo = {
  url: string;
  videoId: string;
  thumbnail: string;
  title: string;
  author: string;
};

// Pull the numeric video id out of a TikTok watch/share URL, e.g.
// https://www.tiktok.com/@epic_mob/video/7673463654494342422 -> "7673463654494342422".
export function tiktokVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

// Fetch oEmbed metadata (cover + title) for a single video. Cached for a day so
// we don't hit TikTok on every request AND so the signed thumbnail URL (which
// expires) gets refreshed before it goes stale. Returns null on any failure so
// one bad link can never break the section.
export async function fetchTiktokVideo(url: string): Promise<TiktokVideo | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      thumbnail_url?: string;
      title?: string;
      author_name?: string;
      embed_product_id?: string;
    };
    const videoId = tiktokVideoId(url) ?? data.embed_product_id ?? "";
    if (!videoId || !data.thumbnail_url) return null;
    return {
      url,
      videoId,
      thumbnail: data.thumbnail_url,
      title: data.title ?? "",
      author: data.author_name ?? "",
    };
  } catch {
    return null;
  }
}

// Resolve the first `limit` configured URLs, dropping any that failed.
export async function fetchTiktokVideos(
  limit = HOMEPAGE_REEL_COUNT
): Promise<TiktokVideo[]> {
  const results = await Promise.all(
    tiktokVideoUrls.slice(0, limit).map(fetchTiktokVideo)
  );
  return results.filter((v): v is TiktokVideo => v !== null);
}
