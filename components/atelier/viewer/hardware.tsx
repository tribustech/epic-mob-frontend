"use client";

import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { HandleFinish } from "@/lib/atelier/types";
import { mergeParts, notchLiner, notchOutline, type Notch } from "./geometry";
import type { EffectiveHandle, FrontClass, FrontMode, FrontPlan, GripEdge } from "./plan";

/** Scene units are millimetres; three.js works in metres. */
export const S = 0.001;

/** Decorations never answer the pointer themselves (the front they sit on does). */
export const noRaycast = () => null;

/** One geometry of each kind for all the small parts: they are scaled, never rebuilt. */
export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

/* ── Outlines: fat lines (1 CSS px on any screen), one material per look, shared by everything ── */

const lineMaterials = new Map<string, LineMaterial>();
export function lineMaterial(color: string, opacity: number, width = 1): LineMaterial {
  const key = `${color}|${opacity}|${width}`;
  let m = lineMaterials.get(key);
  if (!m) {
    m = new LineMaterial({ color, linewidth: width, transparent: opacity < 1, opacity });
    lineMaterials.set(key, m);
  }
  return m;
}

/** The outline of a board (or of many): never answers the pointer, never casts a shadow. The geometry stays the caller's. */
export const Outline = memo(function Outline({
  geometry,
  material,
  scale,
}: {
  geometry: LineSegmentsGeometry;
  material: LineMaterial;
  scale?: [number, number, number];
}) {
  const line = useMemo(() => {
    const l = new LineSegments2(geometry, material);
    l.raycast = noRaycast;
    return l;
  }, [geometry, material]);
  return <primitive object={line} scale={scale} />;
});

export const FINISH_LOOK: Record<HandleFinish, { color: string; metalness: number; roughness: number; env: number }> = {
  NEGRU: { color: "#2e2d2c", metalness: 0.85, roughness: 0.38, env: 0.9 },
  // brushed steel
  INOX: { color: "#d3d6d9", metalness: 1, roughness: 0.42, env: 1.2 },
  // warm brass
  AURIU: { color: "#d2a558", metalness: 1, roughness: 0.26, env: 1.3 },
};

export interface HardwareMaterials {
  /** the visible metal, in the chosen finish */
  metal: THREE.Material;
  /** the shell of a recessed grip: the chosen finish, satin, shaded by vertex colours */
  shell: THREE.Material;
  /** the Gola channel: the same finish, anodised (dull), so it reads as one calm line */
  channel: THREE.Material;
  /** a soft shade laid over the inside of a channel */
  shade: THREE.Material;
  /** the shade inside a milled edge: a black veil whose strength comes from vertex colours */
  veil: THREE.Material;
  /** the crisp line where a milled edge is cut into the face */
  cut: LineMaterial;
}

/* Proportions are a touch bolder than a catalogue handle: on a phone the whole wardrobe is 200 px tall. */
const HANDLE_LEN_MM = 192;
/** tall doors carry a longer bar */
const HANDLE_LEN_TALL_MM = 320;
const HANDLE_BAR_MM = 14;
const HANDLE_STANDOFF_MM = 32;
/* The recessed grip: a scoop routed into the edge of the front, lined with a metal shell. */
const RECESS_LONG_MM = 190;
const RECESS_SHORT_MM = 46;
const RECESS_DEEP_MM = 12;
/* The milled edge („profil J"): a long, shallow cut in the front's own colour, with a return at each end. */
const MILL_HIGH_MM = 24;
const MILL_DEEP_MM = 9;
const MILL_END_MM = 34;
/** where a hand finds the handle of a tall door (mm above the floor) */
const HANDLE_HEIGHT_MM = 1050;
/** distance from the opening edge of a door to the middle of its handle */
const HANDLE_INSET_MM = 46;
/** a mirror / glass face leaves this strip of board free for the handle */
export const HANDLE_STRIP_MM = 86;

/**
 * Where the middle of a handle of length `lenMm` sits on a front, relative to its centre (mm).
 * Drawer: centred. Lift-up door: centred, near the bottom edge. Side-hung doors: by the edge that
 * opens — a tall door at hand height, a base door near its top corner, an upper door near its bottom corner.
 */
function anchor(cls: FrontClass, mode: FrontMode, w: number, h: number, yMm: number, lenMm: number): [number, number] {
  if (cls === "DRAWER") return [0, 0];
  if (cls === "LIFT") return [0, -h / 2 + Math.min(60, h * 0.2)];
  const x = (mode === "R" ? -1 : 1) * (w / 2 - Math.min(HANDLE_INSET_MM, w * 0.2));
  const margin = Math.min(60, h * 0.15);
  const lo = yMm + lenMm / 2 + margin;
  const hi = yMm + h - lenMm / 2 - margin;
  // an upper door: its bottom corner. Any other: as near hand height as the door allows
  // (the top corner of a base door, about 1050 mm up a tall one)
  const y = cls === "WALL" ? lo : Math.min(hi, Math.max(lo, HANDLE_HEIGHT_MM));
  return [x, y - (yMm + h / 2)];
}

function barLength(mode: FrontMode, w: number, h: number): number {
  const vertical = mode === "L" || mode === "R";
  const along = vertical ? h : w;
  return Math.min(vertical && h > 1400 ? HANDLE_LEN_TALL_MM : HANDLE_LEN_MM, along * 0.6);
}

/**
 * The scoop a handle type routes into a front (metres, in the front's frame), or null: the recessed
 * grip is a short, deep one in the middle of a drawer's top edge / at hand height on the edge of a
 * door that opens; the milled edge is a long, shallow one along the whole grip edge.
 */
export function gripNotch(kind: EffectiveHandle, mode: FrontMode, edge: GripEdge, cls: FrontClass, w: number, h: number, d: number, yMm: number): Notch | null {
  if (kind === "INGROPAT") {
    const vertical = mode === "L" || mode === "R";
    const along = vertical ? h : w;
    const across = vertical ? w : h;
    if (along < 130 || across < 70) return null;
    const length = Math.min(RECESS_LONG_MM, along * 0.62);
    const height = Math.min(RECESS_SHORT_MM, across * 0.42);
    const at: GripEdge = vertical ? (mode === "R" ? "LEFT" : "RIGHT") : mode === "T" ? "BOTTOM" : "TOP";
    const centre = vertical ? anchor(cls, mode, w, h, yMm, length)[1] : 0;
    return { edge: at, centre: centre * S, length: length * S, height: height * S, depth: Math.min(RECESS_DEEP_MM, d * 0.68) * S, radius: Math.min(15, height * 0.4) * S };
  }
  if (kind === "PROFIL_J") {
    const horizontal = edge === "TOP" || edge === "BOTTOM";
    const along = horizontal ? w : h;
    const across = horizontal ? h : w;
    if (along < 110 || across < 50) return null;
    const end = Math.min(MILL_END_MM, along * 0.12);
    const height = Math.min(MILL_HIGH_MM, across * 0.3);
    return { edge, centre: 0, length: (along - 2 * end) * S, height: height * S, depth: Math.min(MILL_DEEP_MM, d * 0.5) * S, radius: Math.min(9, height * 0.4) * S };
  }
  return null;
}

/**
 * Where the hand goes on a front, relative to its centre (mm): the middle of its handle, or of
 * the edge it is pulled by. The camera looks here when the client is choosing handles.
 */
export function gripPoint(plan: FrontPlan, handle: EffectiveHandle): [number, number] {
  const { w, h, y } = plan.piece;
  if (handle === "PROFIL_J" || handle === "GOLA") {
    if (plan.edge === "TOP") return [0, h / 2];
    if (plan.edge === "BOTTOM") return [0, -h / 2];
    const [, ay] = anchor(plan.cls, plan.mode, w, h, y, HANDLE_LEN_MM);
    return [plan.edge === "RIGHT" ? w / 2 : -w / 2, ay];
  }
  if (handle === "INGROPAT") {
    const n = gripNotch(handle, plan.mode, plan.edge, plan.cls, w, h, plan.piece.d, y);
    if (n) {
      const c = n.centre / S;
      const half = n.height / S / 2;
      if (n.edge === "TOP") return [c, h / 2 - half];
      if (n.edge === "BOTTOM") return [c, -h / 2 + half];
      return [n.edge === "RIGHT" ? w / 2 - half : -w / 2 + half, c];
    }
  }
  return anchor(plan.cls, plan.mode, w, h, y, handle === "BUTON" ? 42 : barLength(plan.mode, w, h));
}

/* ── Applied handles: one geometry (one draw call) each ── */

const barCache = new Map<string, THREE.BufferGeometry>();
/** A slim bar on two posts, origin on the face of the front. */
function barGeometry(vertical: boolean, lengthMm: number): THREE.BufferGeometry {
  const key = `${vertical ? "v" : "h"}${Math.round(lengthMm)}`;
  let g = barCache.get(key);
  if (!g) {
    const len = lengthMm * S;
    const bar = HANDLE_BAR_MM * S;
    const off = HANDLE_STANDOFF_MM * S;
    const reach = len / 2 - bar * 1.6;
    const parts = [new THREE.BoxGeometry(vertical ? bar : len, vertical ? len : bar, bar).translate(0, 0, off)];
    for (const sign of [-1, 1])
      parts.push(new THREE.BoxGeometry(bar * 0.8, bar * 0.8, off).translate(vertical ? 0 : sign * reach, vertical ? sign * reach : 0, off / 2));
    g = mergeParts(parts) ?? new THREE.BufferGeometry();
    barCache.set(key, g);
  }
  return g;
}

let knob: THREE.BufferGeometry | null = null;
/** A small round knob on a short stem, on a rose. */
function knobGeometry(): THREE.BufferGeometry {
  if (!knob) {
    const turn = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    knob =
      mergeParts([
        new THREE.CylinderGeometry(14 * S, 14 * S, 2.5 * S, 24).applyMatrix4(turn).translate(0, 0, 1 * S),
        new THREE.CylinderGeometry(8 * S, 8 * S, 18 * S, 20).applyMatrix4(turn).translate(0, 0, 10 * S),
        new THREE.SphereGeometry(1, 24, 14).scale(21 * S, 21 * S, 13 * S).translate(0, 0, 25 * S),
      ]) ?? new THREE.BufferGeometry();
  }
  return knob;
}

/** The metal shell of a recessed grip (its own geometry: it follows the size of the front). */
function Shell({ w, h, d, notch, material }: { w: number; h: number; d: number; notch: Notch; material: THREE.Material }) {
  const geometry = useMemo(
    () => notchLiner(w * S, h * S, d * S, notch, { lip: 2.4 * S, proud: 0.7 * S, floorDark: 0.26, floorLight: 0.8, wallDark: 0.34 }),
    [w, h, d, notch],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} raycast={noRaycast} />;
}

/** The shade inside a milled edge and the line of its cut. */
function Mill({ w, h, d, notch, mats }: { w: number; h: number; d: number; notch: Notch; mats: HardwareMaterials }) {
  const veil = useMemo(
    () => notchLiner(w * S, h * S, d * S, notch, { lip: 0, proud: 0, floorDark: 0.56, floorLight: 0.8, wallDark: 0.5, alpha: true }),
    [w, h, d, notch],
  );
  const cut = useMemo(() => notchOutline(w * S, h * S, d * S, notch), [w, h, d, notch]);
  useEffect(() => () => veil.dispose(), [veil]);
  useEffect(() => () => cut.dispose(), [cut]);
  return (
    <>
      <mesh geometry={veil} material={mats.veil} raycast={noRaycast} renderOrder={1} />
      <Outline geometry={cut} material={mats.cut} />
    </>
  );
}

/**
 * The handle of one front, drawn in the front's own frame (origin = its centre, +z = towards the room).
 * `notch` is the scoop already routed into the front's board (see gripNotch): here it gets its metal
 * shell (recessed grip) or its shade (milled edge). PUSH / FARA / GOLA draw nothing here (the Gola
 * channel belongs to the carcass).
 */
export const FrontHardware = memo(function FrontHardware({
  kind,
  mode,
  w,
  h,
  d,
  yMm,
  cls,
  notch,
  mats,
}: {
  kind: EffectiveHandle;
  mode: FrontMode;
  /** the front, mm */
  w: number;
  h: number;
  d: number;
  /** its bottom edge above the floor, mm */
  yMm: number;
  cls: FrontClass;
  notch: Notch | null;
  mats: HardwareMaterials;
}) {
  const vertical = mode === "L" || mode === "R";
  const face = (d / 2) * S;
  if (kind === "APLICAT") {
    const len = barLength(mode, w, h);
    const [x, y] = anchor(cls, mode, w, h, yMm, len);
    return <mesh geometry={barGeometry(vertical, len)} position={[x * S, y * S, face]} material={mats.metal} castShadow raycast={noRaycast} />;
  }
  if (kind === "BUTON") {
    const [x, y] = anchor(cls, mode, w, h, yMm, 42);
    return <mesh geometry={knobGeometry()} position={[x * S, y * S, face]} material={mats.metal} castShadow raycast={noRaycast} />;
  }
  if (kind === "INGROPAT" && notch) return <Shell w={w} h={h} d={d} notch={notch} material={mats.shell} />;
  if (kind === "PROFIL_J" && notch) return <Mill w={w} h={h} d={d} notch={notch} mats={mats} />;
  return null;
});

/** Gola: how far behind the face of the fronts the aluminium channel sits, and how thick it is drawn (mm). */
export const GOLA_RECESS_MM = 11;
export const GOLA_THICK_MM = 12;
