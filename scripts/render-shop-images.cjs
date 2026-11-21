/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script; playwright is the machine-wide install */
/**
 * Renders the shop's card pictures from the product pages' 3D view, one per product colour:
 * public/magazin/randari/<slug>/<palette>.webp + lib/shop/renders.json (the list the site uses).
 *
 *   site running locally (npm run dev, with the CRM or the CRM mock), then:
 *   node scripts/render-shop-images.cjs [http://localhost:3000] [slug ...]
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const sharp = require("sharp");

const base = process.argv[2] && process.argv[2].startsWith("http") ? process.argv[2] : "http://localhost:3000";
const only = process.argv.slice(2).filter((a) => !a.startsWith("http"));
const outDir = path.join(__dirname, "..", "public", "magazin", "randari");
const manifestPath = path.join(__dirname, "..", "lib", "shop", "renders.json");

/**
 * Kitchens in L with the second wall on the right: the viewer's default camera (front-right) sees that wall
 * from behind, so these are shot from the front-left instead (a drag on the 3D view, like a visitor would).
 */
const fromLeft = new Set(
  JSON.parse(
    execFileSync("npx", ["tsx", "-e", 'import { LAYOUT_PRESETS } from "./lib/atelier/presets"; console.log(JSON.stringify(LAYOUT_PRESETS.filter((p) => p.shape.kitchen?.layout === "L_DREAPTA").map((p) => p.id)))'], {
      cwd: path.join(__dirname, ".."),
      encoding: "utf8",
    }),
  ),
);
/** horizontal drag in px on the 800 × 600 view: about 40° to the left */
const LEFT_DRAG_PX = 120;

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 });
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};

  let slugs = only;
  if (!slugs.length) {
    await page.goto(`${base}/magazin`, { waitUntil: "networkidle", timeout: 300000 });
    slugs = await page.$$eval('.shop-card a[href^="/magazin/"]', (as) => [...new Set(as.map((a) => a.getAttribute("href").split("/")[2].split("?")[0]))]);
  }

  const open = async (slug) => {
    for (let attempt = 1; ; attempt++) {
      try {
        await page.goto(`${base}/magazin/${slug}`, { waitUntil: "networkidle", timeout: 120000 });
        break;
      } catch (e) {
        if (attempt >= 3) throw e; // the dev server sometimes drops a navigation while it recompiles
      }
    }
  };

  for (const slug of slugs) {
    await open(slug);
    const palettes = await page.$$eval(".shop-colour", (bs) => bs.map((_, i) => i));
    const ids = [];
    for (const i of palettes) {
      // the 3D view keeps its camera between colours: a turned view starts again from a fresh page
      if (fromLeft.has(slug) && i > 0) await open(slug);
      await page.locator(".shop-colour").nth(i).evaluate((b) => b.click());
      // the default colour opens on its room photo: switch to the 3D view
      await page.evaluate(() => document.querySelector('.shop-viewswitch button:nth-child(2)[aria-pressed="false"]')?.click());
      await page.addStyleTag({ content: "header, .site-header, .shop-fab, [class*='cookie'] { display: none !important; } .shop-product__info, .shop-viewswitch { visibility: hidden !important; } .shop-viewer button, .shop-viewer p { display: none !important; } .shop-viewer { position: fixed !important; inset: 0 auto auto 0 !important; z-index: 99999 !important; border-radius: 0 !important; width: 800px !important; height: 600px !important; }" });
      await page.waitForSelector(".shop-viewer canvas", { timeout: 60000 });
      await page.waitForTimeout(2500);
      if (fromLeft.has(slug)) {
        await page.mouse.move(400, 300);
        await page.mouse.down();
        for (let k = 1; k <= 10; k++) await page.mouse.move(400 + (LEFT_DRAG_PX * k) / 10, 300, { steps: 2 });
        await page.mouse.up();
        await page.waitForTimeout(2500);
      }
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: 800, height: 600 } });
      const paletteId = await page.locator(".shop-colour").nth(i).getAttribute("data-palette");
      fs.mkdirSync(path.join(outDir, slug), { recursive: true });
      await sharp(png).resize(800, 600).sharpen().webp({ quality: 78 }).toFile(path.join(outDir, slug, `${paletteId}.webp`));
      ids.push(paletteId);
      process.stdout.write(`${slug}/${paletteId} `);
    }
    manifest[slug] = ids;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log("");
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
