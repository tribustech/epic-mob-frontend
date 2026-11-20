"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, Info, Loader2, Undo2, X } from "lucide-react";
import { trackFunnel, trackFunnelOnce } from "@/lib/atelier/funnel";
import { currentHandle, hasHandledFronts } from "@/lib/atelier/handles";
import { activePaletteId, resolvePalettes } from "@/lib/atelier/palettes";
import type { AtelierAction } from "@/lib/atelier/state";
import { useLivePrice } from "@/lib/atelier/use-live-price";
import type { AtelierCatalog, AtelierConfig, AtelierIssue, AtelierScene } from "@/lib/atelier/types";
import { carcassLook, frontLook } from "./material-look";
import { REQUEST_FORM_ID, leadSentFor, type LeadStatus } from "./request-form";
import {
  STEP_IDS,
  initialSession,
  loadSession,
  saveSession,
  sessionReducer,
  stepLabel,
  type Act,
  type LeadContact,
  type StepId,
} from "./session";
import { StepBar } from "./step-bar";
import { StepColors } from "./step-colors";
import { StepInterior } from "./step-interior";
import { StepModel } from "./step-model";
import { StepOffer } from "./step-offer";
import { StepSize } from "./step-size";
import { formatLei, issueMessage, plural } from "./ui";

// three.js needs the browser (WebGL); keep it out of SSR and out of the initial bundle.
const Viewer3D = dynamic(() => import("./viewer-3d"), {
  ssr: false,
  loading: () => <div className="atelier-viewer__loading">Se încarcă vizualizarea 3D…</div>,
});

/** The desktop layout (viewer beside a panel with its own scroll); everything else scrolls the page. */
const TWO_PANE = "(min-width: 1024px) and (min-height: 560px)";

const SIZE_ACTIONS = new Set<AtelierAction["type"]>(["setSize", "setLegs"]);
const INTERIOR_ACTIONS = new Set<AtelierAction["type"]>([
  "setColumnWidth",
  "setColumnContent",
  "setColumnDrawers",
  "setColumnRail",
  "setColumnShelves",
  "addColumn",
  "removeColumn",
  "setDoors",
  "setHandle",
  "setColumnDoorRows",
  "setColumnDoorsAcross",
  "setBottom",
]);

/** The step where the client can fix an error / warning from the price service. */
function stepForIssue(issue: AtelierIssue): StepId {
  // „Ușile ar avea 285 cm… Micșorează înălțimea dulapului" is fixed by the height, not by the doors
  if (issue.code === "USA_PREA_INALTA" || (issue.column == null && /(mic[șs]oreaz[ăa]|redu)\w* [îi]n[ăa]l[țt]imea/iu.test(issue.message)))
    return "dimensiuni";
  if (issue.column != null) return "interior";
  if (/MATERIAL/.test(issue.code)) return "culori";
  // \b is ASCII-only („bară" ends in a non-ASCII letter), hence the lookahead
  if (/coloan|compartiment|uș[ăi]|sertar|poliț|mâner|bar[ăa](?!\p{L})/iu.test(issue.message)) return "interior";
  return "dimensiuni";
}

/** The same remark on several columns reads as one line: „Coloanele 1, 2 și 3: …". */
function groupNotes(issues: AtelierIssue[], config: AtelierConfig): string[] {
  const byMessage = new Map<string, number[]>();
  const dressing = config.category === "DRESSING";
  for (const raw of issues) {
    const issue = { ...raw, message: issueMessage(raw.message, dressing) };
    const cols = byMessage.get(issue.message) ?? [];
    if (issue.column != null && issue.column >= 0 && issue.column < config.columns.length && !cols.includes(issue.column))
      cols.push(issue.column);
    byMessage.set(issue.message, cols);
  }
  return [...byMessage].map(([message, cols]) => {
    if (cols.length === 0) return message;
    const nums = cols.map((c) => c + 1).sort((x, y) => x - y);
    if (nums.length === 1) return `${dressing ? "Coloana" : "Compartimentul"} ${nums[0]}: ${message}`;
    const list = `${nums.slice(0, -1).join(", ")} și ${nums[nums.length - 1]}`;
    return `${dressing ? "Coloanele" : "Compartimentele"} ${list}: ${message}`;
  });
}

const stepFromHash = (): StepId | null => STEP_IDS.find((s) => `#${s}` === window.location.hash) ?? null;

/** „Coloana 2: …" when the service says which column the message is about. */
function issueText(issue: AtelierIssue, config: AtelierConfig): string {
  const dressing = config.category === "DRESSING";
  const message = issueMessage(issue.message, dressing);
  if (issue.column == null || issue.column < 0 || issue.column >= config.columns.length) return message;
  return `${dressing ? "Coloana" : "Compartimentul"} ${issue.column + 1}: ${message}`;
}

export function AtelierConfigurator({ catalog }: { catalog: AtelierCatalog }) {
  const [session, dispatch] = useReducer(sessionReducer, catalog, initialSession);
  const { config, step, contact } = session;
  const setContact = useCallback((next: LeadContact) => dispatch({ type: "contact", contact: next }), []);
  const { result, loading, unavailable } = useLivePrice(config);
  const [lead, setLead] = useState<LeadStatus>({ kind: "idle" });
  const [issuesOpen, setIssuesOpen] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep showing the last valid scene while a new one loads or when the
  // current configuration has errors / pricing is unavailable.
  const [lastScene, setLastScene] = useState<AtelierScene | null>(null);
  if (result?.scene && result.scene !== lastScene) setLastScene(result.scene);

  const columnContents = useMemo(() => config.columns.map((c) => c.content), [config.columns]);
  const railPositions = useMemo(() => config.columns.map((c) => c.railPosition), [config.columns]);
  const palettes = useMemo(() => resolvePalettes(catalog), [catalog]);
  const carcass = useMemo(() => carcassLook(catalog, config), [catalog, config]);
  const front = useMemo(() => frontLook(catalog, config), [catalog, config]);
  const activePalette = activePaletteId(palettes, config);

  // The Interior step shows the interior: doors open while the client is there and close on leaving,
  // unless the client used the toggle — that choice then stays until the next visit to Interior.
  const [manualDoors, setManualDoors] = useState<boolean | null>(null);
  // a new body decor is hidden behind closed doors: open them for a moment so the change is seen
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef<number | null>(null);
  const doorsOpen = manualDoors ?? (step === "interior" || peek);
  const [pickedColumn, setPickedColumn] = useState(0);
  const column = Math.min(pickedColumn, config.columns.length - 1);
  const highlight = useMemo(() => {
    const x0 = config.columns.slice(0, column).reduce((sum, c) => sum + c.widthMm, 0);
    return { x0, x1: x0 + (config.columns[column]?.widthMm ?? 0) };
  }, [config.columns, column]);
  // the strip under the chosen column shows while the interior is visible, or right after a pick
  const [justPicked, setJustPicked] = useState(false);
  const pickTimer = useRef<number | null>(null);
  const pickColumn = useCallback((index: number) => {
    setPickedColumn(index);
    setJustPicked(true);
    if (pickTimer.current !== null) window.clearTimeout(pickTimer.current);
    pickTimer.current = window.setTimeout(() => setJustPicked(false), 2500);
  }, []);
  useEffect(
    () => () => {
      if (pickTimer.current !== null) window.clearTimeout(pickTimer.current);
      if (peekTimer.current !== null) window.clearTimeout(peekTimer.current);
    },
    [],
  );

  const errors = result?.errors ?? [];
  const warnings = useMemo(() => result?.warnings ?? [], [result]);
  const hasErrors = errors.length > 0;
  // No price from the service: an outage, or an answer with neither a price nor an explanation.
  // Never keep showing the last price then — it may belong to another configuration.
  const down = unavailable || (!loading && result != null && !hasErrors && result.sellPrice == null);
  const price = hasErrors || down ? null : result?.sellPrice ?? null;
  const priceNote = down
    ? "Preț indisponibil momentan"
    : hasErrors
      ? "Are nevoie de o ajustare"
      : "Se calculează…";
  const fixStep = hasErrors ? stepForIssue(errors[0]) : null;
  // warnings are routine remarks: a quiet link by the price, and a calm list on the offer step
  const notes = useMemo(() => (hasErrors ? [] : groupNotes(warnings, config)), [hasErrors, warnings, config]);
  const showNotes = notes.length > 0 && step !== "oferta";

  /* ── a reload keeps the configuration and the step ── */
  const restored = useRef(false);
  /** the step a reload is about to bring back (so the default first step is not reported as viewed) */
  const restoredStep = useRef<StepId | null>(null);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const stored = loadSession(catalog);
    // a link straight to a step (#culori) wins over the step of the stored session
    const linked = stepFromHash();
    if (stored) {
      restoredStep.current = linked ?? stored.step;
      dispatch({ type: "restore", ...stored, step: linked ?? stored.step });
    } else if (linked) {
      restoredStep.current = linked;
      dispatch({ type: "step", step: linked });
    }
    stepRef.current = linked ?? stored?.step ?? "model";
    // keep the address in step with the screen, so Back from a later step returns here
    if (!linked && stepRef.current !== "model") window.history.replaceState(null, "", `#${stepRef.current}`);
  }, [catalog]);
  useEffect(() => {
    if (restored.current) saveSession(config, step, contact);
  }, [config, step, contact]);

  /* ── funnel ── */
  useEffect(() => {
    trackFunnelOnce("view");
  }, []);
  const trackedStep = useRef<StepId | null>(null);
  useEffect(() => {
    if (restoredStep.current && restoredStep.current !== step) return;
    restoredStep.current = null;
    if (trackedStep.current === step) return;
    trackedStep.current = step;
    trackFunnel("step_viewed", { step });
  }, [step]);
  useEffect(() => {
    if (price != null) trackFunnelOnce("price_shown", { price: Math.round(price) });
  }, [price]);

  const act = useCallback<Act>((action) => {
    const actions = Array.isArray(action) ? action : [action];
    dispatch({ type: "config", actions, at: Date.now() });
    if (actions.some((a) => a.type === "setCarcass")) {
      setPeek(true);
      if (peekTimer.current !== null) window.clearTimeout(peekTimer.current);
      peekTimer.current = window.setTimeout(() => setPeek(false), 2200);
    }
    for (const a of actions) {
      if (SIZE_ACTIONS.has(a.type)) trackFunnelOnce("size_changed");
      else if (INTERIOR_ACTIONS.has(a.type)) trackFunnelOnce("interior_changed");
    }
  }, []);

  /* ── every step is a history entry: the browser's Back goes to the previous step ── */
  const stepRef = useRef<StepId>("model");
  const showStep = useCallback((next: StepId) => {
    stepRef.current = next;
    dispatch({ type: "step", step: next });
    setIssuesOpen(false);
    // entering „Interior" always shows the interior again, whatever was toggled before
    if (next === "interior") setManualDoors(null);
    // start the new step from its top: the panel's own scroll (desktop) or the page (mobile)
    scrollRef.current?.scrollTo({ top: 0 });
    const app = appRef.current;
    if (app && !window.matchMedia(TWO_PANE).matches) {
      const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      const top = app.getBoundingClientRect().top + window.scrollY - header;
      if (window.scrollY > top) window.scrollTo({ top });
    }
  }, []);
  const goTo = useCallback(
    (next: StepId) => {
      if (next !== stepRef.current) window.history.pushState(null, "", `#${next}`);
      showStep(next);
    },
    [showStep],
  );
  useEffect(() => {
    const onPop = () => showStep(stepFromHash() ?? "model");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [showStep]);

  /* ── the remarks panel is a pop-over: it closes on a tap elsewhere and when the page scrolls ── */
  useEffect(() => {
    if (!issuesOpen) return;
    const startY = window.scrollY;
    const panel = scrollRef.current;
    const startTop = panel?.scrollTop ?? 0;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 24 || Math.abs((panel?.scrollTop ?? 0) - startTop) > 24) setIssuesOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest("#atelier-warnings, .atelier-notelink")) setIssuesOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    panel?.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      panel?.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [issuesOpen]);

  /** After a sent request: a fresh configuration from the first step; the contact details stay. */
  const startOver = useCallback(() => {
    setLead({ kind: "idle" });
    setManualDoors(null);
    setPickedColumn(0);
    dispatch({ type: "restore", config: initialSession(catalog).config, step: stepRef.current, contact });
    goTo("model");
  }, [catalog, contact, goTo]);

  const onLead = useCallback(
    (next: LeadStatus) => {
      setLead(next);
      // the confirmation sits at the top of the step: bring it into view
      if (next.kind === "success") goTo("oferta");
    },
    [goTo],
  );

  const stepIndex = STEP_IDS.indexOf(step);
  const nextStep = STEP_IDS[stepIndex + 1] as StepId | undefined;
  const prevStep = STEP_IDS[stepIndex - 1] as StepId | undefined;
  const sent = leadSentFor(lead, config);
  const sending = lead.kind === "sending";

  return (
    <MotionConfig reducedMotion="user">
      <div ref={appRef} className="atelier-app" data-step={step}>
        <div className="atelier-app__viewer">
          <Viewer3D
            scene={lastScene}
            columns={columnContents}
            railPositions={railPositions}
            carcass={carcass}
            front={front}
            updating={loading}
            doorsOpen={doorsOpen}
            onDoorsOpenChange={setManualDoors}
            highlight={step === "interior" && (doorsOpen || justPicked) ? highlight : null}
            handles={hasHandledFronts(config) && currentHandle(config) === "APLICAT"}
            stale={!loading && (hasErrors || down)}
          />
          <button
            type="button"
            className="atelier-undo"
            onClick={() => dispatch({ type: "undo" })}
            disabled={session.past.length === 0}
            aria-label="Anulează ultima schimbare"
            title="Anulează ultima schimbare"
          >
            <Undo2 size={16} aria-hidden="true" />
            <span>Anulează</span>
          </button>
        </div>

        <div className="atelier-app__panel">
          <header className="atelier-app__head">
            <div className="atelier-app__title">
              <h1>Configurează-ți mobilierul</h1>
            </div>
            <StepBar step={step} config={config} onStep={goTo} flagged={fixStep} />
          </header>

          <div
            ref={scrollRef}
            id="atelier-step-panel"
            role="tabpanel"
            aria-labelledby={`atelier-tab-${step}`}
            className="atelier-app__scroll"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {step === "model" && (
                  <StepModel
                    catalog={catalog}
                    config={config}
                    palettes={palettes}
                    activePalette={activePalette}
                    carcass={carcass}
                    front={front}
                    act={act}
                  />
                )}
                {step === "culori" && (
                  <StepColors
                    catalog={catalog}
                    config={config}
                    palettes={palettes}
                    activePalette={activePalette}
                    carcass={carcass}
                    front={front}
                    act={act}
                  />
                )}
                {step === "dimensiuni" && <StepSize config={config} act={act} />}
                {step === "interior" && (
                  <StepInterior catalog={catalog} config={config} act={act} column={column} onColumn={pickColumn} />
                )}
                {step === "oferta" && (
                  <StepOffer
                    catalog={catalog}
                    config={config}
                    palettes={palettes}
                    activePalette={activePalette}
                    carcass={carcass}
                    front={front}
                    price={price}
                    priceNote={priceNote}
                    notes={notes}
                    blocked={hasErrors}
                    unavailable={down}
                    contact={contact}
                    onContact={setContact}
                    status={lead}
                    onStatus={onLead}
                    onStep={goTo}
                    onStartOver={startOver}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="atelier-foot">
            {hasErrors && (
              <div className="atelier-issue atelier-issue--error" role="alert">
                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <ul>
                    {errors.map((issue, i) => (
                      <li key={`${issue.code}-${i}`}>{issueText(issue, config)}</li>
                    ))}
                  </ul>
                  {fixStep && fixStep !== step && (
                    <button type="button" className="atelier-textbtn mt-1" onClick={() => goTo(fixStep)}>
                      Ajustează la pasul „{stepLabel(fixStep, config)}”
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {showNotes && issuesOpen && (
              <div id="atelier-warnings" className="atelier-notes atelier-notes--foot">
                <div className="min-w-0 flex-1">
                  <ul>
                    {notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                  <p className="atelier-hint mt-1">Sunt recomandări, nu probleme — le lămurim la măsurători.</p>
                </div>
                <button type="button" className="atelier-issue__close" aria-label="Închide observațiile" onClick={() => setIssuesOpen(false)}>
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="atelier-foot__row">
              <div className="atelier-price" aria-live="polite">
                <span className="atelier-price__label">
                  Preț estimativ
                  {loading && !down && <Loader2 size={12} aria-label="se recalculează" className="atelier-spin" />}
                  {showNotes && (
                    <button
                      type="button"
                      className="atelier-notelink"
                      aria-expanded={issuesOpen}
                      aria-controls="atelier-warnings"
                      onClick={() => setIssuesOpen((v) => !v)}
                    >
                      <Info size={13} aria-hidden="true" />
                      {plural(notes.length, "observație", "observații")}
                    </button>
                  )}
                </span>
                {price != null ? (
                  <span className={`atelier-price__value ${loading ? "is-stale" : ""}`}>{formatLei(price)}</span>
                ) : (
                  <span className={`atelier-price__note ${hasErrors ? "is-error" : ""}`}>{priceNote}</span>
                )}
              </div>
              <div className="atelier-foot__nav">
                {prevStep && !(sent && step === "oferta") && (
                  <button type="button" className="atelier-btn atelier-btn--ghost" onClick={() => goTo(prevStep)} aria-label="Pasul anterior">
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>
                )}
                {nextStep ? (
                  <button type="button" className="atelier-btn atelier-btn--primary" onClick={() => goTo(nextStep)}>
                    Continuă
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                ) : (
                  !sent && (
                    <button
                      type="submit"
                      form={REQUEST_FORM_ID}
                      className="atelier-btn atelier-btn--primary"
                      aria-label={sending ? "Se trimite…" : "Trimite cererea"}
                      disabled={hasErrors || down || sending}
                    >
                      {sending ? (
                        "Se trimite…"
                      ) : (
                        <span>
                          Trimite<span className="atelier-wide"> cererea</span>
                        </span>
                      )}
                      {!sending && <ArrowRight size={18} aria-hidden="true" />}
                    </button>
                  )
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
