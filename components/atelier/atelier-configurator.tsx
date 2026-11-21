"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, Info, Loader2, Undo2, X } from "lucide-react";
import { trackFunnel, trackFunnelOnce } from "@/lib/atelier/funnel";
import { effectiveHandle } from "@/lib/atelier/handles";
import { decodeShare, shareCodeFrom } from "@/lib/atelier/share";
import { activePaletteId, resolvePalettes } from "@/lib/atelier/palettes";
import type { AtelierAction } from "@/lib/atelier/state";
import { useLivePrice } from "@/lib/atelier/use-live-price";
import type { AtelierCatalog, AtelierConfig, AtelierIssue, AtelierScene } from "@/lib/atelier/types";
import { carcassLook, frontLook, worktopLook } from "./material-look";
import { KitchenSize, StepKitchen, type KitchenPick } from "./step-kitchen";
import { REQUEST_FORM_ID, leadSentFor, type LeadStatus } from "./request-form";
import {
  EMPTY_CONTACT,
  STEP_IDS,
  initialSession,
  loadSession,
  nearestStep,
  saveSession,
  sessionReducer,
  stepLabel,
  stepsFor,
  withGlassDefaults,
  type Act,
  type LeadContact,
  type StepId,
} from "./session";
import { StepBar } from "./step-bar";
import { StepColors } from "./step-colors";
import { StepDoors } from "./step-doors";
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

const SIZE_ACTIONS = new Set<AtelierAction["type"]>(["setSize", "setLegs", "setKitchenLayout", "setLegB"]);
const INTERIOR_ACTIONS = new Set<AtelierAction["type"]>([
  "setColumnWidth",
  "setColumnContent",
  "setColumnDrawers",
  "setColumnRail",
  "setColumnShelves",
  "addColumn",
  "removeColumn",
  "equalizeColumns",
  "setDoors",
  "setHandle",
  "setDoorFill",
  "setDoorFills",
  "setDoorGlass",
  "setColumnDoorRows",
  "setColumnDoorsAcross",
  "setBottom",
  "setColumnUpper",
  "setLed",
]);

/** Changes whose result is on the outside of the doors: the 3D view closes them so the change is seen. */
const DOOR_ACTIONS = new Set<AtelierAction["type"]>([
  "setDoors",
  "setHandle",
  "setDoorFill",
  "setDoorFills",
  "setDoorGlass",
  "setColumnDoorRows",
  "setColumnDoorsAcross",
]);

/** The step where the client can fix an error / warning from the price service. */
function stepForIssue(issue: AtelierIssue): StepId {
  // „Ușile ar avea 285 cm… Micșorează înălțimea dulapului" is fixed by the height, not by the doors
  if (issue.code === "USA_PREA_INALTA" || (issue.column == null && /(mic[șs]oreaz[ăa]|redu)\w* [îi]n[ăa]l[țt]imea/iu.test(issue.message)))
    return "dimensiuni";
  if (issue.column != null) return "interior";
  if (/MATERIAL/.test(issue.code)) return "culori";
  // \b is ASCII-only („bară" ends in a non-ASCII letter), hence the lookahead
  if (issue.code === "MANER_FRONTURI" || /mâner|oglin|sticl/iu.test(issue.message)) return "usi";
  if (/coloan|compartiment|uș[ăi]|sertar|poliț|bar[ăa](?!\p{L})/iu.test(issue.message)) return "interior";
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
  const { config, contact } = session;
  // a change can take a step away (the last handled front removed): show the next one that exists
  const step = nearestStep(session.step, config);
  const setContact = useCallback((next: LeadContact) => dispatch({ type: "contact", contact: next }), []);
  const { result, loading, unavailable, retry } = useLivePrice(config);
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
  const worktop = useMemo(() => worktopLook(catalog, config), [catalog, config]);
  const isKitchen = (config.category === "BUCATARIE" || config.category === "BAIE");
  const activePalette = activePaletteId(palettes, config);
  // the handle on the fronts (null when no front takes one) and the colour it is drawn in
  const shownHandle = useMemo(() => effectiveHandle(config), [config]);
  const resetHandleName = shownHandle?.type === "PUSH" ? "varianta fără mâner" : "mânerul bară";

  // The Interior step shows the interior: doors open while the client is there and close on leaving,
  // unless the client used the toggle — that choice then stays until the next visit to Interior.
  const [manualDoors, setManualDoors] = useState<boolean | null>(null);
  /** the doors were closed by a door / handle change (not by the client's toggle) */
  const autoClosed = useRef(false);
  // a new body decor is hidden behind closed doors: open them for a moment so the change is seen
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef<number | null>(null);
  const doorsOpen = manualDoors ?? (step === "interior" || peek);
  // „Uși și mânere": the 3D view looks at what is being chosen — the whole front for doors and
  // mirrors, a close view of a front edge for handles
  const [usiPart, setUsiPart] = useState<"doors" | "handles">("doors");
  const viewFocus: "doors" | "handles" | null =
    step !== "usi" ? null : config.category !== "DRESSING" ? (shownHandle ? "handles" : null) : usiPart === "handles" && shownHandle ? "handles" : "doors";
  useEffect(() => {
    if (step !== "usi") return;
    // the section that fills more of the free band between the step bar and the footer
    const measure = () => {
      const panel = scrollRef.current;
      if (!panel) return;
      const handles = panel.querySelector<HTMLElement>('[data-anchor="manere"]');
      const doors = panel.querySelector<HTMLElement>('[data-anchor="usi"]');
      if (!handles || !doors) return;
      const own = panel.scrollHeight > panel.clientHeight + 2 && getComputedStyle(panel).overflowY !== "visible";
      const top = own ? panel.getBoundingClientRect().top : (document.querySelector<HTMLElement>(".atelier-app__head")?.getBoundingClientRect().bottom ?? 0);
      const bottom = document.querySelector<HTMLElement>(".atelier-foot")?.getBoundingClientRect().top ?? window.innerHeight;
      const seen = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return Math.max(0, Math.min(r.bottom, bottom) - Math.max(r.top, top));
      };
      setUsiPart(seen(handles) > seen(doors) ? "handles" : "doors");
    };
    const panel = scrollRef.current;
    window.addEventListener("scroll", measure, { passive: true });
    panel?.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("scroll", measure);
      panel?.removeEventListener("scroll", measure);
    };
  }, [step]);
  const [pickedColumn, setPickedColumn] = useState(0);
  const column = Math.min(pickedColumn, config.columns.length - 1);
  const [kitchenPick, setKitchenPick] = useState<KitchenPick>({ leg: "A", index: 0 });
  const highlight = useMemo(() => {
    if (isKitchen) {
      // only the main wall is highlighted (the second wall of an L is drawn rotated)
      if (kitchenPick.leg !== "A" || !config.columns[kitchenPick.index]) return null;
      const x0 = config.columns.slice(0, kitchenPick.index).reduce((sum, c) => sum + c.widthMm, 0);
      return { x0, x1: x0 + config.columns[kitchenPick.index].widthMm };
    }
    const x0 = config.columns.slice(0, column).reduce((sum, c) => sum + c.widthMm, 0);
    return { x0, x1: x0 + (config.columns[column]?.widthMm ?? 0) };
  }, [config.columns, column, isKitchen, kitchenPick]);
  // the strip under the chosen column shows while the interior is visible, or right after a pick
  const [justPicked, setJustPicked] = useState(false);
  const pickTimer = useRef<number | null>(null);
  const pickColumn = useCallback((index: number) => {
    setPickedColumn(index);
    setJustPicked(true);
    if (pickTimer.current !== null) window.clearTimeout(pickTimer.current);
    pickTimer.current = window.setTimeout(() => setJustPicked(false), 2500);
  }, []);
  const onKitchenPick = useCallback((pick: KitchenPick) => {
    setKitchenPick(pick);
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
  const fixStep = hasErrors ? nearestStep(stepForIssue(errors[0]), config) : null;
  // an error the height fixes is also shown right at the height control
  const heightIssue = errors.find((e) => e.code === "USA_PREA_INALTA" || (stepForIssue(e) === "dimensiuni" && /[îi]n[ăa]l[țt]im/iu.test(e.message)));

  // „Două fețe" is offered for every painted model, but some can only be priced on one face:
  // when the service says so, go back to one face and switch the option off for that model.
  const [noTwoFaces, setNoTwoFaces] = useState<string | null>(null);
  const vopsitModel = config.fronts.kind === "MDF_VOPSIT" ? (config.fronts.modelId ?? "") : null;
  if (
    !loading &&
    vopsitModel !== null &&
    config.fronts.faces === 2 &&
    errors.some((e) => e.code === "MATERIAL_INDISPONIBIL")
  ) {
    setNoTwoFaces(vopsitModel);
    dispatch({ type: "config", actions: [{ type: "setFronts", fronts: { ...config.fronts, faces: 1 } }], at: 0 });
  }
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
    const hashed = stepFromHash();
    // „Arată-i cuiva configurația": ?c=… reopens exactly that configuration (on its summary), and wins
    // over whatever this tab had before. The code is checked field by field; a bad one is ignored.
    const code = shareCodeFrom(window.location.search);
    if (code !== null) {
      const shared = decodeShare(code, catalog);
      // the code is used once: a reload then keeps whatever the visitor changed since
      const params = new URLSearchParams(window.location.search);
      params.delete("c");
      const query = params.toString();
      const openAt: StepId | null = shared ? nearestStep(hashed ?? "oferta", shared) : hashed;
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${openAt ? `#${openAt}` : ""}`);
      if (shared) {
        restoredStep.current = openAt;
        dispatch({ type: "restore", config: withGlassDefaults(shared, catalog), step: openAt ?? "oferta", contact: stored?.contact ?? EMPTY_CONTACT });
        return;
      }
    }
    const linked = hashed ? nearestStep(hashed, stored?.config ?? session.config) : null;
    if (stored) {
      restoredStep.current = linked ?? stored.step;
      dispatch({ type: "restore", ...stored, step: linked ?? stored.step });
    } else if (linked) {
      restoredStep.current = linked;
      dispatch({ type: "step", step: linked });
    }
    // keep the address in step with the screen, so Back from a later step returns here
    if (!linked && stored && stored.step !== "model") window.history.replaceState(null, "", `#${stored.step}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on mount
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
    dispatch({ type: "config", actions, at: Date.now(), catalog });
    if (actions.some((a) => a.type === "setCarcass")) {
      setPeek(true);
      if (peekTimer.current !== null) window.clearTimeout(peekTimer.current);
      peekTimer.current = window.setTimeout(() => setPeek(false), 2200);
    }
    // doors, mirrors and handles live on the outside: close the doors so the choice is seen at once
    if (actions.some((a) => DOOR_ACTIONS.has(a.type))) {
      setUsiPart(actions.some((a) => a.type === "setHandle") ? "handles" : "doors");
      setManualDoors(false);
      autoClosed.current = true;
    } else if (autoClosed.current && actions.some((a) => INTERIOR_ACTIONS.has(a.type))) {
      // back to work on the interior: show it again (the doors were closed by us, not by the client)
      setManualDoors(null);
      autoClosed.current = false;
    }
    for (const a of actions) {
      if (SIZE_ACTIONS.has(a.type)) trackFunnelOnce("size_changed");
      else if (INTERIOR_ACTIONS.has(a.type)) trackFunnelOnce("interior_changed");
    }
  }, [catalog]);

  const onDoorsToggle = useCallback((open: boolean) => {
    autoClosed.current = false;
    setManualDoors(open);
  }, []);

  // opening things in the 3D view: reported once per visit and per kind. The CRM accepts a fixed list of
  // event names, so this rides on „interior_changed" with what was opened in the props.
  const onInteract = useCallback((kind: "door" | "drawer" | "sliding" | "all", open: boolean) => {
    if (!open) return;
    const what = kind === "door" ? "door_opened" : kind === "drawer" ? "drawer_opened" : kind === "sliding" ? "sliding_moved" : "all_opened";
    trackFunnelOnce("interior_changed", { what }, `interior_changed:${what}`);
  }, []);

  /* ── every step is a history entry: the browser's Back goes to the previous step ── */
  const stepNow = useRef<StepId>(step);
  useEffect(() => {
    stepNow.current = step;
  }, [step]);
  const showStep = useCallback((next: StepId) => {
    dispatch({ type: "step", step: next });
    setIssuesOpen(false);
    // entering „Interior" always shows the interior again, and „Uși și mânere" the closed doors,
    // whatever was toggled before
    if (next === "interior" || next === "usi") setManualDoors(null);
    if (next === "usi") setUsiPart("doors");
    // start the new step from its top: the panel's own scroll (desktop) or the page (mobile)
    scrollRef.current?.scrollTo({ top: 0 });
    const app = appRef.current;
    if (app && !window.matchMedia(TWO_PANE).matches) {
      const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      const top = app.getBoundingClientRect().top + window.scrollY - header;
      if (window.scrollY > top) window.scrollTo({ top });
    }
  }, []);
  /** a section a „Modifică" link asked for: scrolled into view and highlighted once the step is on screen */
  const [focus, setFocus] = useState<{ anchor: string; n: number } | null>(null);
  const goTo = useCallback(
    (next: StepId, anchor?: string) => {
      if (next !== stepNow.current) window.history.pushState(null, "", `#${next}`);
      showStep(next);
      setFocus((f) => (anchor ? { anchor, n: (f?.n ?? 0) + 1 } : null));
      if (next === "usi" && anchor === "manere") setUsiPart("handles");
    },
    [showStep],
  );
  useEffect(() => {
    if (!focus) return;
    let flash: number | null = null;
    let target: HTMLElement | null = null;
    // after the step has faded in (and a collapsed part has opened)
    const timer = window.setTimeout(() => {
      target = scrollRef.current?.querySelector<HTMLElement>(`[data-anchor="${focus.anchor}"]`) ?? null;
      if (!target) return;
      const panel = scrollRef.current!;
      const own = panel.scrollHeight > panel.clientHeight + 2 && getComputedStyle(panel).overflowY !== "visible";
      const top = target.getBoundingClientRect().top;
      if (own) panel.scrollBy({ top: top - panel.getBoundingClientRect().top - 12, behavior: "smooth" });
      else {
        // phones: the viewer and the step bar are stuck above the panel
        const head = document.querySelector<HTMLElement>(".atelier-app__head")?.getBoundingClientRect().bottom ?? 0;
        window.scrollBy({ top: top - head - 12, behavior: "smooth" });
      }
      target.classList.add("is-flash");
      flash = window.setTimeout(() => target?.classList.remove("is-flash"), 2200);
    }, 320);
    return () => {
      window.clearTimeout(timer);
      if (flash !== null) window.clearTimeout(flash);
      target?.classList.remove("is-flash");
    };
  }, [focus]);
  // „Am anulat: …" goes away by itself
  const undone = session.undone;
  useEffect(() => {
    if (!undone) return;
    const timer = window.setTimeout(() => dispatch({ type: "dismissUndone" }), 3200);
    return () => window.clearTimeout(timer);
  }, [undone]);
  useEffect(() => {
    const onPop = () => {
      setFocus(null);
      showStep(stepFromHash() ?? "model");
    };
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
    dispatch({ type: "restore", config: initialSession(catalog).config, step, contact });
    goTo("model");
  }, [catalog, contact, goTo, step]);

  const onLead = useCallback(
    (next: LeadStatus) => {
      setLead(next);
      // the confirmation sits at the top of the step: bring it into view
      if (next.kind === "success") goTo("oferta");
    },
    [goTo],
  );

  const steps = stepsFor(config);
  const stepIndex = steps.indexOf(step);
  const nextStep = steps[stepIndex + 1] as StepId | undefined;
  const prevStep = steps[stepIndex - 1] as StepId | undefined;
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
            worktop={worktop}
            updating={loading}
            doorsOpen={doorsOpen}
            onDoorsOpenChange={onDoorsToggle}
            highlight={step === "interior" && (doorsOpen || justPicked) ? highlight : null}
            handles={shownHandle?.type === "APLICAT"}
            handle={shownHandle?.type ?? null}
            handleFinish={shownHandle?.finish ?? undefined}
            onInteract={onInteract}
            focus={viewFocus}
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
          {undone && (
            <p key={undone.n} className="atelier-undone" role="status">
              Am anulat: {undone.what}
            </p>
          )}
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
                    noTwoFaces={noTwoFaces !== null && noTwoFaces === vopsitModel}
                    focus={focus?.anchor ?? null}
                  />
                )}
                {step === "dimensiuni" && isKitchen && (
                  <KitchenSize
                    config={config}
                    act={act}
                    heightIssue={heightIssue ? issueMessage(heightIssue.message, false) : null}
                  />
                )}
                {step === "dimensiuni" && !isKitchen && (
                  <StepSize
                    config={config}
                    act={act}
                    heightIssue={heightIssue ? issueMessage(heightIssue.message, config.category === "DRESSING") : null}
                  />
                )}
                {step === "usi" && <StepDoors catalog={catalog} config={config} act={act} front={front} />}
                {step === "interior" && isKitchen && (
                  <StepKitchen config={config} act={act} pick={kitchenPick} onPick={onKitchenPick} />
                )}
                {step === "interior" && !isKitchen && (
                  <StepInterior config={config} act={act} column={column} onColumn={pickColumn} onStep={goTo} />
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
            {session.notices.length > 0 && (
              <div className="atelier-notice" role="status">
                <Info size={15} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  {session.notices.includes("WHITE_BODY") && (
                    <p>La ușile cu oglindă facem corpul alb simplu, așa că l-am schimbat. Îl poți alege din nou la „Culori”.</p>
                  )}
                  {session.notices.includes("HANDLE_RESET") && (
                    <p>Mânerul ales nu se potrivește cu schimbarea făcută, așa că am pus {resetHandleName}. Îl poți schimba la „Mânere”.</p>
                  )}
                </div>
                <button type="button" className="atelier-issue__close" aria-label="Închide mesajul" onClick={() => dispatch({ type: "dismissNotice" })}>
                  <X size={16} aria-hidden="true" />
                </button>
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
                  <span className={`atelier-price__note ${hasErrors ? "is-error" : ""}`}>
                    {priceNote}
                    {down && !loading && (
                      <button type="button" className="atelier-inlinebtn atelier-price__retry" onClick={retry}>
                        Reîncearcă
                      </button>
                    )}
                  </span>
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
