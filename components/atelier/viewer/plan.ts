import type { AtelierScene, HandleKind, ScenePiece } from "@/lib/atelier/types";

export type EffectiveHandle = HandleKind | "FARA";
/** How a front opens: hinged on the left / right, lifting up, or pulled out as a drawer. */
export type FrontMode = "L" | "R" | "T" | "DRAWER";
/** The edge of a front where the hand grips it (handle-less profiles are cut along it). */
export type GripEdge = "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * What kind of front it is, as a cabinet maker sees it. Everything about where the hand grips it
 * (handle position, milled edge, Gola channel) follows from this alone.
 */
export type FrontClass = "DRAWER" | "LIFT" | "TALL" | "WALL" | "BASE";

/** A hinged door at least this high is a wardrobe door: gripped on its side, at hand height. */
export const TALL_DOOR_MM = 1200;
/**
 * A short door whose top edge is above this is an upper door, gripped at its bottom: nobody
 * reaches over the top of it. (Every door that starts above ~1300 mm is one, and so is the middle
 * door of three in a column.)
 */
export const BASE_DOOR_TOP_MM = 1400;
/** The strip a Gola channel takes from a front: along a top / bottom edge, and down the side of a tall door. */
const GOLA_GAP_MM = 30;
const GOLA_SIDE_MM = 22;
/** The CRM draws Gola by shortening every front this much at the top (within a tolerance). */
const CRM_GOLA_GAP_MM: readonly [number, number] = [25, 45];
/** Sliding doors overlap their neighbours a little; a drawer counts as covered beyond this. */
const COVER_TOLERANCE_MM = 60;

/** `piece` at its full size (see fullFront). */
export function classifyFront(mode: FrontMode, piece: ScenePiece, wallHung: boolean): FrontClass {
  if (mode === "DRAWER") return "DRAWER";
  if (mode === "T") return "LIFT";
  if (piece.h >= TALL_DOOR_MM) return "TALL";
  return wallHung || piece.y + piece.h > BASE_DOOR_TOP_MM ? "WALL" : "BASE";
}

/**
 * The edge of a front where the hand pulls it. Drawers and base doors: the top edge. Upper doors
 * and lift-up doors: the bottom edge. Tall doors: the side that opens, over the whole height.
 */
export function gripEdge(cls: FrontClass, mode: FrontMode): GripEdge {
  if (cls === "DRAWER" || cls === "BASE") return "TOP";
  if (cls === "LIFT" || cls === "WALL") return "BOTTOM";
  return mode === "R" ? "LEFT" : "RIGHT";
}

export interface FrontPlan {
  kind: "door" | "drawer";
  /** stable while the structure of the piece stays the same (door / drawer ordinal) */
  key: string;
  mode: FrontMode;
  cls: FrontClass;
  edge: GripEdge;
  /** big enough to carry a handle */
  hardware: boolean;
  /** the front as drawn (a little shorter when a Gola channel runs along it) */
  piece: ScenePiece;
  /** Gola: the strip of the original front taken by the aluminium channel (scene mm) */
  channel: Rect | null;
  /** drawers: indexes of the hinged doors standing in front of this one */
  coveredBy: number[];
  /** drawers: sits behind the sliding doors */
  behindSliding: boolean;
  /** drawers: how far it comes out on „open all" (0–1), so a stack opens like stairs */
  stagger: number;
  /** drawers: the box behind the front and how far it travels (mm) */
  boxDepthMm: number;
  travelMm: number;
}

export interface ScenePlan {
  /** one entry per scene piece; null = not something that opens */
  fronts: (FrontPlan | null)[];
  wallHung: boolean;
  doors: number;
  drawers: number;
  sliding: number;
  /** changes when the set of doors / drawers changes (individual open states are then forgotten) */
  signature: string;
}

function withGola(piece: ScenePiece, edge: GripEdge): { piece: ScenePiece; channel: Rect } {
  const g = edge === "TOP" || edge === "BOTTOM" ? GOLA_GAP_MM : GOLA_SIDE_MM;
  switch (edge) {
    case "TOP":
      return { piece: { ...piece, h: piece.h - g }, channel: { x: piece.x, y: piece.y + piece.h - g, w: piece.w, h: g } };
    case "BOTTOM":
      return { piece: { ...piece, y: piece.y + g, h: piece.h - g }, channel: { x: piece.x, y: piece.y, w: piece.w, h: g } };
    case "RIGHT":
      return { piece: { ...piece, w: piece.w - g }, channel: { x: piece.x + piece.w - g, y: piece.y, w: g, h: piece.h } };
    case "LEFT":
      return { piece: { ...piece, x: piece.x + g, w: piece.w - g }, channel: { x: piece.x, y: piece.y, w: g, h: piece.h } };
  }
}

const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0);

/**
 * Gola as the CRM draws it: every front is shorter and a free strip is left above it (up to the
 * next front, or to the top of the carcass). Returns how much the front was shortened, or null.
 */
function golaGapAbove(scene: AtelierScene, piece: ScenePiece): number | null {
  const top = piece.y + piece.h;
  const above = (q: ScenePiece) => q.leg === piece.leg && overlap(q.x, q.x + q.w, piece.x, piece.x + piece.w) > 20;
  let ceiling = Infinity;
  // what was there before the CRM made room: 2 mm between two fronts, 1 mm under the carcass top
  let reveal = 2;
  for (const q of scene.pieces) {
    if (q === piece || q.role !== "FRONT" || !above(q) || Math.abs(q.z - piece.z) > 30) continue;
    if (q.y >= top - 1) ceiling = Math.min(ceiling, q.y);
  }
  if (ceiling === Infinity) {
    reveal = 1;
    for (const q of scene.pieces) {
      // the nearest panel top is the carcass this front closes (another module may stand on it)
      if (q.role !== "CORP" || !above(q) || q.y + q.h < top) continue;
      ceiling = Math.min(ceiling, q.y + q.h);
    }
  }
  const gap = ceiling - top;
  return gap >= CRM_GOLA_GAP_MM[0] && gap <= CRM_GOLA_GAP_MM[1] ? gap - reveal : null;
}

/** What opens in a scene, and how. Works on scenes of an older CRM (no `front`, no `handle`). */
export function planScene(scene: AtelierScene, handle: EffectiveHandle): ScenePlan {
  const wallHung = !scene.pieces.some((p) => p.role === "PLINTA");
  let doors = 0;
  let drawers = 0;
  // The CRM models Gola one way only (every front shorter at the top), and its scene arrives a
  // moment after the client picks the handle. So placement never reads that gap: fronts are first
  // put back to their full size, then the one set of rules below decides. The picture is the same
  // before and after the price response, whichever handle the scene on screen was computed for.
  const undoCrmGola = handle === "GOLA" || scene.handle === "GOLA";
  const fronts = scene.pieces.map((raw, index): FrontPlan | null => {
    if (raw.role !== "FRONT" || raw.front === "FIX") return null;
    // a door is hinged; a front without hinges is a drawer front unless the CRM says otherwise
    const mode: FrontMode | null = raw.hinge ?? (raw.front === "USA" ? null : "DRAWER");
    if (!mode) return null;
    const crmGap = undoCrmGola ? golaGapAbove(scene, raw) : null;
    const piece: ScenePiece = crmGap ? { ...raw, h: raw.h + crmGap } : raw;
    const kind = mode === "DRAWER" ? "drawer" : "door";
    const cls = classifyFront(mode, piece, wallHung);
    const edge = gripEdge(cls, mode);
    const coveredBy: number[] = [];
    if (kind === "drawer")
      scene.pieces.forEach((q, j) => {
        if (j === index || !q.hinge || q.role !== "FRONT" || q.leg !== piece.leg) return;
        if (q.z < piece.z + piece.d - 1) return;
        if (overlap(q.x, q.x + q.w, piece.x, piece.x + piece.w) > 20 && overlap(q.y, q.y + q.h, piece.y, piece.y + piece.h) > 20)
          coveredBy.push(j);
      });
    const behindSliding = kind === "drawer" && scene.doors.length > 0;
    const interior = coveredBy.length > 0 || behindSliding;
    const bigEnough = kind === "drawer" ? piece.w >= 150 && piece.h >= 60 : piece.w >= 120 && piece.h >= 120;
    // drawers inside a wardrobe have no edge profile (there is no gap for one between them)
    const hardware = bigEnough && !(interior && (handle === "GOLA" || handle === "PROFIL_J"));
    const gola = handle === "GOLA" && hardware ? withGola(piece, edge) : null;
    const boxDepthMm = Math.min(520, Math.max(120, piece.z - 30));
    return {
      kind,
      key: kind === "drawer" ? `drawer-${drawers++}` : `door-${doors++}`,
      mode,
      cls,
      edge,
      hardware,
      piece: gola ? gola.piece : piece,
      channel: gola ? gola.channel : null,
      coveredBy,
      behindSliding,
      stagger: 1,
      boxDepthMm,
      travelMm: boxDepthMm * 0.6,
    };
  });

  // Gola between two rows of doors is one profile, gripped from below and from above: an upper
  // door standing on a front that already has its channel along the top takes no strip of its own.
  if (handle === "GOLA")
    fronts.forEach((f, index) => {
      if (!f || !f.channel || f.edge !== "BOTTOM") return;
      const raw = scene.pieces[index];
      const shared = fronts.some(
        (g) =>
          g &&
          g !== f &&
          g.channel &&
          g.edge === "TOP" &&
          g.piece.leg === raw.leg &&
          Math.abs(g.piece.z - raw.z) < 30 &&
          Math.abs(g.channel.y + g.channel.h - raw.y) < 8 &&
          overlap(g.channel.x, g.channel.x + g.channel.w, raw.x, raw.x + raw.w) > 20,
      );
      if (!shared) return;
      f.piece = { ...f.piece, y: f.channel.y, h: f.piece.h + f.channel.h };
      f.channel = null;
    });

  // a stack of drawers opens like stairs on „open all": the lowest comes out the most
  const stacks = new Map<string, FrontPlan[]>();
  for (const f of fronts) {
    if (!f || f.kind !== "drawer") continue;
    const id = `${f.piece.leg ?? "A"}|${Math.round(f.piece.x)}|${Math.round(f.piece.w)}|${Math.round(f.piece.z)}`;
    stacks.set(id, [...(stacks.get(id) ?? []), f]);
  }
  for (const stack of stacks.values()) {
    stack.sort((a, b) => b.piece.y - a.piece.y);
    stack.forEach((f, rank) => {
      f.stagger = stack.length === 1 ? 1 : 0.4 + (0.6 * rank) / (stack.length - 1);
    });
  }

  return {
    fronts,
    wallHung,
    doors,
    drawers,
    sliding: scene.doors.length,
    signature: `${doors}|${drawers}|${scene.doors.length}`,
  };
}

/** Individual choices of the client: key → open? (missing = follows „open all"). */
export type OpenOverrides = Readonly<Record<string, boolean>>;
export const slidingKey = (index: number) => `sliding-${index}`;

export interface OpenState {
  /** per scene piece: 0 = closed … 1 = fully open */
  amount: number[];
  /** per sliding door: where its left edge stands (scene mm) */
  slideX: number[];
  /** per sliding door: moved away from its place */
  slid: boolean[];
  /** sliding doors are see-through outlines („open all"), so the whole interior shows */
  ghost: boolean;
  anyOpen: boolean;
  /** every door stands open (a piece with drawers only: every drawer) */
  allOpen: boolean;
}

/**
 * Where everything stands, from „open all" and the individual taps. A drawer never opens into a
 * closed door: it waits behind it.
 */
export function resolveOpen(
  scene: AtelierScene,
  plan: ScenePlan,
  overrides: OpenOverrides,
  allOpen: boolean,
  allDrawers: boolean,
): OpenState {
  const ghost = allOpen && scene.doors.length > 0;
  const slid: boolean[] = [];
  const slideX = scene.doors.map((door, i) => {
    const prev = scene.doors[i - 1];
    const next = scene.doors[i + 1];
    let x = door.x;
    // „open all" keeps the first behaviour: each front-track door slides over its left neighbour
    if (allOpen) x = door.track === 1 && prev ? prev.x : door.x;
    else if (overrides[slidingKey(i)]) x = (prev ?? next ?? door).x;
    slid.push(x !== door.x);
    return x;
  });
  const amount = plan.fronts.map((f): number => (f && f.kind === "door" && (overrides[f.key] ?? allOpen) ? 1 : 0));
  plan.fronts.forEach((f, i) => {
    if (!f || f.kind !== "drawer") return;
    const own = overrides[f.key];
    const wanted = own ?? (allOpen && allDrawers);
    if (!wanted) return;
    if (f.coveredBy.some((j) => amount[j] === 0)) return;
    if (
      f.behindSliding &&
      !ghost &&
      scene.doors.some((door, j) => overlap(slideX[j], slideX[j] + door.w, f.piece.x, f.piece.x + f.piece.w) > COVER_TOLERANCE_MM)
    )
      return;
    amount[i] = own ? 1 : f.stagger;
  });
  const openOf = (kind: "door" | "drawer") => plan.fronts.every((f, i) => !f || f.kind !== kind || amount[i] > 0);
  const hasDoors = plan.doors + scene.doors.length > 0;
  const allAreOpen = hasDoors ? openOf("door") && (scene.doors.length === 0 || ghost) : plan.drawers > 0 && openOf("drawer");
  return { amount, slideX, slid, ghost, anyOpen: ghost || slid.some(Boolean) || amount.some((a) => a > 0), allOpen: allAreOpen };
}

/** After a tap: the new individual states. Drawers the tap left behind a closed door give up being open. */
export function toggleOpen(
  scene: AtelierScene,
  plan: ScenePlan,
  overrides: OpenOverrides,
  allOpen: boolean,
  allDrawers: boolean,
  key: string,
): { overrides: OpenOverrides; open: boolean; changed: boolean } {
  const now = resolveOpen(scene, plan, overrides, allOpen, allDrawers);
  const pieceIndex = plan.fronts.findIndex((f) => f?.key === key);
  const slidingIndex = scene.doors.findIndex((_, i) => slidingKey(i) === key);
  const isOpen = pieceIndex >= 0 ? now.amount[pieceIndex] > 0 : slidingIndex >= 0 ? now.slid[slidingIndex] : false;
  const next: Record<string, boolean> = { ...overrides, [key]: !isOpen };
  const after = resolveOpen(scene, plan, next, allOpen, allDrawers);
  plan.fronts.forEach((f, i) => {
    if (f && f.kind === "drawer" && next[f.key] && after.amount[i] === 0) next[f.key] = false;
  });
  const open = pieceIndex >= 0 ? after.amount[pieceIndex] > 0 : !isOpen;
  return { overrides: next, open, changed: open !== isOpen };
}
