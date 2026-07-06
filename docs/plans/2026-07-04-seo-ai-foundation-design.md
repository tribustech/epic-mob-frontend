# SEO + AI Discoverability Foundation — Design

Date: 2026-07-04
Scope: Phase 1 "fast SEO wins" from `2026-04-14-seo-vs-animation-strategy.md`, extended
for LLM/agent discoverability. No design/animation/CWV changes in this pass.

## Goal

Make EpicMob rank better in search AND get recommended by LLM agents (ChatGPT,
Claude, Perplexity, Google AI). The two levers that move both at once are:
**structured data (JSON-LD)** and **machine-readable, factual, crawlable content**.

## Business facts (confirmed with owner)

- Brand: **Epic Mob** (display: "Epic Mob Atelier")
- Legal name: TODO (owner to provide)
- Founded: **2019**
- Service area: **România (national)** — no public street address (service-area business)
- Contact: `+40 750 402 027`, `contact@epicmob.ro`, WhatsApp `wa.me/40750402027`
- Social profiles (`sameAs`): TODO (owner to provide) — omitted until known
- Reviews / aggregate rating: none yet
- Services: bucătării, dressing, living, băi, mobilier rezidențial la comandă
- Differentiators: feronerie Blum, montaj inclus, contract & factură, consultanță gratuită

## Principle: single source of truth

All of the below read from one config so nothing drifts and nothing is invented.

`lib/business-data.ts` — brand, contact, foundingDate, areaServed, services,
priceRange, knowsLanguage, sameAs (empty→omitted), legalName (empty→omitted).

## Deliverables

### 1. `lib/business-data.ts`
Canonical business object + a `buildOrganizationSchema()` / `buildLocalBusinessSchema()`
helper that omits empty fields (never emit `sameAs: []` or empty `legalName`).

### 2. JSON-LD components — `components/seo/json-ld.tsx`
A tiny `<JsonLd data={...} />` server component (script type=application/ld+json).
Emit:
- **Site-wide** (in `app/layout.tsx`): `FurnitureStore` (LocalBusiness subtype) with
  `areaServed: Country România`, no address, founder, foundingDate, contactPoint,
  `hasOfferCatalog` of services, priceRange, knowsLanguage `ro`; plus `WebSite` +
  `Organization` (publisher).
- **/portfolio**: `CollectionPage` + `ItemList` of projects.
- **/portfolio/[slug]**: `CreativeWork` (the project) + `BreadcrumbList`.
- **/materiale/[slug]**: `Article` (educational) + `BreadcrumbList`.

FAQPage intentionally deferred (needs matching visible content — separate pass).

### 3. Metadata completion
- `app/page.tsx` (home): add title/description/canonical `/` + OpenGraph (currently none).
- `app/contact/page.tsx`, `app/configurator/page.tsx`: add canonical + OpenGraph.
- `app/layout.tsx`: default `openGraph` (siteName, `locale: ro_RO`, type website,
  default image) + `twitter` card (summary_large_image). Inherited by all routes.

### 4. Default OG image — `app/opengraph-image.tsx`
Branded card generated with `next/og` `ImageResponse` (no external asset needed).
Per-page images already reference specific photos where present.

### 5. `app/robots.ts`
Allow all; link sitemap; keep `/api` disallowed. Explicitly allow AI crawlers
(GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, anthropic-ai, Claude-SearchBot,
PerplexityBot, Google-Extended, CCBot, etc.) — the key lever for LLM citation.

### 6. `app/sitemap.ts`
Static routes + dynamic portfolio & materiale slugs; lastModified + priority.

### 7. `/llms.txt` — `app/llms.txt/route.ts`
Markdown per the emerging llms.txt convention: who Epic Mob is, services, materials,
key page links. Lets LLM agents understand and recommend the business accurately.

## Verification
- `npm run build` passes (all routes render, JSON-LD serializes).
- Manual check: view-source on `/`, `/portfolio/<slug>`, `/materiale/<slug>` shows
  valid JSON-LD; `/robots.txt`, `/sitemap.xml`, `/llms.txt` resolve.

## Out of scope (future passes)
- FAQ content + FAQPage schema
- Core Web Vitals / animation refactor (see 2026-04-14 strategy doc)
- Review collection → aggregateRating
