# Portfolio Page — Cinematic Editorial Rebuild

> **Read me first.** This brief replaces the current `/portfolio` route in `epic-mob-frontend` with the editorial cinematic gallery shown in `portfolio-preview.html` (this project). The current implementation (`PortfolioImmersiveShowcase`) is a 3-slide scroll-jacked living/bucatarie/baie hero — it goes away. The new page is a long-scroll editorial gallery: hero → sticky filter strip → 3 chapters (Bucatarii / Dressinguri / Detalii) of full-bleed image+text scenes → final CTA.
>
> All design tokens, type, and component primitives already exist in the cinematic system shipped via `HANDOFF.md`. This brief only covers the new portfolio surface — no token work, no global chrome edits.

---

## 0. Files in scope

**Create:**
- `components/portfolio/portfolio-hero.tsx`
- `components/portfolio/portfolio-filters.tsx` (client component — chip state)
- `components/portfolio/portfolio-chapter-divider.tsx`
- `components/portfolio/portfolio-scene.tsx`
- `components/portfolio/portfolio-final-cta.tsx`
- `lib/portfolio-data.ts` — single source of truth for chapters + projects

**Rewrite:**
- `app/portfolio/page.tsx` — replace `<PortfolioImmersiveShowcase />` with the new composition.

**Delete:**
- `components/portfolio/portfolio-immersive-showcase.tsx`
- `lib/portfolio-immersive-state.ts` (only consumer is the file above — confirm with `rg` before deleting)

**Untouched:**
- `components/home/portfolio-preview.tsx` — the *home* preview block. Different surface.
- All home immersive scenes, GSAP wiring, `lib/site-data.ts`, image assets in `public/`.

---

## 1. Data model — `lib/portfolio-data.ts`

```ts
export type ProjectCategory = "bucatarie" | "dressing" | "baie" | "detaliu";

export type PortfolioProject = {
  slug: string;             // route segment for /portfolio/[slug]
  index: number;            // 1..N — drives "Proiect / NN din TT" + the giant numeral
  category: ProjectCategory;
  badge: string;            // e.g. "Bucatarie · 2025"
  title: string;            // may contain `<em>...</em>` for italic ember accent
  lede: string;             // 1–2 sentence summary
  body: string;             // 1 paragraph, may contain <em>
  specs: { label: string; value: string }[]; // exactly 4
  image: { src: string; alt: string };       // primary scene image
};

export type PortfolioChapter = {
  id: "bucatarii" | "dressinguri" | "detalii";
  number: string;           // "01" | "02" | "03"
  title: string;            // may contain <em>
  description: string;
  projects: PortfolioProject[];
};

export const portfolioChapters: PortfolioChapter[] = [/* …11 projects total… */];
export const portfolioStats = {
  totalProjects: 84,
  yearsInOperation: 7,
  blumPercentage: 100,
  averageDeliveryWeeks: 9,
};
```

Seed the file from the 11 projects in `portfolio-preview.html`. Keep the Romanian copy verbatim. For images, reuse existing `public/` assets where the names line up; otherwise add new entries to `public/portfolio/` and reference them by path. Don't invent new copy.

---

## 2. `app/portfolio/page.tsx`

```tsx
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { PortfolioFilters } from "@/components/portfolio/portfolio-filters";
import { PortfolioChapterDivider } from "@/components/portfolio/portfolio-chapter-divider";
import { PortfolioScene } from "@/components/portfolio/portfolio-scene";
import { PortfolioFinalCta } from "@/components/portfolio/portfolio-final-cta";
import { portfolioChapters, portfolioStats } from "@/lib/portfolio-data";

export default function PortfolioPage() {
  const totalShown = portfolioChapters.reduce((n, c) => n + c.projects.length, 0);

  return (
    <main className="bg-stage text-ivory">
      <PortfolioHero stats={portfolioStats} />
      <PortfolioFilters totalShown={totalShown} totalProjects={portfolioStats.totalProjects} />
      {portfolioChapters.map((chapter) => (
        <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
          <PortfolioChapterDivider chapter={chapter} />
          {chapter.projects.map((project, i) => (
            <PortfolioScene
              key={project.slug}
              project={project}
              totalProjects={totalShown}
              reverse={i % 2 === 1}
            />
          ))}
        </section>
      ))}
      <PortfolioFinalCta unshownCount={portfolioStats.totalProjects - totalShown} />
    </main>
  );
}
```

The page is fully server-rendered. Only `PortfolioFilters` is a client component.

---

## 3. Component specs

All component visuals must match `portfolio-preview.html` 1:1 — measure against it. Key constants below; copy the rest from the preview's `<style>` block into Tailwind classes or a colocated `.module.css` (your call — match repo conventions).

### 3a. `<PortfolioHero>`
- `min-height: 80vh`, padding `140px 0 80px`.
- Background: `radial-gradient(circle at 78% 20%, var(--ember-soft), transparent 42%)` over `linear-gradient(135deg,#070707 0%,#15130f 56%,#1f1208 100%)`.
- Decorative grid overlay: 80×80 `var(--ivory-12)` lines, `opacity: 0.35`, masked to fade out by 75% height.
- Meta line (`2019 — 2026 · 84 proiecte`) — uppercase, `0.4em` tracking, `var(--ember)`, with a leading 40px ember rule.
- Headline: Cormorant Garamond 500, `clamp(56px, 8vw, 128px)`, line-height `0.96`, `letter-spacing -0.02em`. The italic word ("traiesc") is `<em>` with `color: var(--ember)`. Read the exact two-line copy from the preview.
- Stats grid: 4 columns, `gap: 48px`, separated from headline by a top hairline (`var(--ivory-12)`). Each stat: 56px Cormorant numeral (italic `+` accents in ember), label below in 11px / 0.3em / uppercase / `var(--ivory-48)`.
- Below 980px: stats collapse to 2 columns.

### 3b. `<PortfolioFilters>` (client)
- `position: sticky; top: 120px; z-index: 30;`. Background `rgba(7,7,7,0.92)` with `backdrop-filter: blur(12px)`. Bottom hairline `var(--ivory-12)`.
- Left: chip group with a tiny `Camere` label (10px / 0.3em / uppercase / `var(--ivory-48)`) followed by 5 chips: `Toate / Bucatarie / Dressing / Baie / Detaliu`.
- Right: count meter `11 / 84 afisate`.
- Chip: `border: 1px solid var(--ivory-24); color: var(--ivory-72); padding: 9px 18px; border-radius: 999px; font: 700 12px/0.16em uppercase`. Hover and active = ember border + ember text + `var(--ember-soft)` background.
- Filter behaviour: clicking a chip filters scenes via category match. Implement with React state + a `data-category` attribute on each `<PortfolioScene>` wrapper queried by the parent, OR lift filter state to a context and let `PortfolioScene` read it. Either is fine — pick what aligns with existing patterns. Keep "Toate" as the default and allow only one active chip at a time.
- The chip top offset (`top: 120px`) assumes the existing fixed header height. If the header height changes, update this value — this is the only spot it leaks.

### 3c. `<PortfolioChapterDivider>`
- Padding: `80px 0 0`. Centered.
- Top line `Capitolul 0X` flanked by 80px ember rules.
- Title in Cormorant Garamond 500, `clamp(48px, 6vw, 88px)`, italic word in `var(--ember)`.
- Description below: max 560px, `var(--ivory-72)`, 15px / 1.8 line-height.

### 3d. `<PortfolioScene>` — the workhorse
Two-column scene, image + text. `reverse` prop swaps order. Padding `140px 0`, hairline divider at the bottom (`var(--ivory-12)`).
- Grid `1.15fr 1fr`, gap `80px`, `align-items: center`. When `reverse`: `1fr 1.15fr` and the text moves to the left column.
- **Image column** — `aspect-ratio: 4/5; border-radius: 6px; overflow: hidden;` placeholder background `linear-gradient(135deg, var(--ash), var(--charcoal))`, shadow `var(--shadow-card)`. While images are absent, render the inset-bordered placeholder with the filename caption (see preview `.scene-image .ph` rule). Once `project.image.src` exists, drop the placeholder and use `<Image fill style={{ objectFit: 'cover' }}>`.
- The huge italic numeral at the bottom-left of the image (`200px` Cormorant italic, `rgba(214,108,0,0.18)`, `transform: translate(-12%, 18%)`) is part of the image card, not a sibling — keep it inside the image wrapper with `pointer-events: none`.
- Badge top-left: `rgba(237,231,222,0.92) / #1a1a1a / 10px uppercase / 0.24em / 7px 14px / radius 999px`.
- **Text column** — index line (italic Cormorant 18px ember "Proiect / NN din TT"), then `<h2>` (Cormorant 500, `clamp(40px, 4.5vw, 64px)`, italic span in ember), lede (17px / 1.8 / `var(--ivory-72)`), body (15px / 1.85 / `var(--ivory-72)` with `<em>` ember-italic for emphasis), specs grid (2 cols, gap `24px 36px`, top hairline + 32px padding-top, max-width 520px), and the "Vezi studiul de caz →" link.
- Spec entry: label is 10px / 0.28em / uppercase / `var(--ivory-48)` `<b>`-tagged block; value is 13px / `var(--ivory-72)` / 1.5.
- Scene CTA link: `display: inline-flex; gap: 10px; color: var(--ember); font: 800 12px/0.22em uppercase; border-bottom: 1px solid var(--ember); padding-bottom: 6px;`. Hover → ivory + ivory border. Wire it to `/portfolio/${slug}`.
- Below 980px: grid collapses to 1 column, `reverse` no longer reorders, scene padding drops to `90px 0`, specs collapse to 1 column.

### 3e. `<PortfolioFinalCta>`
- Padding `160px 0`, centered.
- Background: two ember radial wells (`30% 70%` at 22% alpha, `80% 30%` at 12% alpha) over `var(--stage)`.
- Eyebrow `Restul portofoliului`, headline `Cele NN de proiecte / care nu au incaput aici.` (italic ember on "au incaput"), supporting paragraph, then a row of two existing cinematic buttons — `.btn.btn-primary` (Programeaza vizita → `/contact`) and `.btn.btn-secondary` (Cere oferta → `/configurator` or whichever the existing route is).
- Use existing button classes from `globals.css`. Do not redefine button styles in this component.

---

## 4. Routing follow-up

- The scene CTA links to `/portfolio/[slug]`. Add a stub `app/portfolio/[slug]/page.tsx` that reads from `portfolioChapters` by slug and 404s on miss. Placeholder content (title + lede + image) is fine for now — the case-study deep-dive is its own brief.
- Update `lib/site-data.ts > navigation` (no changes here — Portofoliu link already points at `/portfolio`).

---

## 5. Acceptance checklist

- [ ] `/portfolio` no longer renders the 3-slide GSAP showcase. The route mounts the editorial gallery.
- [ ] Scrolling from top to bottom passes through: hero (with stat block), sticky filter strip, 3 chapter dividers, 11 alternating-orientation scenes, final CTA.
- [ ] Filter chips visually update on click and filter the visible scene set; "Toate" restores all 11.
- [ ] Sticky filter strip stays clear of the site header at all viewport widths.
- [ ] Scene images respect `4/5` aspect ratio at all widths; the giant ember numeral is anchored to bottom-left of each image card and never overflows past the section.
- [ ] At ≤980px, every scene is 1 column with image stacked above text, padding collapses, specs are 1-up.
- [ ] No leftover references to `PortfolioImmersiveShowcase`, `getImmersiveScrollState`, or `getImmersiveSectionHeight` (`rg` confirms).
- [ ] No new tokens introduced; all colors come from the cinematic palette in §0 of `HANDOFF.md`.
- [ ] `prefers-reduced-motion` users see the same layout — there is intentionally no scroll animation on this page.

---

## 6. Suggested commit sequence

1. `feat(portfolio): add portfolio-data.ts with chapters + projects`
2. `feat(portfolio): add hero, chapter divider, final CTA components`
3. `feat(portfolio): add scene component with reverse + responsive collapse`
4. `feat(portfolio): add sticky filter strip with category state`
5. `refactor(portfolio): replace immersive showcase with editorial gallery`
6. `chore(portfolio): delete unused immersive showcase + state helpers`
7. `feat(portfolio): stub /portfolio/[slug] case-study route`

---

## 7. Prompt to paste into Claude Code

> I'm rebuilding `/portfolio` in `epic-mob-frontend`. The full brief is `PORTFOLIO_HANDOFF.md` at the repo root, and the visual reference is `portfolio-preview.html` in the design project (already shared as a static file — pull values from it directly, do not eyeball).
>
> Apply the migration in commit-sequence order (§6). Honour the cinematic token system already established in `HANDOFF.md` — do not introduce new tokens. After each commit, run the §5 acceptance checks and report any deviations before moving on.
>
> Per `AGENTS.md`, this is the new Next.js — read `node_modules/next/dist/docs/` if structural questions come up. Do not touch anything in §0 "Untouched".

---

## 8. Keeping design and implementation in sync

This is the part that usually rots. A few patterns that work well for this kind of HTML-prototype → production-codebase loop:

### 8a. Treat the HTML preview as the canonical visual spec
Until a surface ships, `*-preview.html` files in **this** project are the source of truth for layout, type scale, and spacing. `HANDOFF.md` is the source of truth for tokens. The Next.js codebase is the source of truth for content (`lib/site-data.ts`) and behaviour. When those disagree, the rule is:
- **Visual disagreement** → preview wins, code adapts.
- **Content disagreement** → code wins, preview adapts.
- **Token disagreement** → `HANDOFF.md` wins, both adapt.

Write this rule into `epic-mob-frontend/AGENTS.md` so future Claude Code sessions know the order.

### 8b. One handoff file per surface, not one mega-doc
`HANDOFF.md` was the v2 cinematic migration — a one-shot document, now mostly historical. From here on, scope each handoff to a single page or feature: `PORTFOLIO_HANDOFF.md`, `CONTACT_HANDOFF.md`, etc. Each one ends in an "Acceptance checklist" + "Prompt to paste into Claude Code". When the work lands, archive the file (move it to `docs/handoffs/done/` in the codebase) so it stops competing with the next brief.

### 8c. Mirror the design tokens — don't redeclare them
The cinematic palette lives in `app/globals.css` and the `_shared.css` in this project. Keep them byte-identical for the variables themselves. A 5-line section at the top of `_shared.css` with a comment "// Mirrors `app/globals.css` cinematic tokens — do not edit independently" prevents drift. When a token changes in code, you (or I) update `_shared.css` in the same chat turn, and vice versa.

### 8d. Pull screenshots from real production into preview reviews
After Claude Code lands a surface, take a full-page screenshot of the deployed page and drop it side-by-side with the preview HTML in a design-review HTML file. Drift becomes visible immediately. (I can build that comparison view on request — it's a 5-minute job.)

### 8e. Component naming parity
When a preview block has a clear component identity (`PortfolioHero`, `PortfolioScene`), use the exact same name in both `_shared.css` class hooks and the React component. Then `rg "PortfolioScene"` finds every relevant file across both worlds. The current `_shared.css` mostly uses BEM-ish class names — that's fine — but the handoff should always state which class maps to which React component.

### 8f. Lock the handoff into the codebase repo as well
Once a brief is approved, copy `PORTFOLIO_HANDOFF.md` into `epic-mob-frontend/docs/handoffs/` so reviewers and future agents working in the codebase have the full context without needing access to the design project. The design project keeps the editable copy; the codebase has the snapshot. Update both when a brief revises.

### 8g. Iteration cadence
The healthy loop is: **design here** → **handoff brief** → **Claude Code implements** → **screenshot back into design project** → **discrepancies resolved as new brief**. Avoid round-tripping through screenshots inside a single iteration — it loses fidelity. Round-trip via tokens, copy, and component contracts instead.
