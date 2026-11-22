/** Data for scripts/shop-art-direction-v3.py: the shop range as JSON on stdout. */
import { PHOTO_COLOURS, SHOP_PRODUCTS } from "../lib/shop/products";
import RENDERS from "../lib/shop/renders.json";
import { effectiveHandle } from "../lib/atelier/handles";

const rendered = new Set(Object.keys(RENDERS));
console.log(
  JSON.stringify(
    SHOP_PRODUCTS.map((p) => ({
      slug: p.slug,
      category: p.preset.category,
      size: [p.preset.shape.widthMm, p.preset.shape.heightMm, p.preset.shape.depthMm],
      paletteIds: p.paletteIds,
      photoColours: PHOTO_COLOURS[p.slug],
      // the handle the render actually shows: the shop's own, else the category default on fronts that take one
      handle: effectiveHandle({ ...p.preset.shape, ...(p.handle ? { handle: p.handle } : {}) }) ?? null,
      rooms: p.rooms,
      isNew: !rendered.has(p.slug),
    })),
  ),
);
