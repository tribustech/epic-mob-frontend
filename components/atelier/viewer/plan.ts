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

/** A base cabinet's doors end below this height: they are gripped at the top edge, like the drawers. */
const BASE_TOP_MM = 1300;
/** The strip a Gola channel takes from a front. */
const GOLA_GAP_MM = 24;
/** Sliding doors overlap their neighbours a little; a drawer counts as covered beyond this. */
const COVER_TOLERANCE_MM = 60;

export interface FrontPlan {
  kind: "door" | "drawer";
  /** stable while the structure of the piece stays the same (door / drawer ordinal) */
  key: string;
  mode: FrontMode;
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

function gripEdge(mode: FrontMode, piece: ScenePiece, wallHung: boolean): GripEdge {
  if (mode === "DRAWER") return "TOP";
  if (mode === "T" || wallHung) return "BOTTOM";
  if (piece.y + piece.h <= BASE_TOP_MM) return "TOP";
  return mode === "L" ? "RIGHT" : "LEFT";
}

function withGola(piece: ScenePiece, edge: GripEdge): { piece: ScenePiece; channel: Rect } {
  const g = GOLA_GAP_MM;
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
 * Gola as the CRM draws it: the front is already shorter and a free strip is left above it
 * (up to the next front, or to the top of the carcass). Returns that strip, or null.
 */
function golaGapAbove(scene: AtelierScene, piece: ScenePiece): Rect | null {
  const top = piece.y + piece.h;
  const above = (q: ScenePiece) => overlap(q.x, q.x + q.w, piece.x, piece.x + piece.w) > 20;
  let ceiling = Infinity;
  for (const q of scene.pieces) {
    if (q === piece || q.role !== "FRONT" || !above(q) || Math.abs(q.z - piece.z) > 30) continue;
    if (q.y >= top - 1) ceiling = Math.min(ceiling, q.y);
  }
  if (ceiling === Infinity)
    for (const q of scene.pieces) {
      if (q.role !== "CORP" || !above(q) || q.y + q.h < top) continue;
      ceiling = ceiling === Infinity ? q.y + q.h : Math.max(ceiling, q.y + q.h);
    }
  const gap = ceiling - top;
  return gap >= 15 && gap <= 80 ? { x: piece.x, y: top, w: piece.w, h: gap } : null;
}

/** What opens in a scene, and how. Works on scenes of an older CRM (no `front`, no `handle`). */
export function planScene(scene: AtelierScene, handle: EffectiveHandle): ScenePlan {
  const wallHung = !scene.pieces.some((p) => p.role === "PLINTA");
  let doors = 0;
  let drawers = 0;
  // a CRM that knows Gola has already made room for the channels; an older one has not
  const crmGaps =
    handle === "GOLA"
      ? scene.pieces.map((p) => (p.role === "FRONT" ? golaGapAbove(scene, p) : null))
      : [];
  const crmGola = crmGaps.some(Boolean);
  const fronts = scene.pieces.map((piece, index): FrontPlan | null => {
    if (piece.role !== "FRONT") return null;
    // a door is hinged; a front without hinges is a drawer front unless the CRM says otherwise
    const mode: FrontMode | null = piece.hinge ?? (piece.front === "USA" ? null : "DRAWER");
    if (!mode) return null;
    const kind = mode === "DRAWER" ? "drawer" : "door";
    const hardware = kind === "drawer" ? piece.w >= 150 && piece.h >= 60 : piece.w >= 120 && piece.h >= 120;
    const crmGap = crmGaps[index] ?? null;
    const edge = crmGap ? "TOP" : gripEdge(mode, piece, wallHung);
    const gola = handle !== "GOLA" || !hardware ? null : crmGola ? (crmGap ? { piece, channel: crmGap } : null) : withGola(piece, edge);
    const boxDepthMm = Math.min(520, Math.max(120, piece.z - 30));
    const coveredBy: number[] = [];
    if (kind === "drawer")
      scene.pieces.forEach((q, j) => {
        if (j === index || !q.hinge || q.role !== "FRONT") return;
        if (q.z < piece.z + piece.d - 1) return;
        if (overlap(q.x, q.x + q.w, piece.x, piece.x + piece.w) > 20 && overlap(q.y, q.y + q.h, piece.y, piece.y + piece.h) > 20)
          coveredBy.push(j);
      });
    return {
      kind,
      key: kind === "drawer" ? `drawer-${drawers++}` : `door-${doors++}`,
      mode,
      edge,
      hardware,
      piece: gola ? gola.piece : piece,
      channel: gola ? gola.channel : null,
      coveredBy,
      behindSliding: kind === "drawer" && scene.doors.length > 0,
      stagger: 1,
      boxDepthMm,
      travelMm: boxDepthMm * 0.6,
    };
  });

  // a stack of drawers opens like stairs on „open all": the lowest comes out the most
  const stacks = new Map<string, FrontPlan[]>();
  for (const f of fronts) {
    if (!f || f.kind !== "drawer") continue;
    const id = `${Math.round(f.piece.x)}|${Math.round(f.piece.w)}|${Math.round(f.piece.z)}`;
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
