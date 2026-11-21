import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { GripEdge } from "./plan";

/*
 * Geometry of the viewer, kept apart from React: boards with the decor laid out in real metres,
 * many boards merged into one mesh (one draw call per material instead of one per board), the
 * outlines of many boards as one line object, and fronts with a grip routed into an edge.
 */

export type Axis = "x" | "y" | "z";
const AXES: readonly Axis[] = ["x", "y", "z"];

/**
 * UVs in world metres, with the wood grain (the texture's V axis) running along `grain`: the height
 * of doors and sides, the length of shelves and plinths. `origin` (metres) shifts the pattern, so
 * neighbouring panels don't repeat the same knots. Works on any geometry with flat normals.
 */
export function applyGrainUV(geometry: THREE.BufferGeometry, size: Record<Axis, number>, origin: readonly [number, number, number], grain: Axis | "auto") {
  const longest = AXES.reduce((best, axis) => (size[axis] > size[best] ? axis : best), "y" as Axis);
  const wanted = grain === "auto" ? longest : grain;
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  const p: Record<Axis, number> = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    p.x = position.getX(i);
    p.y = position.getY(i);
    p.z = position.getZ(i);
    const across: Axis = nx >= ny && nx >= nz ? "x" : ny >= nz ? "y" : "z";
    const a: Axis = across === "x" ? "y" : "x";
    const b: Axis = across === "z" ? "y" : "z";
    const along = a === wanted || b === wanted ? wanted : size[a] >= size[b] ? a : b;
    const side = along === a ? b : a;
    uv.setXY(i, p[side] + origin[AXES.indexOf(side)], p[along] + origin[AXES.indexOf(along)]);
  }
  uv.needsUpdate = true;
}

/** A board (metres) with its decor at real scale. */
export function grainBox(w: number, h: number, d: number, origin: readonly [number, number, number], grain: Axis | "auto") {
  const geometry = new THREE.BoxGeometry(w, h, d);
  applyGrainUV(geometry, { x: w, y: h, z: d }, origin, grain);
  return geometry;
}

/** One board of a merged mesh: its box, where its middle stands, and (second wall of an L kitchen) how it is turned. */
export interface BoardSpec {
  size: readonly [number, number, number];
  at: readonly [number, number, number];
  origin: readonly [number, number, number];
  grain: Axis | "auto";
  matrix?: THREE.Matrix4 | null;
}

const _move = new THREE.Matrix4();

/** Many boards as one geometry (one draw call). null when there is none. */
export function mergeBoards(boards: readonly BoardSpec[]): THREE.BufferGeometry | null {
  if (boards.length === 0) return null;
  const parts = boards.map((b) => {
    const g = grainBox(b.size[0], b.size[1], b.size[2], b.origin, b.grain);
    _move.makeTranslation(b.at[0], b.at[1], b.at[2]);
    if (b.matrix) _move.premultiply(b.matrix);
    g.applyMatrix4(_move);
    return g;
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged;
}

/** Any ready-made parts (already in place) as one geometry; the parts are disposed. */
export function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (parts.length === 0) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged;
}

const BOX_EDGES: readonly (readonly [number, number, number, number, number, number])[] = (() => {
  const out: [number, number, number, number, number, number][] = [];
  const s = [-0.5, 0.5];
  for (const a of s) for (const b of s) {
    out.push([-0.5, a, b, 0.5, a, b]);
    out.push([a, -0.5, b, a, 0.5, b]);
    out.push([a, b, -0.5, a, b, 0.5]);
  }
  return out;
})();

/** The twelve edges of a 1×1×1 box, for outlines that are scaled to their board (shared by every front). */
export const UNIT_BOX_EDGES = new LineSegmentsGeometry().setPositions(BOX_EDGES.flat());

const _v = new THREE.Vector3();

/** The outlines of many boards as one line object. null when there is none. */
export function boardEdges(boards: readonly Pick<BoardSpec, "size" | "at" | "matrix">[]): LineSegmentsGeometry | null {
  if (boards.length === 0) return null;
  const positions = new Float32Array(boards.length * 72);
  let o = 0;
  for (const b of boards)
    for (const e of BOX_EDGES)
      for (let k = 0; k < 6; k += 3) {
        _v.set(e[k] * b.size[0] + b.at[0], e[k + 1] * b.size[1] + b.at[1], e[k + 2] * b.size[2] + b.at[2]);
        if (b.matrix) _v.applyMatrix4(b.matrix);
        positions[o++] = _v.x;
        positions[o++] = _v.y;
        positions[o++] = _v.z;
      }
  return new LineSegmentsGeometry().setPositions(positions);
}

/* ── A grip routed into the edge of a front ── */

/**
 * A scoop cut into one edge of a front, open towards that edge (all in metres, in the front's own
 * frame: origin = its middle, +z = the room). `centre` runs along the edge, measured from its middle.
 */
export interface Notch {
  edge: GripEdge;
  centre: number;
  length: number;
  /** how far it reaches into the front, from the edge */
  height: number;
  /** how deep it is routed, from the face */
  depth: number;
  radius: number;
}

const CORNER_STEPS = 6;

/** The outline of the scoop in the edge's own frame: u along the edge, v from the edge into the front. */
function notchLine(length: number, height: number, radius: number, centre: number): [number, number][] {
  const r = Math.max(0.0005, Math.min(radius, height - 0.0005, length / 2 - 0.0005));
  const u0 = centre - length / 2;
  const u1 = centre + length / 2;
  const pts: [number, number][] = [[u0, 0]];
  for (let i = 0; i <= CORNER_STEPS; i++) {
    const a = (i / CORNER_STEPS) * (Math.PI / 2);
    pts.push([u0 + r - r * Math.cos(a), height - r + r * Math.sin(a)]);
  }
  for (let i = 0; i <= CORNER_STEPS; i++) {
    const a = (i / CORNER_STEPS) * (Math.PI / 2);
    pts.push([u1 - r + r * Math.sin(a), height - r + r * Math.cos(a)]);
  }
  pts.push([u1, 0]);
  return pts;
}

/** (u, v) of the edge frame → (x, y) of the front. */
function toFront(edge: GripEdge, w: number, h: number): (u: number, v: number) => [number, number] {
  switch (edge) {
    case "TOP":
      return (u, v) => [u, h / 2 - v];
    case "BOTTOM":
      return (u, v) => [u, -h / 2 + v];
    case "RIGHT":
      return (u, v) => [w / 2 - v, u];
    case "LEFT":
      return (u, v) => [-w / 2 + v, u];
  }
}

/**
 * A front with a scoop routed into one edge: a full board at the back and, in front of it, a
 * layer as thick as the scoop is deep, cut to the outline. One geometry, the decor at real scale.
 */
export function notchedPanel(w: number, h: number, d: number, origin: readonly [number, number, number], notch: Notch): THREE.BufferGeometry {
  const horizontal = notch.edge === "TOP" || notch.edge === "BOTTOM";
  const A = horizontal ? w : h;
  const B = horizontal ? h : w;
  const map = toFront(notch.edge, w, h);
  const depth = Math.min(notch.depth, d * 0.75);
  const outline: [number, number][] = [[-A / 2, 0], ...notchLine(notch.length, notch.height, notch.radius, notch.centre), [A / 2, 0], [A / 2, B], [-A / 2, B]];
  const shape = new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(...map(u, v))));
  const frontLayer = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  frontLayer.translate(0, 0, d / 2 - depth);
  const back = new THREE.BoxGeometry(w, h, d - depth).toNonIndexed();
  back.translate(0, 0, -depth / 2);
  const layer = frontLayer.index ? frontLayer.toNonIndexed() : frontLayer;
  const merged = mergeGeometries([back, layer], false);
  back.dispose();
  frontLayer.dispose();
  if (layer !== frontLayer) layer.dispose();
  applyGrainUV(merged, { x: w, y: h, z: d }, origin, "y");
  return merged;
}

/**
 * What lines (or shades) the scoop: its floor, its wall all around and a slim lip lying on the face of
 * the front. Vertex colours carry the depth: full at the lip, darker down the wall and where the floor
 * meets it — so the scoop reads as a hollow from far away, whatever the light does.
 * `lip` = width of the lip on the face (0 = none); `floor`/`wall` = how dark the deepest part gets (0–1).
 */
export function notchLiner(
  w: number,
  h: number,
  d: number,
  notch: Notch,
  o: { lip: number; proud: number; floorDark: number; floorLight: number; wallDark: number; alpha?: boolean },
): THREE.BufferGeometry {
  const map = toFront(notch.edge, w, h);
  const depth = Math.min(notch.depth, d * 0.75);
  const skin = 0.0004;
  const zFloor = d / 2 - depth + skin;
  const zFace = d / 2 + o.proud;
  const inner = notchLine(notch.length - 2 * skin, notch.height - skin, notch.radius, notch.centre);
  const positions: number[] = [];
  const colors: number[] = [];
  const rgba = o.alpha === true;
  // towards +z the triangles must be counter-clockwise: TOP and LEFT mirror the edge frame
  const flip = notch.edge === "TOP" || notch.edge === "LEFT";
  const vert = (u: number, v: number, z: number, shade: number) => {
    const [x, y] = map(u, v);
    positions.push(x, y, z);
    // (alpha mode: a black veil, `shade` = how much of the board shows through)
    if (rgba) colors.push(0, 0, 0, 1 - shade);
    else colors.push(shade, shade, shade);
  };
  type P = [number, number, number, number];
  const tri = (a: P, b: P, c: P) => {
    vert(...a);
    if (flip) {
      vert(...c);
      vert(...b);
    } else {
      vert(...b);
      vert(...c);
    }
  };
  const quad = (a: P, b: P, c: P, e: P) => {
    tri(a, b, c);
    tri(a, c, e);
  };
  // how deep into the scoop a point of the floor is: 0 at the open edge, 1 at the wall
  const floorShade = (v: number) => o.floorLight + (o.floorDark - o.floorLight) * Math.pow(Math.min(1, Math.max(0, v / notch.height)), 1.6);
  // floor: a fan of strips from the open edge (v = 0) to the outline
  for (let i = 0; i < inner.length - 1; i++) {
    const [ua, va] = inner[i];
    const [ub, vb] = inner[i + 1];
    quad([ua, 0, zFloor, floorShade(0)], [ub, 0, zFloor, floorShade(0)], [ub, vb, zFloor, floorShade(vb)], [ua, va, zFloor, floorShade(va)]);
  }
  // wall: from the floor up to the face
  for (let i = 0; i < inner.length - 1; i++) {
    const [ua, va] = inner[i];
    const [ub, vb] = inner[i + 1];
    quad([ua, va, zFloor, o.wallDark], [ub, vb, zFloor, o.wallDark], [ub, vb, zFace, 1], [ua, va, zFace, 1]);
  }
  // lip: a slim band on the face, around the scoop
  if (o.lip > 0) {
    const outer = notchLine(notch.length + 2 * o.lip, notch.height + o.lip, notch.radius + o.lip, notch.centre);
    for (let i = 0; i < inner.length - 1; i++) {
      const [ua, va] = inner[i];
      const [ub, vb] = inner[i + 1];
      const [uc, vc] = outer[i + 1];
      const [ud, vd] = outer[i];
      quad([ua, va, zFace, 1], [ub, vb, zFace, 1], [uc, vc, zFace, 1], [ud, vd, zFace, 1]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, rgba ? 4 : 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** The outline of the scoop on the face of the front, as line segments (the crisp edge of the cut). */
export function notchOutline(w: number, h: number, d: number, notch: Notch): LineSegmentsGeometry {
  const map = toFront(notch.edge, w, h);
  const line = notchLine(notch.length, notch.height, notch.radius, notch.centre);
  const z = d / 2 + 0.0003;
  const positions: number[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    positions.push(...map(...line[i]), z, ...map(...line[i + 1]), z);
  }
  return new LineSegmentsGeometry().setPositions(positions);
}

/**
 * The outline of a front (metres, origin = its middle). With a scoop routed into it, the edge of
 * the face is left open across the mouth of the scoop (a line there would read as a lid).
 */
export function panelEdges(w: number, h: number, d: number, notch: Notch | null): LineSegmentsGeometry {
  const positions: number[] = [];
  const front = d / 2;
  const horizontal = notch ? notch.edge === "TOP" || notch.edge === "BOTTOM" : false;
  for (const e of BOX_EDGES) {
    const a: [number, number, number] = [e[0] * w, e[1] * h, e[2] * d];
    const b: [number, number, number] = [e[3] * w, e[4] * h, e[5] * d];
    const onFace = Math.abs(a[2] - front) < 1e-9 && Math.abs(b[2] - front) < 1e-9;
    const onEdge =
      notch &&
      onFace &&
      (notch.edge === "TOP"
        ? a[1] > 0 && b[1] > 0
        : notch.edge === "BOTTOM"
          ? a[1] < 0 && b[1] < 0
          : notch.edge === "RIGHT"
            ? a[0] > 0 && b[0] > 0
            : a[0] < 0 && b[0] < 0);
    if (!notch || !onEdge) {
      positions.push(...a, ...b);
      continue;
    }
    // split around the mouth of the scoop
    const k = horizontal ? 0 : 1;
    const lo = notch.centre - notch.length / 2;
    const hi = notch.centre + notch.length / 2;
    const p = (t: number): [number, number, number] => (horizontal ? [t, a[1], front] : [a[0], t, front]);
    const from = Math.min(a[k], b[k]);
    const to = Math.max(a[k], b[k]);
    if (lo > from) positions.push(...p(from), ...p(lo));
    if (hi < to) positions.push(...p(hi), ...p(to));
  }
  return new LineSegmentsGeometry().setPositions(positions);
}
