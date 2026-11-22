// Shared Open Graph defaults. Next merges metadata shallowly, so a page that sets
// its own `openGraph` drops the layout's siteName/locale and the default image
// from app/opengraph-image.tsx. Spread this into every page-level openGraph.

export const BRAND = "Epic Mob";

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Epic Mob Atelier — Mobilier la comandă",
};

export const baseOpenGraph = {
  siteName: BRAND,
  locale: "ro_RO",
  type: "website" as const,
  images: [DEFAULT_OG_IMAGE],
};
