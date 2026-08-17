"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import type { TiktokVideo } from "@/lib/tiktok-data";

// Client half of the reel wall: a grid of clean vertical covers that open the
// official TikTok player in a lightbox on click. Covers come pre-fetched from the
// server component, so this ships no TikTok script until the user actually plays.
export function ReelLightbox({ videos }: { videos: TiktokVideo[] }) {
  const [active, setActive] = useState<TiktokVideo | null>(null);

  // Close on Escape and lock body scroll while the lightbox is open.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {videos.map((video) => (
          <button
            key={video.videoId}
            type="button"
            onClick={() => setActive(video)}
            aria-label={`Redă videoul: ${video.title || "video TikTok Epic Mob"}`}
            className="group relative aspect-[9/16] overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-clay shadow-[var(--shadow-warm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-warm-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--terracotta)] focus-visible:ring-offset-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnail}
              alt={video.title || "Video TikTok Epic Mob"}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-espresso/15 transition duration-300 group-hover:bg-espresso/5" />
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-espresso shadow-lg transition duration-300 group-hover:scale-110">
              <Play size={22} strokeWidth={2} className="ml-0.5" fill="currentColor" />
            </span>
          </button>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Video TikTok"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-espresso/80 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Închide"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-cream/90 text-espresso transition hover:bg-cream"
          >
            <X size={22} strokeWidth={2} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[1.5rem] bg-black shadow-2xl"
          >
            <iframe
              src={`https://www.tiktok.com/player/v1/${active.videoId}?autoplay=1&description=0&music_info=0`}
              title={active.title || "Video TikTok Epic Mob"}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              className="h-full w-full"
              style={{ border: 0 }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
