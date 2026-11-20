"use client";

import { Info, PencilRuler, PhoneCall, Ruler, ShieldCheck, Wrench } from "lucide-react";
import { categoryRules } from "@/lib/atelier/categories";
import { currentGlass, doorsSummary, hasGlass, hasMirror } from "@/lib/atelier/door-types";
import { effectiveHandle, handleText, usesFronts } from "@/lib/atelier/handles";
import { ralNameRo } from "@/lib/atelier/ral-names";
import type { ResolvedPalette } from "@/lib/atelier/palettes";
import { COMBO_PRESETS, presetById, presetsFor } from "@/lib/atelier/presets";
import type { AtelierCatalog, AtelierConfig } from "@/lib/atelier/types";
import { glazingOf } from "./glass-look";
import { swatchStyle, type MaterialLook } from "./material-look";
import { MiniPreview } from "./mini-preview";
import { LeadSent, RequestForm, leadSentFor, type LeadStatus } from "./request-form";
import { shapeKey, shapeOf, type LeadContact, type StepId } from "./session";
import { ShareBlock } from "./share-block";
import { Section, cm, decorName, decorTitle, formatLei, plural } from "./ui";

function Row({
  label,
  step,
  anchor,
  onStep,
  children,
}: {
  label: string;
  step: StepId;
  /** the section of that step „Modifică" lands on (scrolled into view and highlighted) */
  anchor: string;
  onStep: (step: StepId, anchor?: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="atelier-summary__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
      <button type="button" className="atelier-textbtn" onClick={() => onStep(step, anchor)} aria-label={`Modifică: ${label}`}>
        Modifică
      </button>
    </div>
  );
}

function Decor({ look, name }: { look: MaterialLook; name: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="atelier-current__dot" style={swatchStyle(look)} aria-hidden="true" />
      <span className="min-w-0 truncate">{decorTitle(name)}</span>
    </span>
  );
}

export function StepOffer({
  catalog,
  config,
  palettes,
  activePalette,
  carcass,
  front,
  price,
  priceNote,
  notes,
  blocked,
  unavailable,
  contact,
  onContact,
  status,
  onStatus,
  onStep,
  onStartOver,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  palettes: ResolvedPalette[];
  activePalette: string | null;
  carcass: MaterialLook;
  front: MaterialLook;
  price: number | null;
  /** routine remarks from the price service (not errors) */
  notes: string[];
  /** shown instead of the price when there is none (errors, unavailable, still computing) */
  priceNote: string;
  blocked: boolean;
  /** no price can be computed right now: the request cannot be sent */
  unavailable: boolean;
  contact: LeadContact;
  onContact: (contact: LeadContact) => void;
  status: LeadStatus;
  onStatus: (status: LeadStatus) => void;
  onStep: (step: StepId, anchor?: string) => void;
  /** after a sent request: start a fresh configuration (contact details stay) */
  onStartOver: () => void;
}) {
  const key = shapeKey(config);
  const preset = presetsFor(config.category).find((p) => shapeKey(p.shape) === key);
  // still exactly a ready-made combination (model + colours)?
  const combo = COMBO_PRESETS.find((c) => {
    const base = presetById(c.presetId);
    return c.paletteId === activePalette && !!base && shapeKey(base.shape) === key;
  });
  const palette = palettes.find((p) => p.id === activePalette);
  const category = categoryRules(config.category).label;
  const carcassName = catalog.carcass.find((m) => m.id === config.carcassMaterialId)?.name ?? "—";
  const { fronts } = config;
  const ral = catalog.ral.find((r) => r.code === fronts.ralCode);
  const frontName =
    fronts.kind === "MDF_VOPSIT"
      ? ral ? `Vopsit: ${ralNameRo(ral.name) || ral.code} (${ral.code})` : "Vopsit"
      : catalog.fronts[fronts.kind].find((m) => m.id === fronts.materialId)?.name ?? "—";
  const doors = doorsSummary(config);
  // which mirror / glass, when a door has one and the catalog names the types
  const mirror = hasMirror(config) ? currentGlass(catalog.glass?.mirrors, config.doors.mirrorId) : null;
  const glass = hasGlass(config) ? currentGlass(catalog.glass?.glasses, config.doors.glassId) : null;
  const bottom =
    config.category === "SEPARATOR"
      ? !config.bottom || config.bottom.type === "NONE"
        ? "deschis până jos"
        : config.bottom.type === "SERTARE"
          ? `${plural(config.bottom.drawers ?? 2, "sertar", "sertare")} jos`
          : "uși jos"
      : null;
  const shownHandle = effectiveHandle(config);
  const handle = shownHandle ? handleText(shownHandle) : null;
  const dressing = config.category === "DRESSING";
  const sent = leadSentFor(status, config);

  return (
    <div className="atelier-stack">
      {sent && <LeadSent onAgain={onStartOver} />}
      <Section title="Configurația ta">
        <div className="atelier-summary">
          <div className="atelier-summary__top">
            <span className="atelier-summary__art">
              <MiniPreview shape={shapeOf(config)} carcass={carcass} front={front} glazing={glazingOf(catalog, config.doors)} className="h-full w-full" />
            </span>
            <div className="min-w-0">
              <p className="atelier-summary__name">{combo?.name ?? preset?.name ?? "Configurație personalizată"}</p>
              <p className="atelier-hint">
                {combo && preset ? `${category} · ${preset.name}` : category}
              </p>
              <p className="atelier-summary__price">
                {price != null ? formatLei(price) : <span className="atelier-summary__note">{priceNote}</span>}
              </p>
              {price != null && <p className="atelier-hint">preț estimativ — cel final se stabilește după măsurători</p>}
            </div>
          </div>
          <dl>
            <Row label="Dimensiuni" step="dimensiuni" anchor="dimensiuni" onStep={onStep}>
              {cm(config.widthMm)} × {cm(config.heightMm)} × {cm(config.depthMm)} cm
            </Row>
            {palette && (
              <Row label="Culori" step="culori" anchor="culori" onStep={onStep}>
                {palette.name}
              </Row>
            )}
            <Row label="Corp" step="culori" anchor="corp" onStep={onStep}>
              <Decor look={carcass} name={carcassName} />
            </Row>
            {/* only when a door or a drawer front is really made of it (not behind all-mirror doors) */}
            {usesFronts(config) && (
              <Row label="Fronturi" step="culori" anchor="fronturi" onStep={onStep}>
                <Decor look={front} name={frontName} />
              </Row>
            )}
            <Row label={dressing ? "Interior" : "Compartimente"} step="interior" anchor={bottom && !dressing ? "jos" : "coloane"} onStep={onStep}>
              {plural(config.columns.length, dressing ? "coloană" : "compartiment", dressing ? "coloane" : "compartimente")}
              {bottom ? ` · ${bottom}` : ""}
            </Row>
            {doors && (
              <Row label="Uși" step="usi" anchor="usi" onStep={onStep}>
                {doors}
              </Row>
            )}
            {mirror && (
              <Row label="Oglindă" step="usi" anchor="oglinda" onStep={onStep}>
                {decorName(mirror.name)}
              </Row>
            )}
            {glass && (
              <Row label="Sticlă" step="usi" anchor="sticla" onStep={onStep}>
                {decorName(glass.name)}
              </Row>
            )}
            {handle && (
              <Row label="Mânere" step="usi" anchor="manere" onStep={onStep}>
                {handle}
              </Row>
            )}
          </dl>
        </div>
      </Section>

      {notes.length > 0 && (
        <div className="atelier-notes">
          <p className="atelier-notes__title">
            <Info size={15} aria-hidden="true" /> De știut
          </p>
          <ul>
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="atelier-hint mt-1">Sunt recomandări, nu probleme — le lămurim împreună la măsurători.</p>
        </div>
      )}

      <Section title="Ce primești">
        <ul className="atelier-gets">
          <li>
            <Ruler size={18} aria-hidden="true" />
            <span>Măsurători la tine acasă</span>
          </li>
          <li>
            <PencilRuler size={18} aria-hidden="true" />
            <span>Proiect pe dimensiunile tale</span>
          </li>
          <li>
            <Wrench size={18} aria-hidden="true" />
            <span>Montaj inclus</span>
          </li>
          <li>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Garanție 5 ani</span>
          </li>
        </ul>
      </Section>

      {!sent && (
        <Section title="Trimite-ne configurația" hint="Te sunăm, venim la măsurători și îți confirmăm prețul final.">
          <RequestForm
            config={config}
            blocked={blocked}
            unavailable={unavailable}
            contact={contact}
            onContact={onContact}
            price={price}
            status={status}
            onStatus={onStatus}
          />
          <ul className="atelier-trust">
            <li>
              <PhoneCall size={16} aria-hidden="true" />
              <span>Te sunăm noi ca să stabilim detaliile.</span>
            </li>
            <li>
              <Ruler size={16} aria-hidden="true" />
              <span>Venim la măsurători; prețul de aici este estimativ.</span>
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Fără obligații: cererea nu este o comandă.</span>
            </li>
          </ul>
        </Section>
      )}

      <ShareBlock config={config} price={price} />
    </div>
  );
}
