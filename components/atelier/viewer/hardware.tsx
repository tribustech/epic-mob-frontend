"use client";

import * as THREE from "three";
import type { HandleFinish } from "@/lib/atelier/types";
import type { EffectiveHandle, FrontClass, FrontMode, FrontPlan, GripEdge, Rect } from "./plan";

/** Scene units are millimetres; three.js works in metres. */
export const S = 0.001;

/** Decorations never answer the pointer themselves (the front they sit on does). */
export const noRaycast = () => null;

/** One geometry of each kind for all the small parts: they are scaled, never rebuilt. */
export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 28);
const UNIT_SPHERE = new THREE.SphereGeometry(1, 28, 18);

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
  /** the shadow inside a recessed grip or a milled edge */
  hollow: THREE.Material;
  /** the Gola channel: the same finish, anodised (dull), so it reads as one calm line */
  channel: THREE.Material;
  /** the milled edge of a handle-less front: the front's own colour, in shadow */
  groove: THREE.Material;
  /** the far wall of a recessed grip, catching a little light */
  lip: THREE.Material;
  /** a soft shade laid over the inside of a channel */
  shade: THREE.Material;
}

/* Proportions are a touch bolder than a catalogue handle: on a phone the whole wardrobe is 200 px tall. */
const HANDLE_LEN_MM = 192;
/** tall doors carry a longer bar */
const HANDLE_LEN_TALL_MM = 320;
const HANDLE_BAR_MM = 14;
const HANDLE_STANDOFF_MM = 32;
const RECESS_LONG_MM = 190;
const RECESS_SHORT_MM = 52;
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
  return anchor(plan.cls, plan.mode, w, h, y, handle === "BUTON" ? 42 : barLength(plan.mode, w, h));
}

/** A slim bar on two posts. */
function Bar({ vertical, lengthMm, material }: { vertical: boolean; lengthMm: number; material: THREE.Material }) {
  const len = lengthMm * S;
  const bar = HANDLE_BAR_MM * S;
  const off = HANDLE_STANDOFF_MM * S;
  const reach = len / 2 - bar * 1.6;
  return (
    <>
      <mesh geometry={UNIT_BOX} position={[0, 0, off]} scale={vertical ? [bar, len, bar] : [len, bar, bar]} material={material} castShadow />
      {[-1, 1].map((sign) => (
        <mesh
          key={sign}
          geometry={UNIT_BOX}
          position={vertical ? [0, sign * reach, off / 2] : [sign * reach, 0, off / 2]}
          scale={[bar * 0.8, bar * 0.8, off]}
          material={material}
        />
      ))}
    </>
  );
}

/** A small round knob on a short stem. */
function Knob({ material }: { material: THREE.Material }) {
  return (
    <>
      <mesh geometry={UNIT_CYLINDER} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1 * S]} scale={[14 * S, 2.5 * S, 14 * S]} material={material} />
      <mesh geometry={UNIT_CYLINDER} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 10 * S]} scale={[8 * S, 18 * S, 8 * S]} material={material} />
      <mesh geometry={UNIT_SPHERE} position={[0, 0, 25 * S]} scale={[21 * S, 21 * S, 13 * S]} material={material} castShadow />
    </>
  );
}

/** A grip let into the face: a slim metal rim around a dark hollow. */
function Recessed({ vertical, mats }: { vertical: boolean; mats: HardwareMaterials }) {
  const long = RECESS_LONG_MM * S;
  const short = RECESS_SHORT_MM * S;
  const rim = 6 * S;
  return (
    <>
      <mesh geometry={UNIT_BOX} position={[0, 0, 0.8 * S]} scale={vertical ? [short, long, 1.6 * S] : [long, short, 1.6 * S]} material={mats.metal} />
      <mesh
        geometry={UNIT_BOX}
        position={[0, 0, 1.4 * S]}
        scale={vertical ? [short - 2 * rim, long - 2 * rim, 2.8 * S] : [long - 2 * rim, short - 2 * rim, 2.8 * S]}
        material={mats.hollow}
      />
      {/* the far wall of the hollow catches a little light: it reads as depth */}
      <mesh
        geometry={UNIT_BOX}
        position={vertical ? [-(short / 2 - rim - 3.5 * S), 0, 3.2 * S] : [0, -(short / 2 - rim - 3.5 * S), 3.2 * S]}
        scale={vertical ? [7 * S, long - 2 * rim, 1 * S] : [long - 2 * rim, 7 * S, 1 * S]}
        material={mats.lip}
      />
    </>
  );
}

/** Handle-less front with a milled edge („profil J"): a shadow groove along the edge the hand pulls. */
function Groove({ edge, w, h, d, mats }: { edge: GripEdge; w: number; h: number; d: number; mats: HardwareMaterials }) {
  const g = 13;
  const out = 1.2;
  const horizontal = edge === "TOP" || edge === "BOTTOM";
  const sign = edge === "TOP" || edge === "RIGHT" ? 1 : -1;
  const depth = d * 0.62;
  const z = (d / 2 - depth / 2 + out) * S;
  return horizontal ? (
    <mesh geometry={UNIT_BOX} position={[0, sign * (h / 2 - g / 2 + out) * S, z]} scale={[(w + 2 * out) * S, g * S, depth * S]} material={mats.groove} />
  ) : (
    <mesh geometry={UNIT_BOX} position={[sign * (w / 2 - g / 2 + out) * S, 0, z]} scale={[g * S, (h + 2 * out) * S, depth * S]} material={mats.groove} />
  );
}

/**
 * The handle of one front, drawn in the front's own frame (origin = its centre, +z = towards the room).
 * PUSH / FARA / GOLA draw nothing here (the Gola channel belongs to the carcass: see GolaChannel).
 */
export function FrontHardware({
  kind,
  mode,
  edge,
  w,
  h,
  d,
  yMm,
  cls,
  mats,
}: {
  kind: EffectiveHandle;
  mode: FrontMode;
  edge: GripEdge;
  /** the front, mm */
  w: number;
  h: number;
  d: number;
  /** its bottom edge above the floor, mm */
  yMm: number;
  cls: FrontClass;
  mats: HardwareMaterials;
}) {
  const vertical = mode === "L" || mode === "R";
  const face = (d / 2) * S;
  if (kind === "APLICAT") {
    const len = barLength(mode, w, h);
    const [x, y] = anchor(cls, mode, w, h, yMm, len);
    return (
      <group position={[x * S, y * S, face]}>
        <Bar vertical={vertical} lengthMm={len} material={mats.metal} />
      </group>
    );
  }
  if (kind === "BUTON") {
    const [x, y] = anchor(cls, mode, w, h, yMm, 42);
    return (
      <group position={[x * S, y * S, face]}>
        <Knob material={mats.metal} />
      </group>
    );
  }
  if (kind === "INGROPAT") {
    if ((vertical ? h : w) < RECESS_LONG_MM + 40 || (vertical ? w : h) < RECESS_SHORT_MM + 16) return null;
    const [x, y] = anchor(cls, mode, w, h, yMm, RECESS_LONG_MM);
    return (
      <group position={[x * S, y * S, face]}>
        <Recessed vertical={vertical} mats={mats} />
      </group>
    );
  }
  if (kind === "PROFIL_J") return <Groove edge={edge} w={w} h={h} d={d} mats={mats} />;
  return null;
}

/**
 * Gola: the aluminium channel fixed to the carcass, in the gap the shortened front leaves.
 * It stays in place when the front opens. `zFront` is the front face of the fronts (scene mm).
 */
export function GolaChannel({
  rect,
  zFront,
  sceneW,
  sceneD,
  mats,
}: {
  rect: Rect;
  zFront: number;
  sceneW: number;
  sceneD: number;
  mats: HardwareMaterials;
}) {
  const horizontal = rect.w >= rect.h;
  const cx = (rect.x + rect.w / 2 - sceneW / 2) * S;
  const cy = (rect.y + rect.h / 2) * S;
  const recess = 6;
  const thick = 12;
  const z = (zFront - recess - thick / 2 - sceneD / 2) * S;
  // the half of the channel under its upper lip (or towards the hinge side) lies in shade
  const shadeAt: [number, number, number] = horizontal ? [0, (rect.h / 4) * S, (thick / 2 + 1.2) * S] : [0, 0, (thick / 2 + 1.2) * S];
  return (
    <group position={[cx, cy, z]}>
      <mesh geometry={UNIT_BOX} scale={[rect.w * S, rect.h * S, thick * S]} material={mats.channel} receiveShadow />
      <mesh
        geometry={UNIT_BOX}
        position={shadeAt}
        scale={horizontal ? [rect.w * S, (rect.h / 2) * S, 0.6 * S] : [(rect.w * 0.5) * S, rect.h * S, 0.6 * S]}
        material={mats.shade}
        raycast={noRaycast}
      />
    </group>
  );
}
