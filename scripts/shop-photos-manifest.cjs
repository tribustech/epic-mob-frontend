/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
/**
 * Lists the checked room photos (public/magazin/foto/<slug>/<palette>.webp) in lib/shop/photos.json,
 * which the site reads (no fs at build time). Only colours the shop still sells are listed.
 *
 *   node scripts/shop-photos-manifest.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dir = path.join(root, "public", "magazin", "foto");
const renders = JSON.parse(fs.readFileSync(path.join(root, "lib", "shop", "renders.json"), "utf8"));
/**
 * Models whose photos show an older build and must be shot again (scripts/shop-art-direction-v3.json briefs
 * them): their hinged doors were split to at most 65 cm wide (2026-11-21, hinge limit), so the old photos
 * show half as many doors. Remove a model from here once its new photos are in its folder.
 */
const STALE = new Set([]);
const out = {};
for (const slug of Object.keys(renders)) {
  if (STALE.has(slug)) continue;
  const folder = path.join(dir, slug);
  if (!fs.existsSync(folder)) continue;
  const have = new Set(fs.readdirSync(folder).filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5)));
  const list = renders[slug].filter((id) => have.has(id));
  if (list.length) out[slug] = list;
}
fs.writeFileSync(path.join(root, "lib", "shop", "photos.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${Object.values(out).reduce((n, l) => n + l.length, 0)} photos in ${Object.keys(out).length} models`);
