# Cere Ofertă — Friendly Wizard Redesign

**Date:** 2026-07-01
**Branch:** feature/crafto-warm-redesign
**Replaces:** the Basic/Advanced configurator at `/configurator`

## Goal

Turn the dense two-column Basic/Advanced configurator into a warm, hand-holding,
one-question-per-screen wizard. It should feel friendly and reassuring — predefined
icon answers, a **"Nu știu încă"** escape on every step (never a dead end), file
uploads, and a rezumat emailed to both the client and EpicMob.

## Decisions (locked)

- **Scope:** fully replace Basic/Advanced with one guided wizard.
- **Look:** warm Crafto palette (`cream`/`sand`/`clay`/`terracotta`/`espresso`).
- **Depth:** light core steps + one optional "if you already know" detail step.
- **Icons:** Streamline **Colors** (multi-color SVGs) downloaded to
  `public/icons/streamline/`, rendered via `<img>`. Placeholder SVGs ship now and
  are swapped 1:1 for the real downloads (same filenames).
- **Email:** Resend — branded confirmation to the client + lead notification to
  EpicMob. Both include the summary and file links.
- **Uploads:** Vercel Blob; links included in the email. Accept any file type,
  validate size only (25MB/file).

## Flow (9 steps)

1. **Tip imobil** — *Unde dorești lucrarea?* Apartament · Casă · Spațiu birouri ·
   Centru comercial · Altceva
2. **Starea spațiului** — *Cum se prezintă spațiul?* Gol/nou · Mobilat (evacuare
   mobilă veche) · În construcție/șantier · Nu știu încă
3. **Camere** *(multi)* — Bucătărie · Dressing · Living · Dormitor · Baie · Birou ·
   Hol · Toată casa · Ajutați-mă să aleg
4. **Măsurători & fișiere** — *Ai schițe, planuri sau poze?* + optional dropzone
5. **Stil** — Modern · Cald & natural · Clasic elegant · Industrial · Nu știu,
   arătați-mi idei
6. **Detalii — opțional (skippable)** — materiale, finisaje, iluminare
7. **Buget & termen** — range + Cât mai repede / 1–3 luni / 3–6 luni / Prefer să discutăm
8. **Contact** — nume, telefon, email + preferință (WhatsApp / telefon / email)
9. **Rezumat** — editable recap → Trimite → success + WhatsApp handoff

## Interaction

- Single-select cards auto-advance (~250ms). Multi-select has an explicit Continuă.
- `"Nu știu încă"` styled softer; stamps the field as *"ne consultăm"* in the summary.
- Back arrow + progress dots ("Pasul X din 9"). Framer Motion slide/fade.
- State in one `useReducer`, mirrored to `sessionStorage` so refresh keeps progress.
- Upload: drag-drop + browse, thumbnails, per-file progress, remove, 25MB/file guard.

## Architecture

```
components/configurator/wizard/
  quote-wizard.tsx        orchestrator (useReducer + step router)
  wizard-progress.tsx     dots + step counter + back
  wizard-step.tsx         shell: serif question + Framer transition
  answer-card.tsx         Streamline icon + label (single/multi)
  upload-dropzone.tsx     drag-drop, previews, progress
  summary-step.tsx        editable recap → submit
lib/quote-wizard.ts       step catalog, QuoteAnswers type, validator, summary builder
public/icons/streamline/  Streamline Colors SVGs (placeholders for now)
app/api/upload/route.ts   Vercel Blob put()
app/api/quote/route.ts    validate → Resend (client + business) → webhook + WhatsApp
```

- **Data model:** flat `QuoteAnswers` — `propertyType`, `spaceState`, `rooms[]`,
  `plansStatus`, `files[]`, `style`, optional `materials/finishes/lighting`,
  `budget`, `timeline`, `contact{name,phone,email,preference}`. Every field allows a
  `"nu-stiu"` sentinel.
- **Submit:** validate → build Romanian summary → send both emails → keep optional
  webhook + WhatsApp link. Graceful: if email fails, still return success + WhatsApp.

## Env vars

- `RESEND_API_KEY` — Resend API key
- `QUOTE_FROM_EMAIL` — verified sender (e.g. `oferte@epicmob.ro`)
- `QUOTE_TO_EMAIL` — where leads land (e.g. `contact@epicmob.ro`)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (auto-set on Vercel)
- `QUOTE_WEBHOOK_URL` *(optional, existing)*

## Analytics (funnel + data capture)

Two lanes (`lib/wizard-analytics.ts`):

1. **Funnel counts → Vercel Web Analytics.** `trackEvent()` fires `wizard_started`,
   `wizard_step` (`{ step, index }`), `wizard_submitted` (`{ emailed }`).
   `<Analytics/>` is mounted in `app/layout.tsx`. Enable **Analytics** on the Vercel
   project for data to appear; drop-off = `started` − `step:contact` − `submitted`.
2. **Actual answers → Google Sheet.** `sendRecord()` beacons the full readable
   record (`buildQuoteRecord`) to `/api/track` (same-origin, so no CORS), which
   forwards to `GOOGLE_SHEET_WEBHOOK_URL`. Captured on **submit** (`status:"submitted"`)
   and on **tab-close if anything was filled** (`status:"abandoned"`, via
   `navigator.sendBeacon`). Per decision, abandonment captures everything, incl.
   name/phone/email (GDPR note: personal data stored pre-submit).

### Google Sheet webhook (Apps Script)

Extensions → Apps Script, paste, Deploy → Web App (execute as you, access: Anyone),
copy the `/exec` URL into `GOOGLE_SHEET_WEBHOOK_URL`:

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  const headers = ['ts','status','sessionId','step','index','propertyType','spaceState',
    'rooms','plansStatus','style','materials','finishes','lighting','timeline',
    'name','phone','email','contactPreference','filesCount','fileUrls','emailed'];
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  sheet.appendRow(headers.map(h => (data[h] !== undefined ? data[h] : '')));
  return ContentService.createTextOutput('ok');
}
```

## Removed

- `components/configurator/configurator-page-view.tsx`
- `lib/configurator.ts`
