import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { bottomClearance } from "../lib/fixed-bars.ts";
import { trapTarget } from "../lib/focus-trap.ts";
import { socialLinks } from "../lib/social-links.ts";
import { business } from "../lib/business-data.ts";

test("menu focus trap: Tab wraps last → first, Shift+Tab wraps first → last", () => {
  assert.equal(trapTarget(5, 4, false), 0);
  assert.equal(trapTarget(5, 0, true), 4);
  // in the middle the browser moves focus itself
  assert.equal(trapTarget(5, 2, false), null);
  assert.equal(trapTarget(5, 2, true), null);
  // focus outside the dialog is pulled back in
  assert.equal(trapTarget(5, -1, false), 0);
  assert.equal(trapTarget(5, -1, true), 4);
  assert.equal(trapTarget(0, -1, false), null);
});

test("cookie banner clears sticky bottom bars, ignores the rest", () => {
  const vh = 844;
  // nothing pinned: sits at the bottom
  assert.equal(bottomClearance([], vh), 0);
  // the home tab bar (70 px) and the shop basket button (52 px, 20 px up)
  assert.equal(
    bottomClearance(
      [
        { top: 774, bottom: 844, height: 70 },
        { top: 772, bottom: 824, height: 52 },
      ],
      vh,
    ),
    72,
  );
  // a sticky header at the top and a full-screen sheet do not count
  assert.equal(
    bottomClearance(
      [
        { top: 0, bottom: 72, height: 72 },
        { top: 0, bottom: 844, height: 844 },
      ],
      vh,
    ),
    0,
  );
});

test("footer social links come only from the structured data (sameAs)", () => {
  const links = socialLinks();
  assert.deepEqual(
    links.map((l) => l.href),
    business.sameAs.filter((u) => /instagram|tiktok|facebook/.test(u)),
  );
  assert.deepEqual(
    socialLinks(["https://www.instagram.com/x/", "not a url", "http://tiktok.com/@x", "https://example.com"]),
    [{ kind: "instagram", label: "Instagram", href: "https://www.instagram.com/x/" }],
  );
  assert.deepEqual(socialLinks([]), []);
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

test("no link to the closed EU ODR/SOL platform anywhere", () => {
  for (const file of [...sourceFiles("app"), ...sourceFiles("components"), ...sourceFiles("lib")]) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /ec\.europa\.eu\/consumers\/odr/, file);
  }
});

test("the dev-only anchor picker is a 404 in production and never indexed", () => {
  const page = readFileSync("app/materiale/anchors/page.tsx", "utf8");
  assert.match(page, /NODE_ENV === "production"\) notFound\(\)/);
  assert.match(page, /index: false/);
  const sitemap = readFileSync("app/sitemap.ts", "utf8");
  assert.doesNotMatch(sitemap, /anchors/);
});

test("home and quote page each have exactly one h1", () => {
  const hero = readFileSync("components/home/warm/warm-hero.tsx", "utf8");
  assert.equal(hero.match(/<h1\b/g)?.length, 1);
  const quote = readFileSync("app/cere-oferta/page.tsx", "utf8");
  assert.equal(quote.match(/<h1\b/g)?.length, 1);
});

test("top menu: Materiale comes after Magazin and Atelier 3D (header, mobile menu and footer share it)", async () => {
  const { navigation } = await import("../lib/site-data.ts");
  assert.deepEqual(
    navigation.map((n) => n.label),
    ["Acasă", "Portofoliu", "Magazin", "Atelier 3D", "Materiale", "Contact"],
  );
});

test("shop spec lines link to the page that explains their board", async () => {
  const { materialPageOf } = await import("../lib/shop/specs.ts");
  assert.equal(materialPageOf("PAL melaminat 18 mm, decor Egger W1000 ST9")?.href, "/materiale/pal-melaminat");
  assert.equal(materialPageOf("MDF vopsit RAL 9016, mat")?.href, "/materiale/mdf-vopsit");
  assert.equal(materialPageOf("MDF melaminat 18 mm")?.href, "/materiale/mdf-melaminat");
  assert.equal(materialPageOf("Sticlă"), undefined);
});
