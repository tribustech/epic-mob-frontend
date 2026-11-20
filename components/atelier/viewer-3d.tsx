"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import { DoorClosed, DoorOpen, ScanEye } from "lucide-react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { AtelierScene, ColumnContent, RailPosition, SceneDoor, ScenePiece } from "@/lib/atelier/types";
import { RAIL_COUNT } from "@/lib/atelier/categories";
import type { MaterialLook } from "./material-look";

/** Scene units are millimetres; three.js works in metres. */
const S = 0.001;
const DOOR_THICKNESS_MM = 18;
const PANEL_MM = 18;
const RAIL_RADIUS_MM = 12.5;
const RAIL_DROP_MM = 70;

/** The bits of drei's OrbitControls instance the camera rig touches. */
interface OrbitControlsLike {
  target: THREE.Vector3;
  minDistance: number;
  maxDistance: number;
  update: () => void;
  addEventListener: (type: "start" | "end", listener: () => void) => void;
  removeEventListener: (type: "start" | "end", listener: () => void) => void;
}

export interface Viewer3DProps {
  scene: AtelierScene | null;
  /** Interior of each column, in order (used to draw hanging rails). */
  columns: ColumnContent[];
  /** POLITE_BARA: where the rail sits, per column (undefined = SUS). */
  railPositions?: (RailPosition | undefined)[];
  carcass: MaterialLook;
  front: MaterialLook;
  /** A newer configuration is being priced; the last valid scene stays on screen. */
  updating: boolean;
  /** Controlled doors: when given, it drives open / closed (the toggle then only asks via onDoorsOpenChange). */
  doorsOpen?: boolean;
  /** Called when the client uses the „Uși închise / deschise" toggle (controlled or not). */
  onDoorsOpenChange?: (open: boolean) => void;
  /** x range (scene mm) of the column to point at: a soft accent strip right under its front edge. */
  highlight?: { x0: number; x1: number } | null;
  /** fronts carry an applied bar handle (push-to-open / Gola fronts stay plain) */
  handles?: boolean;
  /** the scene on screen is not the current configuration's (errors / price service down) */
  stale?: boolean;
}

/* ── Shared textures: one THREE.Texture per imageUrl for the whole page ── */

type TextureEntry = THREE.Texture | "loading" | "failed";
const textureCache = new Map<string, TextureEntry>();
const textureListeners = new Set<() => void>();
const subscribeTextures = (fn: () => void) => {
  textureListeners.add(fn);
  return () => {
    textureListeners.delete(fn);
  };
};

/** One repeat of a decor photo covers this much board across the grain (they show ~3 planks). */
const TILE_WIDTH_M = 0.62;

type Crop = readonly [number, number, number, number];
const textureKey = (url: string, crop?: Crop) => (crop ? `${url}#${crop.join(",")}` : url);

/** Only the clean region of a decor photo (no supplier label), as its own texture. */
function croppedTexture(source: THREE.Texture, crop: Crop): THREE.Texture {
  const image = source.image as HTMLImageElement | undefined;
  if (!image?.width || !image.height) return source;
  const canvas = document.createElement("canvas");
  const sx = Math.round(crop[0] * image.width);
  const sy = Math.round(crop[1] * image.height);
  canvas.width = Math.max(1, Math.round(crop[2] * image.width));
  canvas.height = Math.max(1, Math.round(crop[3] * image.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(image, sx, sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  source.dispose();
  return new THREE.CanvasTexture(canvas);
}

function requestTexture(url: string, grainHorizontal: boolean, crop?: Crop) {
  const cacheKey = textureKey(url, crop);
  if (textureCache.has(cacheKey)) return;
  textureCache.set(cacheKey, "loading");
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const settle = (entry: TextureEntry) => {
    textureCache.set(cacheKey, entry);
    textureListeners.forEach((fn) => fn());
  };
  loader.load(
    url,
    (loaded) => {
      const t = crop ? croppedTexture(loaded, crop) : loaded;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      // Geometry UVs are in metres (see grainBox): the photo tiles at its real scale instead of
      // being stretched over each panel. Along the grain the repeats are mirrored (no visible
      // joint); across it they simply repeat, which reads as one more plank edge, whereas
      // mirroring there draws symmetric "butterfly" figures.
      t.wrapS = grainHorizontal ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
      t.wrapT = grainHorizontal ? THREE.RepeatWrapping : THREE.MirroredRepeatWrapping;
      const image = t.image as { width?: number; height?: number } | undefined;
      // (a cropped texture reports the size of its clean region here)
      const aspect = image?.width && image?.height ? image.height / image.width : 1;
      t.repeat.set(1 / TILE_WIDTH_M, 1 / (TILE_WIDTH_M * aspect));
      if (grainHorizontal) t.rotation = Math.PI / 2; // photo taken with the grain lying down
      t.needsUpdate = true;
      settle(t);
    },
    undefined,
    () => settle("failed"), // 404 / decode error → flat colour
  );
}

function useOptionalTexture(look: MaterialLook): THREE.Texture | null {
  const url = look.imageUrl;
  const entry = useSyncExternalStore(
    subscribeTextures,
    () => (url ? textureCache.get(textureKey(url, look.crop)) : undefined),
    () => undefined,
  );
  useEffect(() => {
    if (url) requestTexture(url, look.grainHorizontal === true, look.crop);
  }, [url, look.grainHorizontal, look.crop]);
  return entry instanceof THREE.Texture ? entry : null;
}

type Axis = "x" | "y" | "z";
const AXES: readonly Axis[] = ["x", "y", "z"];

/**
 * A box whose UVs are world metres, with the wood grain (the texture's V axis) running along
 * `grain`: the height of doors and sides, the length of shelves and plinths. `origin` (metres)
 * shifts the pattern, so neighbouring panels don't repeat the same knots.
 */
function grainBox(w: number, h: number, d: number, origin: [number, number, number], grain: Axis | "auto") {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const size = { x: w, y: h, z: d };
  const longest = AXES.reduce((best, axis) => (size[axis] > size[best] ? axis : best), "y" as Axis);
  const wanted = grain === "auto" ? longest : grain;
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  const read = (attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, i: number) => ({
    x: attr.getX(i),
    y: attr.getY(i),
    z: attr.getZ(i),
  });
  for (let i = 0; i < position.count; i++) {
    const n = read(normal, i);
    const p = read(position, i);
    const across = AXES.find((axis) => Math.abs(n[axis]) > 0.5) ?? "z";
    const inPlane = AXES.filter((axis) => axis !== across);
    const along = inPlane.includes(wanted) ? wanted : size[inPlane[0]] >= size[inPlane[1]] ? inPlane[0] : inPlane[1];
    const side = inPlane.find((axis) => axis !== along) ?? inPlane[0];
    uv.setXY(i, p[side] + origin[AXES.indexOf(side)], p[along] + origin[AXES.indexOf(along)]);
  }
  uv.needsUpdate = true;
  return geometry;
}

function useGrainBox(w: number, h: number, d: number, ox: number, oy: number, oz: number, grain: Axis | "auto") {
  const geometry = useMemo(() => grainBox(w, h, d, [ox, oy, oz], grain), [w, h, d, ox, oy, oz, grain]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

function useDisposable<T extends THREE.Material>(material: T): T {
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

function useLookMaterial(look: MaterialLook, roughness: number) {
  const texture = useOptionalTexture(look);
  return useDisposable(
    useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: texture ? "#ffffff" : look.color,
          map: texture,
          roughness,
          metalness: 0,
        }),
      [texture, look.color, roughness],
    ),
  );
}

/* ── Environment: a procedural room, so mirrors and metal have something to reflect (no download) ── */

/** Share of the room's light that reaches matt boards; mirrors and glass get the room at full strength. */
const ENVIRONMENT_INTENSITY = 0.3;

/** The procedural room as a PMREM texture, once per renderer (shared by every hook that asks). */
const roomCache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();
function useRoomEnvironment(): THREE.Texture {
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    let texture = roomCache.get(gl);
    if (!texture) {
      const pmrem = new THREE.PMREMGenerator(gl);
      const room = new RoomEnvironment();
      texture = pmrem.fromScene(room, 0.04).texture;
      room.dispose();
      pmrem.dispose();
      roomCache.set(gl, texture);
    }
    return texture;
  }, [gl]);
}

function StudioEnvironment() {
  const env = useRoomEnvironment();
  // Attached to the root scene as scene.environment (its strength: <Canvas scene={…}>).
  return <primitive object={env} attach="environment" />;
}

/* ── Camera: frame the whole wardrobe (plinth to top) with margin; re-frame on notable size changes ── */

/** Default view: almost frontal, so a long wardrobe reads as a rectangle, not a trapezoid. */
const VIEW_AZIMUTH = THREE.MathUtils.degToRad(20);
const VIEW_ELEVATION = THREE.MathUtils.degToRad(9);
const VIEW_FOV = 28;
/** Share of the frame the model may fill (the rest is breathing room for the overlays). */
const VIEW_FILL_X = 0.88;
const VIEW_FILL_Y = 0.8;

/** Extra room (metres) the opened hinged doors need around the body. */
interface OpenPad {
  x: number;
  front: number;
  top: number;
}
const NO_PAD: OpenPad = { x: 0, front: 0, top: 0 };

/** Where the default camera stands for a W×H×D box centred on (0, H/2, 0), for this canvas aspect. */
function defaultView(W: number, H: number, D: number, aspect: number, pad: OpenPad = NO_PAD) {
  const target = new THREE.Vector3(0, H / 2, 0);
  const dir = new THREE.Vector3(
    Math.sin(VIEW_AZIMUTH) * Math.cos(VIEW_ELEVATION),
    Math.sin(VIEW_ELEVATION),
    Math.cos(VIEW_AZIMUTH) * Math.cos(VIEW_ELEVATION),
  );
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();
  const tanY = Math.tan(THREE.MathUtils.degToRad(VIEW_FOV) / 2) * VIEW_FILL_Y;
  const tanX = Math.tan(THREE.MathUtils.degToRad(VIEW_FOV) / 2) * Math.max(aspect, 0.2) * VIEW_FILL_X;
  // Exact fit: every corner of the box must fall inside the (reduced) frustum.
  let dist = 0;
  const corner = new THREE.Vector3();
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        // opened hinged doors reach out to the sides, forwards and (lift-up doors) above the body
        corner.set(sx * (W / 2 + pad.x), sy * (H / 2) + (sy > 0 ? pad.top : 0), sz > 0 ? D / 2 + pad.front : -D / 2);
        const towards = corner.dot(dir);
        dist = Math.max(dist, Math.abs(corner.dot(right)) / tanX + towards, Math.abs(corner.dot(up)) / tanY + towards);
      }
  return { target, position: target.clone().addScaledVector(dir, dist), dist };
}

/**
 * Frames the whole piece with margin, for any canvas shape (wide desktop pane, short phone
 * strip). Re-frames when the model or the canvas changes noticeably — never in the middle of
 * a drag — and glides back to the default view when `resetSignal` changes.
 */
function CameraRig({ W, H, D, pad, resetSignal }: { W: number; H: number; D: number; pad: OpenPad; resetSignal: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsLike | null;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const aspect = size.height > 0 ? size.width / size.height : 1;

  // Buckets: re-frame only when the model or the canvas changes noticeably,
  // not on every 10 mm tweak (which would fight the customer's own orbiting).
  const wB = Math.round(W / 0.2);
  const hB = Math.round(H / 0.15);
  const dB = Math.round(D / 0.1);
  const aB = Math.round(aspect * 12);

  const dragging = useRef(false);
  const pending = useRef(false);
  /** set while the camera glides back to the default view */
  const glide = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const latest = useRef({ W, H, D, aspect, pad });
  useEffect(() => {
    latest.current = { W, H, D, aspect, pad };
  });

  const frame = useRef<() => void>(() => {});
  /** keeps the viewing direction, changes only the distance (doors opened / closed) */
  const refit = useRef<() => void>(() => {});
  useEffect(() => {
    frame.current = () => {
      const v = latest.current;
      const view = defaultView(v.W, v.H, v.D, v.aspect, v.pad);
      glide.current = null;
      camera.fov = VIEW_FOV;
      camera.position.copy(view.position);
      camera.near = 0.05;
      camera.far = view.dist * 6 + 10;
      camera.lookAt(view.target);
      camera.updateProjectionMatrix();
      if (controls) {
        controls.target.copy(view.target);
        controls.minDistance = view.dist * 0.4;
        controls.maxDistance = view.dist * 1.8;
        controls.update();
      }
      invalidate();
    };
    refit.current = () => {
      const v = latest.current;
      const view = defaultView(v.W, v.H, v.D, v.aspect, v.pad);
      const target = controls ? controls.target.clone() : view.target;
      const dir = camera.position.clone().sub(target);
      if (dir.lengthSq() < 1e-6) return;
      dir.normalize();
      if (controls) {
        controls.minDistance = view.dist * 0.4;
        controls.maxDistance = view.dist * 1.8;
      }
      camera.far = view.dist * 6 + 10;
      camera.updateProjectionMatrix();
      if (!dragging.current) glide.current = { position: target.clone().addScaledVector(dir, view.dist), target };
      invalidate();
    };
  }, [camera, controls, invalidate]);

  // the client's hand on the model wins: no re-framing and no glide during a drag
  useEffect(() => {
    if (!controls) return;
    const start = () => {
      dragging.current = true;
      glide.current = null;
    };
    const end = () => {
      dragging.current = false;
      if (pending.current) {
        pending.current = false;
        frame.current();
      }
    };
    controls.addEventListener("start", start);
    controls.addEventListener("end", end);
    return () => {
      controls.removeEventListener("start", start);
      controls.removeEventListener("end", end);
    };
  }, [controls]);

  useEffect(() => {
    if (dragging.current) pending.current = true;
    else frame.current();
    // Deliberately keyed on the size buckets (see above), not on exact values.
  }, [wB, hB, dB, aB, controls, camera]);

  const firstReset = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === firstReset.current) return;
    const v = latest.current;
    const view = defaultView(v.W, v.H, v.D, v.aspect, v.pad);
    glide.current = { position: view.position, target: view.target };
    invalidate();
  }, [resetSignal, invalidate]);

  // Doors opening / closing change how much room the piece needs: step back (or return) along the
  // client's own viewing direction, so their rotation is kept.
  const padKey = `${pad.x.toFixed(2)}|${pad.front.toFixed(2)}|${pad.top.toFixed(2)}`;
  const firstPad = useRef(padKey);
  useEffect(() => {
    if (padKey === firstPad.current) return;
    firstPad.current = padKey;
    refit.current();
  }, [padKey]);

  useFrame((state, delta) => {
    const g = glide.current;
    if (!g) return;
    const k = Math.min(1, delta * 6);
    camera.position.lerp(g.position, k);
    if (controls) controls.target.lerp(g.target, k);
    if (camera.position.distanceTo(g.position) < 0.004) {
      camera.position.copy(g.position);
      if (controls) controls.target.copy(g.target);
      glide.current = null;
    }
    if (controls) controls.update();
    else camera.lookAt(g.target);
    state.invalidate();
  });
  return null;
}

/* ── Pieces, rails, doors ── */

const CORP_EDGE = { color: "#3b332b", opacity: 0.3 };
const FRONT_EDGE_ON_LIGHT = { color: "#2a2420", opacity: 0.5 };
/** dark fronts get light joints, or a black chest of drawers is one black block */
const FRONT_EDGE_ON_DARK = { color: "#b9b2a8", opacity: 0.55 };
const FrontEdge = createContext(FRONT_EDGE_ON_LIGHT);

function Piece({
  piece,
  scene,
  material,
  handleMaterial,
}: {
  piece: ScenePiece;
  scene: AtelierScene;
  material: THREE.Material;
  /** set on drawer fronts that carry an applied handle */
  handleMaterial?: THREE.Material | null;
}) {
  const { x, y, z, w, h, d } = piece;
  const geometry = useGrainBox(
    Math.max(w, 1) * S,
    Math.max(h, 1) * S,
    Math.max(d, 1) * S,
    x * S,
    y * S,
    z * S,
    piece.role === "FRONT" ? "y" : "auto",
  );
  const frontEdge = useContext(FrontEdge);
  const edge = piece.role === "FRONT" ? frontEdge : piece.role === "CORP" ? CORP_EDGE : null;
  return (
    <mesh
      position={[(x + w / 2 - scene.widthMm / 2) * S, (y + h / 2) * S, (z + d / 2 - scene.depthMm / 2) * S]}
      material={material}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      {edge && <Edges threshold={20} color={edge.color} transparent opacity={edge.opacity} />}
      {handleMaterial && w >= 150 && h >= 60 && (
        // a drawer front: the handle lies flat, centred
        <BarHandle at={[0, 0, (d / 2) * S]} vertical={false} lengthMm={Math.min(HANDLE_LEN_MM, w * 0.6)} material={handleMaterial} />
      )}
    </mesh>
  );
}

/* ── Applied handles: a slim dark bar on two posts ── */

const HANDLE_LEN_MM = 160;
const HANDLE_BAR_MM = 10;
const HANDLE_STANDOFF_MM = 26;
/** where a hand finds the handle of a tall door (mm above the floor) */
const HANDLE_HEIGHT_MM = 1050;

/**
 * A bar handle on a front, in the front's own frame: `at` is the bar's centre relative to the
 * parent (metres), on the front face; the bar stands off it towards +z.
 */
function BarHandle({ at, vertical, lengthMm, material }: { at: [number, number, number]; vertical: boolean; lengthMm: number; material: THREE.Material }) {
  const len = lengthMm * S;
  const bar = HANDLE_BAR_MM * S;
  const off = HANDLE_STANDOFF_MM * S;
  const post = (sign: number): [number, number, number] => (vertical ? [0, sign * (len / 2 - bar * 1.6), off / 2] : [sign * (len / 2 - bar * 1.6), 0, off / 2]);
  return (
    <group position={at}>
      <mesh position={[0, 0, off]} material={material} castShadow>
        <boxGeometry args={vertical ? [bar, len, bar] : [len, bar, bar]} />
      </mesh>
      {[-1, 1].map((sign) => (
        <mesh key={sign} position={post(sign)} material={material}>
          <boxGeometry args={[bar * 0.8, bar * 0.8, off]} />
        </mesh>
      ))}
    </group>
  );
}

/** Open angle of hinged doors (side hinges) and lift-up doors (top hinge), radians. */
const SWING_OPEN_RAD = (100 * Math.PI) / 180;
// lift-up (Aventos HK): the flap ends above the cabinet, roughly level, like an awning
const LIFT_OPEN_RAD = (95 * Math.PI) / 180;

/**
 * A hinged front (piece.hinge set by the CRM): a pivot group sits on the hinge edge and the
 * door mesh hangs off it, so rotating the group swings the door outwards (towards +z).
 */
function HingedFront({
  piece,
  scene,
  material,
  open,
  handleMaterial,
}: {
  piece: ScenePiece;
  scene: AtelierScene;
  material: THREE.Material;
  open: boolean;
  handleMaterial?: THREE.Material | null;
}) {
  const ref = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const { x, y, z, w, h, d, hinge } = piece;
  const cx = (v: number) => (v - scene.widthMm / 2) * S;
  const cz = (v: number) => (v - scene.depthMm / 2) * S;
  // pivot on the hinge edge, at the door's front face
  const pivot: [number, number, number] =
    hinge === "T" ? [cx(x + w / 2), (y + h) * S, cz(z + d)] : [cx(hinge === "R" ? x + w : x), (y + h / 2) * S, cz(z + d)];
  // the mesh relative to the pivot
  const offset: [number, number, number] =
    hinge === "T" ? [0, (-h / 2) * S, (-d / 2) * S] : [((hinge === "R" ? -w : w) / 2) * S, 0, (-d / 2) * S];
  const target = !open ? 0 : hinge === "T" ? -LIFT_OPEN_RAD : hinge === "R" ? SWING_OPEN_RAD : -SWING_OPEN_RAD;
  const geometry = useGrainBox(Math.max(w, 1) * S, Math.max(h, 1) * S, Math.max(d, 1) * S, x * S, y * S, z * S, "y");
  const handleLen = Math.min(HANDLE_LEN_MM, (hinge === "T" ? w : h) * 0.6);
  const FRONT_EDGE = useContext(FrontEdge);

  useEffect(() => {
    invalidate();
  }, [target, invalidate]);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const axis = hinge === "T" ? "x" : "y";
    // the other axis always rests at 0 (a front that changed hinge type must not keep an old swing)
    const other = axis === "x" ? "y" : "x";
    if (g.rotation[other] !== 0) g.rotation[other] = 0;
    const cur = g.rotation[axis];
    const diff = target - cur;
    if (Math.abs(diff) < 0.001) {
      if (diff !== 0) g.rotation[axis] = target;
      return;
    }
    g.rotation[axis] = cur + diff * Math.min(1, delta * 6);
    state.invalidate();
  });

  return (
    <group ref={ref} position={pivot}>
      <mesh position={offset} material={material} geometry={geometry} castShadow receiveShadow>
        <Edges threshold={20} color={FRONT_EDGE.color} transparent opacity={FRONT_EDGE.opacity} />
        {handleMaterial && w >= 120 && h >= 120 && (
          <BarHandle
            at={
              hinge === "T"
                ? // lift-up door: the handle lies along the bottom edge
                  [0, (-h / 2 + Math.min(60, h * 0.2)) * S, (d / 2) * S]
                : // side-hung door: upright, by the edge that opens, where the hand reaches
                  [
                    (hinge === "R" ? -1 : 1) * (w / 2 - Math.min(45, w * 0.2)) * S,
                    (Math.min(y + h - handleLen / 2 - 60, Math.max(y + handleLen / 2 + 60, HANDLE_HEIGHT_MM)) - (y + h / 2)) * S,
                    (d / 2) * S,
                  ]
            }
            vertical={hinge !== "T"}
            lengthMm={handleLen}
            material={handleMaterial}
          />
        )}
      </mesh>
    </group>
  );
}

interface Rail {
  x0: number;
  x1: number;
  y: number;
  z: number;
}

/**
 * Hanging rails aren't part of the scene contract, so they are derived here: the
 * lower body of column i is found from its plinth (x range) and its side panels;
 * BARA / POLITE_BARA / BARA_SERTARE get one rail just under the top panel,
 * BARA_DUBLA a second one at mid height. POLITE_BARA with the rail at the bottom
 * (railPosition JOS) hangs it under the lowest shelf (the divider; the CRM places it).
 */
export function railsFor(scene: AtelierScene, columns: ColumnContent[], railPositions: (RailPosition | undefined)[] = []): Rail[] {
  const plinths = scene.pieces.filter((p) => p.role === "PLINTA").sort((a, b) => a.x - b.x);
  const rails: Rail[] = [];
  plinths.forEach((plinth, i) => {
    const content = columns[i];
    // only dressing contents hang clothes; drawers / doors / open shelves get no rail
    const count = (content && RAIL_COUNT[content]) || 0;
    if (count === 0) return;
    const sides = scene.pieces.filter(
      (p) =>
        p.role === "CORP" &&
        p.w <= 30 &&
        p.h > 300 &&
        p.x >= plinth.x - 1 &&
        p.x + p.w <= plinth.x + plinth.w + 1,
    );
    if (sides.length < 2) return;
    const bottomY = Math.min(...sides.map((s) => s.y));
    const lower = sides.filter((s) => Math.abs(s.y - bottomY) < 2);
    if (lower.length < 2) return;
    const top = Math.max(...lower.map((s) => s.y + s.h));
    const x0 = Math.min(...lower.map((s) => s.x + s.w));
    const x1 = Math.max(...lower.map((s) => s.x));
    if (x1 - x0 < 100) return;
    const z = lower[0].z + lower[0].d / 2;
    if (content === "POLITE_BARA" && railPositions[i] === "JOS") {
      const shelves = scene.pieces.filter(
        (p) =>
          p.role === "CORP" &&
          p.h <= PANEL_MM + 2 &&
          p.w > 100 &&
          p.x >= x0 - 1 &&
          p.x + p.w <= x1 + 1 &&
          p.y > bottomY + PANEL_MM + 1 &&
          p.y < top - PANEL_MM - 1,
      );
      if (shelves.length > 0) {
        rails.push({ x0, x1, y: Math.min(...shelves.map((s) => s.y)) - RAIL_DROP_MM, z });
        return;
      }
    }
    const upperRail = top - PANEL_MM - RAIL_DROP_MM;
    rails.push({ x0, x1, y: upperRail, z });
    if (count === 2) {
      // the second rail hangs under the shelf that halves the column (the CRM places it);
      // without one, under the middle of the interior
      const interiorMid = (bottomY + PANEL_MM + top - PANEL_MM) / 2;
      const dividers = scene.pieces.filter(
        (p) =>
          p.role === "CORP" &&
          p.h <= PANEL_MM + 2 &&
          p.w > 100 &&
          p.x >= x0 - 1 &&
          p.x + p.w <= x1 + 1 &&
          p.y > bottomY + PANEL_MM + 300 &&
          p.y < upperRail - 300,
      );
      const divider = dividers.sort((a, b) => Math.abs(a.y - interiorMid) - Math.abs(b.y - interiorMid))[0];
      rails.push({ x0, x1, y: (divider ? divider.y : interiorMid) - RAIL_DROP_MM, z });
    }
  });
  return rails;
}

function RailMesh({ rail, scene, material }: { rail: Rail; scene: AtelierScene; material: THREE.Material }) {
  const len = rail.x1 - rail.x0;
  return (
    <mesh
      position={[((rail.x0 + rail.x1) / 2 - scene.widthMm / 2) * S, rail.y * S, (rail.z - scene.depthMm / 2) * S]}
      rotation={[0, 0, Math.PI / 2]}
      material={material}
      castShadow
    >
      <cylinderGeometry args={[RAIL_RADIUS_MM * S, RAIL_RADIUS_MM * S, len * S, 20]} />
    </mesh>
  );
}

function Door({
  door,
  targetXmm,
  zMm,
  scene,
  material,
  solid,
}: {
  door: SceneDoor;
  targetXmm: number;
  zMm: number;
  scene: AtelierScene;
  material: THREE.Material;
  /** false while the doors are see-through ghosts (open): they must not shade the interior */
  solid: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useGrainBox(door.w * S, door.h * S, DOOR_THICKNESS_MM * S, door.x * S, 0, 0, "y");
  const invalidate = useThree((s) => s.invalidate);
  const bottom = Math.max(0, scene.heightMm - door.h);
  const FRONT_EDGE = useContext(FrontEdge);
  const targetX = (targetXmm + door.w / 2 - scene.widthMm / 2) * S;

  // X is owned by the animation, never by a prop (a prop would snap it into place).
  const placed = useRef(false);
  useLayoutEffect(() => {
    if (!placed.current && ref.current) {
      ref.current.position.x = targetX;
      placed.current = true;
    }
  }, [targetX]);
  // frameloop="demand": kick the loop whenever the target moves.
  useEffect(() => {
    invalidate();
  }, [targetX, invalidate]);

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const dx = targetX - mesh.position.x;
    if (Math.abs(dx) < 0.0005) {
      if (dx !== 0) mesh.position.x = targetX;
      return;
    }
    mesh.position.x += dx * Math.min(1, delta * 7);
    state.invalidate();
  });

  return (
    <group position={[0, (bottom + door.h / 2) * S, (zMm + DOOR_THICKNESS_MM / 2 - scene.depthMm / 2) * S]}>
      <mesh ref={ref} material={material} geometry={geometry} renderOrder={2} castShadow={solid} receiveShadow={solid}>
        <Edges threshold={20} color={FRONT_EDGE.color} transparent opacity={solid ? FRONT_EDGE.opacity : 0.22} />
      </mesh>
    </group>
  );
}

const GHOST_OPACITY = 0.06;

function useDoorMaterials(front: MaterialLook, open: boolean) {
  const texture = useOptionalTexture(front);
  const env = useRoomEnvironment();
  // Open sliding doors are reduced to a faint outline, so the interior being edited reads clearly.
  const ghost = open ? { transparent: true, opacity: GHOST_OPACITY, depthWrite: false } : {};
  const panel = useDisposable(
    useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: texture ? "#ffffff" : front.color,
          map: texture,
          roughness: 0.5,
          ...ghost,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [texture, front.color, open],
    ),
  );
  const mirror = useDisposable(
    useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: "#f2f5f7",
          metalness: 1,
          roughness: 0.04,
          envMap: env,
          envMapIntensity: 1.5,
          ...ghost,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [open, env],
    ),
  );
  const glass = useDisposable(
    useMemo(() => {
      // Lacquered (back-painted) glass: the front colour, cooled down, under a glossy coat.
      const tint = new THREE.Color(front.color).lerp(new THREE.Color("#6f93a3"), 0.6);
      return new THREE.MeshPhysicalMaterial({
        color: tint,
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMap: env,
        envMapIntensity: 0.8,
        transparent: true,
        opacity: open ? GHOST_OPACITY : 0.92,
        depthWrite: !open,
      });
    }, [front.color, open, env]),
  );
  return { PANOU: panel, OGLINDA: mirror, STICLA: glass } as const;
}

function Wardrobe({
  scene,
  columns,
  railPositions,
  carcass,
  front,
  doorsOpen,
  handles,
}: Pick<Viewer3DProps, "columns" | "railPositions" | "carcass" | "front" | "handles"> & { scene: AtelierScene; doorsOpen: boolean }) {
  const carcassMat = useLookMaterial(carcass, 0.75);
  const backMat = useLookMaterial(carcass, 0.9);
  const frontMat = useLookMaterial(front, 0.55);
  const doorMats = useDoorMaterials(front, doorsOpen);
  // hinged mirror / glass doors swing open, so they stay solid (no "ghost" look)
  const hingedMats = useDoorMaterials(front, false);
  const env = useRoomEnvironment();
  const railMat = useDisposable(
    useMemo(
      () => new THREE.MeshStandardMaterial({ color: "#c9cdd2", metalness: 1, roughness: 0.28, envMap: env, envMapIntensity: 1 }),
      [env],
    ),
  );
  const handleMat = useDisposable(
    useMemo(
      () => new THREE.MeshStandardMaterial({ color: "#2e2d2c", metalness: 0.85, roughness: 0.38, envMap: env, envMapIntensity: 0.9 }),
      [env],
    ),
  );
  const rails = useMemo(() => railsFor(scene, columns, railPositions), [scene, columns, railPositions]);

  // Doors run on two tracks in the zone between the carcass front face and the full depth.
  const carcassFront =
    scene.pieces.reduce((max, p) => (p.role === "CORP" ? Math.max(max, p.z + p.d) : max), 0) ||
    scene.depthMm - 100;
  const zone = Math.max(2 * DOOR_THICKNESS_MM + 6, scene.depthMm - carcassFront);
  const gap = (zone - 2 * DOOR_THICKNESS_MM) / 3;
  const trackZ = [carcassFront + gap, carcassFront + 2 * gap + DOOR_THICKNESS_MM];

  const frontEdge = useMemo(() => {
    const hsl = { h: 0, s: 0, l: 0 };
    new THREE.Color(front.color).getHSL(hsl);
    return hsl.l < 0.3 ? FRONT_EDGE_ON_DARK : FRONT_EDGE_ON_LIGHT;
  }, [front.color]);

  return (
    <FrontEdge.Provider value={frontEdge}>
    <group>
      {scene.pieces.map((piece, i) =>
        piece.hinge ? (
          <HingedFront
            key={`${i}-${piece.hinge}`}
            piece={piece}
            scene={scene}
            material={piece.fill ? hingedMats[piece.fill] : frontMat}
            open={doorsOpen}
            handleMaterial={handles ? handleMat : null}
          />
        ) : (
          <Piece
            key={i}
            piece={piece}
            scene={scene}
            material={piece.role === "FRONT" ? frontMat : piece.role === "SPATE" ? backMat : carcassMat}
            handleMaterial={handles && piece.role === "FRONT" ? handleMat : null}
          />
        ),
      )}
      {rails.map((rail, i) => (
        <RailMesh key={i} rail={rail} scene={scene} material={railMat} />
      ))}
      {scene.doors.map((door, i) => {
        // Opening slides each front-track door over its left neighbour.
        const prev = scene.doors[i - 1];
        const targetXmm = doorsOpen && door.track === 1 && prev ? prev.x : door.x;
        return (
          <Door
            key={i}
            door={door}
            targetXmm={targetXmm}
            zMm={trackZ[door.track]}
            scene={scene}
            material={doorMats[door.fill]}
            solid={!doorsOpen}
          />
        );
      })}
    </group>
    </FrontEdge.Provider>
  );
}

/* ── Studio: soft key light with a shadow map, a pool of light and a contact shadow ── */

/** A soft-edged blob (white→transparent or dark→transparent), drawn once on a small canvas. */
function useBlobTexture(inner: string, outer: string, hardness: number) {
  const texture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, inner);
      g.addColorStop(hardness, inner);
      g.addColorStop(1, outer);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [inner, outer, hardness]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function KeyLight({ W, H, D }: { W: number; H: number; D: number }) {
  const ref = useRef<THREE.DirectionalLight>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const light = ref.current;
    if (!light) return;
    // the shadow camera hugs the model, so a 1024 map stays sharp enough at any size
    const r = Math.hypot(W, H, D) / 2 + 0.35;
    const dist = r * 3;
    light.target.position.set(0, H / 2, 0);
    light.position.set(0, H / 2, 0).addScaledVector(new THREE.Vector3(0.55, 0.95, 0.9).normalize(), dist);
    light.target.updateMatrixWorld();
    const cam = light.shadow.camera;
    cam.left = cam.bottom = -r;
    cam.right = cam.top = r;
    cam.near = dist - r * 1.5;
    cam.far = dist + r * 1.5;
    cam.updateProjectionMatrix();
    light.shadow.needsUpdate = true;
    invalidate();
  }, [W, H, D, invalidate]);
  return (
    <directionalLight
      ref={ref}
      intensity={1.85}
      color="#fff4e6"
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.0008}
      shadow-normalBias={0.004}
      shadow-radius={5}
    />
  );
}

/**
 * What the furniture stands on (or hangs from). Nothing here has a hard edge, so the canvas
 * can stay transparent over the CSS backdrop: a pool of light and a soft contact shadow.
 * (No plane catches the real cast shadow: it read as a hard grey block beside the model.)
 */
function Stage({ W, H, D, wallHung }: { W: number; H: number; D: number; wallHung: boolean }) {
  const glow = useBlobTexture("rgba(255,253,249,0.75)", "rgba(255,253,249,0)", 0.05);
  const shade = useBlobTexture("rgba(52,40,30,0.5)", "rgba(52,40,30,0)", 0.42);
  if (wallHung) {
    // on the wall: glow behind, the shadow drops slightly below the cabinet
    const z = -D / 2 - 0.002;
    return (
      <group>
        <mesh position={[0, H / 2, z - 0.004]} renderOrder={-3}>
          <planeGeometry args={[W * 1.5 + 2.4, H * 1.5 + 2.4]} />
          <meshBasicMaterial map={glow} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0.03, H / 2 - 0.05, z - 0.002]} renderOrder={-2}>
          <planeGeometry args={[W + 0.34, H + 0.3]} />
          <meshBasicMaterial map={shade} transparent depthWrite={false} toneMapped={false} opacity={0.75} />
        </mesh>
      </group>
    );
  }
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, -0.2, -0.004]} renderOrder={-3}>
        <planeGeometry args={[W * 1.6 + 3.2, D * 2 + 3.6]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.04, -0.002]} renderOrder={-2}>
        <planeGeometry args={[W + 0.5, D + 0.6]} />
        <meshBasicMaterial map={shade} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A soft accent strip right under the front edge of one column (on the floor, or under a wall cabinet). */
function ColumnHighlight({ scene, range, wallHung }: { scene: AtelierScene; range: { x0: number; x1: number }; wallHung: boolean }) {
  const width = Math.max(0.05, (range.x1 - range.x0) * S - 0.03);
  const x = ((range.x0 + range.x1) / 2 - scene.widthMm / 2) * S;
  const front = (scene.depthMm / 2) * S;
  const material = <meshBasicMaterial color="#d96f0a" transparent opacity={0.85} depthWrite={false} toneMapped={false} />;
  if (wallHung)
    return (
      <mesh position={[x, -0.035, front]} renderOrder={1}>
        <planeGeometry args={[width, 0.028]} />
        {material}
      </mesh>
    );
  const depth = 0.06;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.003, front + 0.02 + depth / 2]} renderOrder={1}>
      <planeGeometry args={[width, depth]} />
      {material}
    </mesh>
  );
}

/** Soft warm backdrop behind the transparent canvas: darker than white boards, lighter than dark ones. */
const BACKDROP = "radial-gradient(120% 85% at 50% 38%, #ebe6de 0%, #ddd6cb 58%, #cdc5b8 100%)";

export default function Viewer3D({
  scene,
  columns,
  railPositions,
  carcass,
  front,
  updating,
  doorsOpen: doorsOpenProp,
  onDoorsOpenChange,
  highlight,
  handles = false,
  stale = false,
}: Viewer3DProps) {
  const [doorsOpenLocal, setDoorsOpenLocal] = useState(false);
  const doorsOpen = doorsOpenProp ?? doorsOpenLocal;
  const setDoorsOpen = (open: boolean) => {
    setDoorsOpenLocal(open);
    onDoorsOpenChange?.(open);
  };
  const [resetSignal, setResetSignal] = useState(0);
  // the "drag to rotate" hint has done its job once the client has touched the model
  const [interacted, setInteracted] = useState(false);
  // sliding doors, or hinged fronts the CRM marked with their hinge side
  const hasDoors = (scene?.doors.length ?? 0) > 0 || (scene?.pieces.some((p) => p.hinge) ?? false);

  const W = (scene?.widthMm ?? 2400) * S;
  const H = (scene?.heightMm ?? 2600) * S;
  const D = (scene?.depthMm ?? 600) * S;
  // wall cabinets are the only furniture without legs / plinth: they hang on a wall, not on the floor
  const wallHung = scene ? !scene.pieces.some((p) => p.role === "PLINTA") : false;
  // opened hinged doors stick out: the camera must leave room for them
  const pad = useMemo<OpenPad>(() => {
    if (!scene || !doorsOpen) return NO_PAD;
    let x = 0;
    let front = 0;
    let top = 0;
    for (const p of scene.pieces) {
      if (!p.hinge) continue;
      if (p.hinge === "T") {
        front = Math.max(front, p.h * Math.sin(LIFT_OPEN_RAD));
        top = Math.max(top, p.y + p.h - p.h * Math.cos(LIFT_OPEN_RAD) - scene.heightMm + 20);
        continue;
      }
      const swing = p.w * Math.sin(SWING_OPEN_RAD);
      const past = -p.w * Math.cos(SWING_OPEN_RAD) + 20;
      front = Math.max(front, swing);
      // only the doors hinged at the outer edges reach beyond the body
      const edge = p.hinge === "L" ? p.x : scene.widthMm - (p.x + p.w);
      x = Math.max(x, past - edge);
    }
    return x <= 0 && front <= 0 && top <= 0 ? NO_PAD : { x: Math.max(0, x) * S, front: front * S, top: Math.max(0, top) * S };
  }, [scene, doorsOpen]);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[var(--image-radius)] bg-[#ddd6cb]"
      style={{ backgroundImage: BACKDROP }}
    >
      {scene ? (
        <Canvas
          // an out-of-date model (old shape in new colours) must not pass for the result
          style={{ opacity: stale && !updating ? 0.5 : 1, transition: "opacity 0.3s ease" }}
          frameloop="demand"
          dpr={[1, 2]}
          shadows="percentage"
          // The room alone lights everything evenly, which is what made the model look flat:
          // keep it low and let the key light model the shapes.
          scene={{ environmentIntensity: ENVIRONMENT_INTENSITY }}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.NeutralToneMapping }}
          camera={{ position: [1.6, 1.6, 7], fov: VIEW_FOV, near: 0.05, far: 100 }}
          fallback={
            <p className="p-6 text-sm text-[var(--home-ivory)]/70">
              Browserul tău nu poate afișa modelul 3D. Configurația și prețul funcționează în continuare.
            </p>
          }
        >
          <StudioEnvironment />
          <hemisphereLight args={["#ffffff", "#b3a89c", 0.9]} />
          <KeyLight W={W} H={H} D={D} />
          <directionalLight position={[-4, 2.5, 3]} intensity={0.5} color="#eef2ff" />
          <Stage W={W} H={H} D={D} wallHung={wallHung} />
          <Wardrobe
            scene={scene}
            columns={columns}
            railPositions={railPositions}
            carcass={carcass}
            front={front}
            doorsOpen={doorsOpen}
            handles={handles}
          />
          {highlight && <ColumnHighlight scene={scene} range={highlight} wallHung={wallHung} />}
          <OrbitControls
            makeDefault
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2 - 0.04}
            minAzimuthAngle={-Math.PI / 2.4}
            maxAzimuthAngle={Math.PI / 2.4}
            onStart={() => setInteracted(true)}
          />
          <CameraRig W={W} H={H} D={D} pad={pad} resetSignal={resetSignal} />
        </Canvas>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-[var(--home-ivory)]/60">
          Se pregătește modelul 3D…
        </div>
      )}

      {hasDoors && (
        <button
          type="button"
          aria-pressed={doorsOpen}
          aria-label={doorsOpen ? "Închide ușile" : "Deschide ușile"}
          title={doorsOpen ? "Închide ușile" : "Deschide ușile"}
          onClick={() => setDoorsOpen(!doorsOpen)}
          className={`atelier-doors absolute left-2 top-2 flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold shadow-sm backdrop-blur transition-colors sm:left-3 sm:top-3 sm:px-3.5 ${
            doorsOpen ? "bg-[var(--home-orange)] text-white" : "bg-white/90 text-[var(--home-ivory)]/85 hover:text-[var(--home-ivory)]"
          }`}
        >
          {doorsOpen ? <DoorOpen size={18} aria-hidden="true" /> : <DoorClosed size={18} aria-hidden="true" />}
          <span className="max-sm:hidden">{doorsOpen ? "Închide ușile" : "Deschide ușile"}</span>
        </button>
      )}

      {scene && (updating || stale) && (
        <span className="absolute right-2 top-2 rounded-full bg-white/85 px-3 py-1.5 text-xs text-[var(--home-ivory)]/80 shadow-sm backdrop-blur sm:right-3 sm:top-3">
          {updating ? "Se actualizează…" : "Imaginea nu e la zi"}
        </span>
      )}
      {scene && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 sm:bottom-3 sm:left-3">
          <button
            type="button"
            onClick={() => setResetSignal((n) => n + 1)}
            aria-label="Vedere din față"
            title="Vedere din față"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[var(--home-ivory)]/80 shadow-sm backdrop-blur transition-colors hover:text-[var(--home-ivory)]"
          >
            <ScanEye size={18} aria-hidden="true" />
          </button>
          <p
            className={`pointer-events-none text-[0.7rem] text-[var(--home-ivory)]/60 ${interacted ? "max-sm:hidden" : ""}`}
          >
            Trage pentru a roti<span className="max-sm:hidden"> · scroll / ciupește pentru zoom</span>
          </p>
        </div>
      )}
    </div>
  );
}
