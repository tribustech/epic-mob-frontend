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
const out = {};
for (const slug of Object.keys(renders)) {
  const folder = path.join(dir, slug);
  if (!fs.existsSync(folder)) continue;
  const have = new Set(fs.readdirSync(folder).filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5)));
  const list = renders[slug].filter((id) => have.has(id));
  if (list.length) out[slug] = list;
}
fs.writeFileSync(path.join(root, "lib", "shop", "photos.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${Object.values(out).reduce((n, l) => n + l.length, 0)} photos in ${Object.keys(out).length} models`);
