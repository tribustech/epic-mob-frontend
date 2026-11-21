"use client";

import { createContext, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { DoorClosed, DoorOpen, Pointer, ScanEye } from "lucide-react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { ThreeEvent } from "@react-three/fiber";
import type { AtelierScene, ColumnContent, HandleFinish, HandleKind, RailPosition, SceneDoor, ScenePiece } from "@/lib/atelier/types";
import { RAIL_COUNT } from "@/lib/atelier/categories";
import type { MaterialLook } from "./material-look";
import { UNIT_BOX_EDGES, boardEdges, grainBox, mergeBoards, mergeParts, notchedPanel, panelEdges, type Axis, type BoardSpec, type Notch } from "./viewer/geometry";
import {
  FINISH_LOOK,
  FrontHardware,
  GOLA_RECESS_MM,
  GOLA_THICK_MM,
  HANDLE_STRIP_MM,
  Outline,
  S,
  UNIT_BOX,
  gripNotch,
  gripPoint,
  lineMaterial,
  noRaycast,
  type HardwareMaterials,
} from "./viewer/hardware";
import { refreshShadows, useTween } from "./viewer/motion";
import {
  planScene,
  resolveOpen,
  slidingKey,
  toggleOpen,
  type EffectiveHandle,
  type FrontPlan,
  type OpenOverrides,
  type OpenState,
  type ScenePlan,
} from "./viewer/plan";

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
  /** legacy: fronts carry an applied bar handle. Used only when neither `handle` nor `scene.handle` says. */
  handles?: boolean;
  /**
   * The handle drawn on doors and drawer fronts. undefined / null = what the scene says (`scene.handle`),
   * and for a scene without it (older CRM) the legacy `handles` flag. "FARA" / "PUSH" = flat fronts.
   */
  handle?: HandleKind | "FARA" | null;
  /** colour of the visible metal (bar, knob, recessed grip, Gola channel); NEGRU when not given */
  handleFinish?: HandleFinish;
  /**
   * Where the camera looks while the client is choosing something (it eases there and back):
   * "handles" = a close three-quarter view of one front, on the edge where its handle sits, so the
   * handle type and its colour read clearly (falls back to the normal view when no front carries one);
   * "doors" = the whole piece seen straight from the front. While a focus is set every door and
   * drawer starts closed, `doorsOpen` is ignored and the „open all" button is hidden (single taps
   * still work). null / undefined = the normal view.
   */
  focus?: "handles" | "doors" | null;
  /** the client opened / closed something in the model: one door, one drawer, one sliding door, or everything */
  onInteract?: (kind: "door" | "drawer" | "sliding" | "all", open: boolean) => void;
  /** the scene on screen is not the current configuration's (errors / price service down) */
  stale?: boolean;
  /** kitchens: the worktop decor */
  worktop?: MaterialLook | null;
}

/* ── Shared textures: one THREE.Texture per imageUrl for the whole page ── */

type TextureEntry = THREE.Texture | "loading" | "failed";
const textureCache = new Map<string, TextureEntry>();
const textureListeners = new Set<() => void>();
/** How many live materials use each texture; the ones nobody uses are dropped once the cache outgrows TEXTURE_KEEP. */
const textureUsers = new Map<string, number>();
const TEXTURE_KEEP = 8;
function retainTexture(key: string) {
  textureUsers.set(key, (textureUsers.get(key) ?? 0) + 1);
}
function releaseTexture(key: string) {
  const left = (textureUsers.get(key) ?? 1) - 1;
  if (left > 0) textureUsers.set(key, left);
  else textureUsers.delete(key);
  // oldest first (a Map keeps insertion order); a decor being tried again is simply fetched from the HTTP cache
  for (const [k, entry] of textureCache) {
    if (textureCache.size <= TEXTURE_KEEP) break;
    if (textureUsers.has(k) || !(entry instanceof THREE.Texture)) continue;
    entry.dispose();
    textureCache.delete(k);
  }
}
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
      t.anisotropy = 4;
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
    if (!url) return;
    const key = textureKey(url, look.crop);
    requestTexture(url, look.grainHorizontal === true, look.crop);
    retainTexture(key);
    return () => releaseTexture(key);
  }, [url, look.grainHorizontal, look.crop]);
  return entry instanceof THREE.Texture ? entry : null;
}

/** The board of a front or a door (metres), with the scoop of its handle routed in when it has one. */
function usePanel(w: number, h: number, d: number, ox: number, oy: number, oz: number, grain: Axis | "auto", notch: Notch | null = null) {
  const geometry = useMemo(
    () => (notch ? notchedPanel(w, h, d, [ox, oy, oz], notch) : grainBox(w, h, d, [ox, oy, oz], grain)),
    [w, h, d, ox, oy, oz, grain, notch],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** Disposes a geometry built in a useMemo when it is replaced or the component goes away. */
function useOwned<T extends { dispose: () => void } | null>(geometry: T): T {
  useEffect(() => () => geometry?.dispose(), [geometry]);
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

/**
 * What the mirrors show: a bright room painted on a canvas (light ceiling and walls, a soft
 * horizon, a light floor, streaks of daylight from the windows), so a mirror reads as a mirror
 * (silvery, with light moving in it as the model turns), not as a board. Built once per renderer; no download.
 */
const mirrorRoomCache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();
function buildMirrorRoom(gl: THREE.WebGLRenderer): THREE.Texture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // ceiling → wall → a soft horizon → a light floor: nothing dark anywhere
    const room = ctx.createLinearGradient(0, 0, 0, h);
    room.addColorStop(0, "#ffffff");
    room.addColorStop(0.3, "#f6f7f7");
    room.addColorStop(0.44, "#e6e9ea");
    room.addColorStop(0.535, "#d3d7d9");
    room.addColorStop(0.55, "#c3c5c4");
    room.addColorStop(0.575, "#d6d3cd");
    room.addColorStop(0.75, "#dedad3");
    room.addColorStop(1, "#e6e2dc");
    ctx.fillStyle = room;
    ctx.fillRect(0, 0, w, h);
    // windows: soft, slightly slanted streaks of daylight around the room
    const streak = (u: number, width: number, strength: number) => {
      ctx.save();
      ctx.translate(u * w, h * 0.42);
      ctx.transform(1, 0, -0.28, 1, 0, 0);
      const half = (width * w) / 2;
      const g = ctx.createLinearGradient(-half, 0, half, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.35, `rgba(255,255,255,${strength})`);
      g.addColorStop(0.65, `rgba(255,255,255,${strength})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-half, -h * 0.26, half * 2, h * 0.4);
      ctx.restore();
    };
    for (let i = 0; i < 6; i++) {
      streak(0.04 + i / 6, 0.05, 0.95);
      streak(0.04 + i / 6 + 0.062, 0.018, 0.7);
    }
  }
  const source = new THREE.CanvasTexture(canvas);
  source.colorSpace = THREE.SRGBColorSpace;
  source.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(gl);
  const texture = pmrem.fromEquirectangular(source).texture;
  pmrem.dispose();
  source.dispose();
  return texture;
}
/** Painted the first time a mirror or a pane of glass is shown (most pieces have none). */
function mirrorRoomOf(gl: THREE.WebGLRenderer): THREE.Texture {
  let texture = mirrorRoomCache.get(gl);
  if (!texture) {
    texture = buildMirrorRoom(gl);
    mirrorRoomCache.set(gl, texture);
  }
  return texture;
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
  /** where the free corners of the open doors and drawers stand (metres, scene space): the view must hold them too */
  points: readonly (readonly [number, number, number])[];
}
const NO_PAD: OpenPad = { x: 0, front: 0, top: 0, points: [] };

/** Where the default camera stands for a W×H×D box centred on (0, H/2, 0), for this canvas aspect. */
function defaultView(
  W: number,
  H: number,
  D: number,
  aspect: number,
  pad: OpenPad = NO_PAD,
  fillY = VIEW_FILL_Y,
  azimuth = VIEW_AZIMUTH,
  elevation = VIEW_ELEVATION,
) {
  const target = new THREE.Vector3(0, H / 2, 0);
  const dir = new THREE.Vector3(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation));
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();
  const tanY = Math.tan(THREE.MathUtils.degToRad(VIEW_FOV) / 2) * fillY;
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
  for (const p of pad.points) {
    corner.set(p[0], p[1] - H / 2, p[2]);
    const towards = corner.dot(dir);
    dist = Math.max(dist, Math.abs(corner.dot(right)) / tanX + towards, Math.abs(corner.dot(up)) / tanY + towards);
  }
  return { target, position: target.clone().addScaledVector(dir, dist), dist };
}

/** Overlays (hint, caption, round buttons) take these strips of the canvas, px: the model is fitted between them. */
interface Insets {
  top: number;
  bottom: number;
}
/** Where the camera goes while the client is choosing handles / door faces. */
type FocusSpec = { kind: "doors" } | { kind: "handles"; point: [number, number, number]; side: 1 | -1; span: number };

interface FitInput {
  W: number;
  H: number;
  D: number;
  aspect: number;
  pad: OpenPad;
  /** share of the canvas height that is free of overlays */
  free: number;
  focus: FocusSpec | null;
  /** the side the default view looks from (radians; an L kitchen is seen from its open side) */
  azimuth: number;
}

/** The view for the current state: the focus view if one is set, else the whole piece. */
function viewFor(v: FitInput) {
  const fillY = v.free < 1 ? v.free * 0.97 : VIEW_FILL_Y;
  if (v.focus?.kind === "doors") return defaultView(v.W, v.H, v.D, v.aspect, NO_PAD, fillY, 0, THREE.MathUtils.degToRad(3));
  if (v.focus?.kind === "handles") {
    const azimuth = v.focus.side * THREE.MathUtils.degToRad(33);
    const elevation = THREE.MathUtils.degToRad(11);
    const dir = new THREE.Vector3(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation));
    const tan = Math.tan(THREE.MathUtils.degToRad(VIEW_FOV) / 2);
    // `span` metres of the front fill the free height (and must fit the width of a narrow canvas)
    // a tall pane (desktop) would otherwise show only wood: step back so the handle stays in context
    const span = v.focus.span * (v.aspect < 1.4 ? 1.7 : 1);
    const dist = Math.max(span / 2 / (tan * fillY), (span * 0.8) / 2 / (tan * Math.max(v.aspect, 0.2)));
    const target = new THREE.Vector3(...v.focus.point);
    return { target, position: target.clone().addScaledVector(dir, dist), dist };
  }
  return defaultView(v.W, v.H, v.D, v.aspect, v.pad, fillY, v.azimuth);
}

/**
 * Frames the whole piece with margin, for any canvas shape (wide desktop pane, short phone
 * strip). Re-frames when the model or the canvas changes noticeably — never in the middle of
 * a drag — and glides back to the default view when `resetSignal` changes.
 */
function CameraRig({
  W,
  H,
  D,
  pad,
  resetSignal,
  insets,
  focus,
  azimuth,
}: {
  azimuth: number;
  W: number;
  H: number;
  D: number;
  pad: OpenPad;
  resetSignal: number;
  insets: Insets;
  focus: FocusSpec | null;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsLike | null;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const aspect = size.height > 0 ? size.width / size.height : 1;
  const free = size.height > 0 ? Math.max(0.4, 1 - (insets.top + insets.bottom) / size.height) : 1;

  // Buckets: re-frame only when the model or the canvas changes noticeably,
  // not on every 10 mm tweak (which would fight the customer's own orbiting).
  const wB = Math.round(W / 0.2);
  const hB = Math.round(H / 0.15);
  const dB = Math.round(D / 0.1);
  const aB = Math.round(aspect * 12);
  const fB = Math.round(free * 20);

  const dragging = useRef(false);
  const pending = useRef(false);
  /** set while the camera glides back to the default view */
  const glide = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const latest = useRef<FitInput>({ W, H, D, aspect, pad, free, focus, azimuth });
  useEffect(() => {
    latest.current = { W, H, D, aspect, pad, free, focus, azimuth };
  });

  // The picture is shifted so the model sits in the middle of the free area (between the overlays);
  // the orbit centre stays the middle of the model.
  useEffect(() => {
    if (insets.top || insets.bottom) camera.setViewOffset(size.width, size.height, 0, (insets.bottom - insets.top) / 2, size.width, size.height);
    else camera.clearViewOffset();
    invalidate();
  }, [camera, size.width, size.height, insets.top, insets.bottom, invalidate]);

  const frame = useRef<() => void>(() => {});
  /** keeps the viewing direction, changes only the distance (doors opened / closed) */
  const refit = useRef<() => void>(() => {});
  useEffect(() => {
    frame.current = () => {
      const view = viewFor(latest.current);
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
      if (v.focus) return;
      const view = viewFor(v);
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
  }, [wB, hB, dB, aB, fB, azimuth, controls, camera]);

  const firstReset = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === firstReset.current) return;
    const view = viewFor(latest.current);
    glide.current = { position: view.position, target: view.target };
    invalidate();
  }, [resetSignal, invalidate]);

  // A focus set or lifted by the shell: ease to that view (and back to the whole piece).
  const focusKey = focus ? (focus.kind === "doors" ? "doors" : `handles|${focus.point.map((n) => n.toFixed(2)).join(",")}|${focus.side}|${focus.span.toFixed(2)}`) : "";
  const firstFocus = useRef(focusKey);
  useEffect(() => {
    if (focusKey === firstFocus.current) return;
    firstFocus.current = focusKey;
    const v = { ...latest.current, focus };
    const whole = defaultView(v.W, v.H, v.D, v.aspect, v.pad, undefined, v.azimuth);
    const view = viewFor(v);
    if (controls) {
      // the close view is nearer than the usual limit allows
      controls.minDistance = Math.min(view.dist * 0.6, whole.dist * 0.4);
      controls.maxDistance = whole.dist * 1.8;
    }
    glide.current = { position: view.position, target: view.target };
    invalidate();
    // `focus` itself is covered by focusKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, controls, invalidate]);

  // Doors opening / closing change how much room the piece needs: step back (or return) along the
  // client's own viewing direction, so their rotation is kept.
  const padKey = pad.points.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)},${p[2].toFixed(2)}`).join("|");
  const firstPad = useRef(padKey);
  useEffect(() => {
    if (padKey === firstPad.current) return;
    firstPad.current = padKey;
    refit.current();
  }, [padKey]);

  useFrame((state, delta) => {
    const g = glide.current;
    if (!g) return;
    // (with frameloop="demand" the first delta after a pause is long: it must not snap the glide)
    const k = Math.min(1, Math.min(delta, 0.05) * 6);
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

/* ── Pieces ── */

const CORP_EDGE = { color: "#3b332b", opacity: 0.3 };
const FRONT_EDGE_ON_LIGHT = { color: "#2a2420", opacity: 0.5 };
/** dark fronts get light joints, or a black chest of drawers is one black block */
const FRONT_EDGE_ON_DARK = { color: "#b9b2a8", opacity: 0.55 };
const FrontEdge = createContext(FRONT_EDGE_ON_LIGHT);

const centred = (p: ScenePiece, scene: AtelierScene): [number, number, number] => [
  (p.x + p.w / 2 - scene.widthMm / 2) * S,
  (p.y + p.h / 2) * S,
  (p.z + p.d / 2 - scene.depthMm / 2) * S,
];

/**
 * Everything that never moves — carcass, backs, plinths, worktops, fronts that do not open — as one
 * mesh per material and one line object per kind of outline: a kitchen of 170 boards is 4 draw calls,
 * not 250. Rebuilt only when the boards themselves change.
 */
interface Statics {
  carcass: THREE.BufferGeometry | null;
  back: THREE.BufferGeometry | null;
  worktop: THREE.BufferGeometry | null;
  front: THREE.BufferGeometry | null;
  corpEdges: ReturnType<typeof boardEdges>;
  frontEdges: ReturnType<typeof boardEdges>;
}

function buildStatics(scene: AtelierScene, moving: string, legB: THREE.Matrix4 | null): Statics {
  const groups: Record<"carcass" | "back" | "worktop" | "front", BoardSpec[]> = { carcass: [], back: [], worktop: [], front: [] };
  const corpEdges: BoardSpec[] = [];
  const frontEdges: BoardSpec[] = [];
  scene.pieces.forEach((piece, i) => {
    if (piece.role === "APARAT" || moving[i] === "1") return;
    const board: BoardSpec = {
      size: [Math.max(piece.w, 1) * S, Math.max(piece.h, 1) * S, Math.max(piece.d, 1) * S],
      at: centred(piece, scene),
      origin: [piece.x * S, piece.y * S, piece.z * S],
      grain: piece.role === "FRONT" ? "y" : "auto",
      matrix: piece.leg === "B" ? legB : null,
    };
    groups[piece.role === "FRONT" ? "front" : piece.role === "SPATE" ? "back" : piece.role === "BLAT" ? "worktop" : "carcass"].push(board);
    if (piece.role === "FRONT") frontEdges.push(board);
    else if (piece.role === "CORP") corpEdges.push(board);
  });
  return {
    carcass: mergeBoards(groups.carcass),
    back: mergeBoards(groups.back),
    worktop: mergeBoards(groups.worktop),
    front: mergeBoards(groups.front),
    corpEdges: boardEdges(corpEdges),
    frontEdges: boardEdges(frontEdges),
  };
}

const StaticPieces = memo(function StaticPieces({
  scene,
  moving,
  legB,
  carcass,
  back,
  worktop,
  front,
}: {
  scene: AtelierScene;
  /** per scene piece: "1" = a front that opens (drawn on its own) */
  moving: string;
  legB: THREE.Matrix4 | null;
  carcass: THREE.Material;
  back: THREE.Material;
  worktop: THREE.Material;
  front: THREE.Material;
}) {
  const built = useMemo(() => buildStatics(scene, moving, legB), [scene, moving, legB]);
  useEffect(() => () => Object.values(built).forEach((g) => g?.dispose()), [built]);
  const frontEdge = useContext(FrontEdge);
  return (
    <>
      {built.carcass && <mesh geometry={built.carcass} material={carcass} castShadow receiveShadow />}
      {built.back && <mesh geometry={built.back} material={back} castShadow receiveShadow />}
      {built.worktop && <mesh geometry={built.worktop} material={worktop} castShadow receiveShadow />}
      {built.front && <mesh geometry={built.front} material={front} castShadow receiveShadow />}
      {built.corpEdges && <Outline geometry={built.corpEdges} material={lineMaterial(CORP_EDGE.color, CORP_EDGE.opacity)} />}
      {built.frontEdges && <Outline geometry={built.frontEdges} material={lineMaterial(frontEdge.color, frontEdge.opacity)} />}
    </>
  );
});

/* ── Kitchens: the second wall of an L, the worktop and the appliances (drawn only, never priced) ── */

/**
 * The group that turns the second wall of an L into place. Its pieces come in the second wall's own
 * coordinates (x along it as you face it, z from the wall into the room) and are drawn like the others
 * (centred on the scene); the group rotates them by ±90° and moves them onto the side wall.
 */
export function legBTransform(scene: AtelierScene): { position: [number, number, number]; rotation: [number, number, number] } | null {
  const k = scene.kitchen;
  if (!k || k.layout === "LINIAR" || !k.legBLengthMm) return null;
  const W = scene.widthMm;
  const D = scene.depthMm;
  const left = k.layout === "L_STANGA";
  const theta = left ? Math.PI / 2 : -Math.PI / 2;
  // three.js rotation about y: x' = x cos + z sin, z' = −x sin + z cos (cos = 0 here)
  const rx = (_a: number, b: number) => (left ? b : -b);
  const rz = (a: number) => (left ? -a : a);
  const tx = left ? 0 : W;
  const tz = left ? k.legBLengthMm : 0;
  return {
    position: [(rx(W / 2, D / 2) + tx - W / 2) * S, 0, (rz(W / 2) + tz - D / 2) * S],
    rotation: [0, theta, 0],
  };
}

export interface ApplianceMaterials {
  inox: THREE.Material;
  glass: THREE.Material;
  basin: THREE.Material;
  white: THREE.Material;
  ring: THREE.Material;
  ceramic: THREE.Material;
}
type ApplianceMaterial = keyof ApplianceMaterials;
const APPLIANCE_MATERIALS: readonly ApplianceMaterial[] = ["inox", "glass", "basin", "white", "ring", "ceramic"];

/**
 * Every sink, hob, oven, microwave, fridge, hood, basin and washer of the scene, each drawn in the
 * box the CRM gives for it — as one geometry per material (six draw calls for all of them).
 */
function buildAppliances(scene: AtelierScene, legB: THREE.Matrix4 | null): Record<ApplianceMaterial, THREE.BufferGeometry | null> {
  const parts: Record<ApplianceMaterial, THREE.BufferGeometry[]> = { inox: [], glass: [], basin: [], white: [], ring: [], ceramic: [] };
  for (const piece of scene.pieces) {
    if (piece.role !== "APARAT") continue;
    const matrix = piece.leg === "B" ? legB : null;
    const add = (material: ApplianceMaterial, g: THREE.BufferGeometry) => {
      if (matrix) g.applyMatrix4(matrix);
      parts[material].push(g);
    };
    const box = (size: [number, number, number], at: [number, number, number], material: ApplianceMaterial) =>
      add(material, new THREE.BoxGeometry(...size).translate(...at));
    const [cx, cy, cz] = centred(piece, scene);
    const w = piece.w * S;
    const h = piece.h * S;
    const d = piece.d * S;
    switch (piece.appliance) {
      case "CHIUVETA": {
        // a stainless rim on the worktop, the basin as a darker inset, a tap at the back
        const top = cy + h / 2;
        const tapX = cx;
        const tapZ = cz - d / 2 + 0.035;
        box([w, 0.004, d], [cx, top + 0.002, cz], "inox");
        box([w - 0.05, 0.003, d - 0.05], [cx, top + 0.0045, cz], "basin");
        box([0.028, 0.26, 0.028], [tapX, top + 0.13, tapZ], "inox");
        box([0.024, 0.024, 0.2], [tapX, top + 0.25, tapZ + 0.09], "inox");
        box([0.012, 0.05, 0.035], [tapX + 0.03, top + 0.22, tapZ], "inox");
        break;
      }
      case "PLITA": {
        const top = cy + h / 2;
        const rings: [number, number, number][] = [
          [-0.14, -0.1, 0.085],
          [0.14, -0.1, 0.07],
          [-0.14, 0.12, 0.07],
          [0.14, 0.12, 0.095],
        ];
        box([w, h, d], [cx, cy, cz], "glass");
        for (const [rx, rz, r] of rings)
          add("ring", new THREE.RingGeometry(r - 0.004, r, 40).rotateX(-Math.PI / 2).translate(cx + rx, top + 0.0008, cz + rz));
        break;
      }
      case "CUPTOR":
      case "MICROUNDE": {
        const front = cz + d / 2;
        const strip = piece.appliance === "CUPTOR" ? 0.07 : 0;
        box([w, h, d], [cx, cy, cz], "glass");
        if (strip > 0) box([w, strip, 0.004], [cx, cy + h / 2 - strip / 2, front + 0.002], "inox");
        box([w * 0.7, 0.016, 0.016], [cx, cy + h / 2 - strip - 0.035, front + 0.03], "inox");
        if (piece.appliance === "MICROUNDE") box([0.08, h * 0.8, 0.003], [cx + w / 2 - 0.06, cy, front + 0.002], "inox");
        break;
      }
      case "FRIGIDER":
        box([w, h, d], [cx, cy, cz], "white");
        break;
      case "LAVOAR": {
        // a countertop basin with a tap behind it
        const bottom = cy - h / 2;
        const tapZ = cz - d / 2 - 0.03;
        box([w, h * 0.85, d], [cx, bottom + (h * 0.85) / 2, cz], "ceramic");
        box([w - 0.04, 0.004, d - 0.04], [cx, bottom + h * 0.85 + 0.001, cz], "white");
        box([0.03, 0.28, 0.03], [cx, bottom + 0.14, tapZ], "inox");
        box([0.026, 0.026, 0.14], [cx, bottom + 0.27, tapZ + 0.06], "inox");
        break;
      }
      case "MASINA_SPALAT": {
        // a front-loading washer: white body, round dark door, a control strip
        const front = cz + d / 2;
        const r = Math.min(w, h) * 0.27;
        box([w, h, d], [cx, cy, cz], "white");
        box([w * 0.9, 0.09, 0.004], [cx, cy + h / 2 - 0.07, front + 0.002], "ring");
        add("glass", new THREE.CircleGeometry(r, 40).translate(cx, cy - h * 0.06, front + 0.004));
        add("inox", new THREE.RingGeometry(r, r + 0.025, 40).translate(cx, cy - h * 0.06, front + 0.005));
        break;
      }
      case "HOTA":
        box([w, h, d], [cx, cy, cz], "inox");
        break;
      default:
        break;
    }
  }
  return {
    inox: mergeParts(parts.inox),
    glass: mergeParts(parts.glass),
    basin: mergeParts(parts.basin),
    white: mergeParts(parts.white),
    ring: mergeParts(parts.ring),
    ceramic: mergeParts(parts.ceramic),
  };
}

const Appliances = memo(function Appliances({ scene, legB, mats }: { scene: AtelierScene; legB: THREE.Matrix4 | null; mats: ApplianceMaterials }) {
  const built = useMemo(() => buildAppliances(scene, legB), [scene, legB]);
  useEffect(() => () => Object.values(built).forEach((g) => g?.dispose()), [built]);
  return (
    <>
      {APPLIANCE_MATERIALS.map((key) => {
        const geometry = built[key];
        return geometry ? <mesh key={key} geometry={geometry} material={mats[key]} castShadow receiveShadow raycast={noRaycast} /> : null;
      })}
    </>
  );
});

/** Kitchens: the wall(s) behind the cabinets, so the room reads as a kitchen. */
function KitchenWalls({ scene }: { scene: AtelierScene }) {
  const W = scene.widthMm * S;
  const D = scene.depthMm * S;
  const H = (scene.heightMm + 250) * S;
  const k = scene.kitchen;
  const side = k && k.layout !== "LINIAR" ? (k.layout === "L_STANGA" ? -1 : 1) : 0;
  return (
    <group>
      <mesh position={[0, H / 2, -D / 2 - 0.001]} receiveShadow raycast={noRaycast}>
        <planeGeometry args={[W + (side ? 0 : 0.6), H]} />
        <meshStandardMaterial color="#ece7df" roughness={0.95} />
      </mesh>
      {side !== 0 && (
        <mesh position={[(side * W) / 2 + side * 0.001, H / 2, 0]} rotation={[0, -side * (Math.PI / 2), 0]} receiveShadow raycast={noRaycast}>
          <planeGeometry args={[D, H]} />
          {/* this wall faces away from the key light: lifted, or it goes dark grey */}
          <meshStandardMaterial color="#e6e0d7" roughness={0.95} emissive="#e6e0d7" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}

/* ── Fronts that open: hinged doors, lift-up doors, drawers ── */

/** Desktop: the front under the pointer lights up a little (it can be opened). */
const HOVER_MATERIAL = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.2, depthWrite: false, toneMapped: false });

function HoverGlow({ w, h, d }: { w: number; h: number; d: number }) {
  const scale: [number, number, number] = [(w + 3) * S, (h + 3) * S, (d + 9) * S];
  return (
    <>
      <mesh geometry={UNIT_BOX} scale={scale} material={HOVER_MATERIAL} raycast={noRaycast} renderOrder={4} />
      <Outline geometry={UNIT_BOX_EDGES} material={lineMaterial("#d96f0a", 0.9, 1.6)} scale={scale} />
    </>
  );
}

/** Thickness of a mirror / glass sheet glued on a door. */
const FACE_MM = 4;
/** The board of the door shows around the sheet, like a slim frame. */
const FACE_MARGIN_MM = 12;
/** A glass door is a pane in a frame this wide. */
const FRAME_MM = 44;

interface Margins {
  LEFT: number;
  RIGHT: number;
  TOP: number;
  BOTTOM: number;
}

/** What a door carries on its face. */
interface Face {
  material: THREE.Material;
  /** a pane you see through, held in a frame (clear, tinted and frosted glass); false = a sheet glued on the board */
  pane: boolean;
  /** strength of the light streak across it (0 = none) */
  glint: number;
}

/** A mirror is never drilled: the sheet leaves a strip of board free where the handle (or the milled edge) goes. */
function faceMargins(plan: FrontPlan, handle: EffectiveHandle, base: number): Margins {
  const m: Margins = { LEFT: base, RIGHT: base, TOP: base, BOTTOM: base };
  if (!plan.hardware) return m;
  if (handle === "APLICAT" || handle === "BUTON" || handle === "INGROPAT") {
    if (plan.mode === "T") m.BOTTOM = Math.max(base, Math.min(HANDLE_STRIP_MM, plan.piece.h * 0.35));
    else if (plan.mode === "L") m.RIGHT = Math.max(base, Math.min(HANDLE_STRIP_MM, plan.piece.w * 0.35));
    else if (plan.mode === "R") m.LEFT = Math.max(base, Math.min(HANDLE_STRIP_MM, plan.piece.w * 0.35));
  } else if (handle === "PROFIL_J") m[plan.edge] = Math.max(base, 30);
  return m;
}

/** A soft diagonal streak of light: what makes a flat sheet read as glass or mirror at a glance. */
let glintTexture: THREE.Texture | null = null;
function getGlintTexture(): THREE.Texture {
  if (glintTexture) return glintTexture;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, size, size, 0);
    const band = (at: number, half: number, alpha: number) => {
      g.addColorStop(Math.max(0, at - half), "rgba(255,255,255,0)");
      g.addColorStop(at, `rgba(255,255,255,${alpha})`);
      g.addColorStop(Math.min(1, at + half), "rgba(255,255,255,0)");
    };
    band(0.36, 0.13, 1);
    band(0.56, 0.04, 0.55);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  glintTexture = new THREE.CanvasTexture(canvas);
  glintTexture.colorSpace = THREE.SRGBColorSpace;
  return glintTexture;
}
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
const glintMaterials = new Map<number, THREE.Material>();
function glintMaterial(strength: number): THREE.Material {
  let m = glintMaterials.get(strength);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: getGlintTexture(), transparent: true, opacity: strength, depthWrite: false, toneMapped: false });
    glintMaterials.set(strength, m);
  }
  return m;
}

/** The mirror / glass on a door, in the door's own frame: a sheet on its face, or the pane inside its frame. */
function FaceSheet({ w, h, d, margins, face }: { w: number; h: number; d: number; margins: Margins; face: Face }) {
  const fw = w - margins.LEFT - margins.RIGHT;
  const fh = h - margins.TOP - margins.BOTTOM;
  if (fw < 20 || fh < 20) return null;
  const x = ((margins.LEFT - margins.RIGHT) / 2) * S;
  const y = ((margins.BOTTOM - margins.TOP) / 2) * S;
  // a pane sits in the middle of the frame's thickness; a sheet lies on the board
  const z = face.pane ? 0 : (d / 2 + FACE_MM / 2) * S;
  const front = z + (FACE_MM / 2 + 0.8) * S;
  return (
    <>
      <mesh geometry={UNIT_BOX} position={[x, y, z]} scale={[fw * S, fh * S, FACE_MM * S]} material={face.material} renderOrder={1} />
      {face.glint > 0 && (
        <mesh geometry={UNIT_PLANE} position={[x, y, front]} scale={[fw * S, fh * S, 1]} material={glintMaterial(face.glint)} renderOrder={2} raycast={noRaycast} />
      )}
    </>
  );
}

/** The frame of a glass door: four bars of the door's board around the pane (one mesh, one outline). */
const DoorFrame = memo(function DoorFrame({
  w,
  h,
  d,
  left,
  right,
  top,
  bottom,
  ox,
  oy,
  material,
}: {
  w: number;
  h: number;
  d: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** where the door stands (scene mm): shifts the decor like on any other board */
  ox: number;
  oy: number;
  material: THREE.Material;
}) {
  const frontEdge = useContext(FrontEdge);
  const built = useMemo(() => {
    const innerH = h - top - bottom;
    const bar = (cx: number, cy: number, bw: number, bh: number, grain: Axis): BoardSpec => ({
      size: [bw * S, bh * S, d * S],
      at: [cx * S, cy * S, 0],
      origin: [(ox + w / 2 + cx) * S, (oy + h / 2 + cy) * S, 0],
      grain,
    });
    const bars = [
      bar(0, h / 2 - top / 2, w, top, "x"),
      bar(0, -h / 2 + bottom / 2, w, bottom, "x"),
      bar(-w / 2 + left / 2, (bottom - top) / 2, left, innerH, "y"),
      bar(w / 2 - right / 2, (bottom - top) / 2, right, innerH, "y"),
    ];
    return { geometry: mergeBoards(bars), edges: boardEdges(bars) };
  }, [w, h, d, left, right, top, bottom, ox, oy]);
  useEffect(
    () => () => {
      built.geometry?.dispose();
      built.edges?.dispose();
    },
    [built],
  );
  if (!built.geometry || !built.edges) return null;
  return (
    <>
      <mesh geometry={built.geometry} material={material} castShadow receiveShadow />
      <Outline geometry={built.edges} material={lineMaterial(frontEdge.color, +(frontEdge.opacity * 0.7).toFixed(3))} />
    </>
  );
});

/** Open angle of hinged doors (side hinges) and lift-up doors (top hinge), radians. */
// a right angle: an open door never cuts into the drawer or the door next to it
const SWING_OPEN_RAD = (90 * Math.PI) / 180;
// lift-up (Aventos HK): the flap ends above the cabinet, roughly level, like an awning
const LIFT_OPEN_RAD = (95 * Math.PI) / 180;

interface FrontProps {
  plan: FrontPlan;
  scene: AtelierScene;
  material: THREE.Material;
  handle: EffectiveHandle;
  mats: HardwareMaterials;
  /** 0 = closed … 1 = fully open */
  amount: number;
  hovered: boolean;
}

/** A front's board with the scoop of its handle, and its outline. */
function useFrontBoard(plan: FrontPlan, handle: EffectiveHandle, plain: boolean) {
  const { x, y, z, w, h, d } = plan.piece;
  const { mode, edge, cls, hardware } = plan;
  // (a mirror or a pane on the door: nothing is routed into it)
  const notch = useMemo(
    () => (hardware && plain ? gripNotch(handle, mode, edge, cls, w, h, d, y) : null),
    [hardware, plain, handle, mode, edge, cls, w, h, d, y],
  );
  const geometry = usePanel(Math.max(w, 1) * S, Math.max(h, 1) * S, Math.max(d, 1) * S, x * S, y * S, z * S, "y", notch);
  const edges = useOwned(useMemo(() => (notch ? panelEdges(w * S, h * S, d * S, notch) : null), [w, h, d, notch]));
  return { notch, geometry, edges };
}

/**
 * A hinged front (piece.hinge set by the CRM): a pivot group sits on the hinge edge and the
 * door hangs off it, so rotating the group swings the door outwards (towards +z).
 */
const HingedFront = memo(function HingedFront({ plan, scene, material, face, handle, mats, amount, hovered }: FrontProps & { face: Face | null }) {
  const ref = useRef<THREE.Group>(null);
  const { x, y, z, w, h, d } = plan.piece;
  const hinge = plan.mode;
  const cx = (v: number) => (v - scene.widthMm / 2) * S;
  const cz = (v: number) => (v - scene.depthMm / 2) * S;
  // pivot on the hinge edge, at the door's front face
  const pivot: [number, number, number] =
    hinge === "T" ? [cx(x + w / 2), (y + h) * S, cz(z + d)] : [cx(hinge === "R" ? x + w : x), (y + h / 2) * S, cz(z + d)];
  // the door relative to the pivot
  const offset: [number, number, number] =
    hinge === "T" ? [0, (-h / 2) * S, (-d / 2) * S] : [((hinge === "R" ? -w : w) / 2) * S, 0, (-d / 2) * S];
  const openRad = hinge === "T" ? -LIFT_OPEN_RAD : hinge === "R" ? SWING_OPEN_RAD : -SWING_OPEN_RAD;
  const { notch, geometry, edges } = useFrontBoard(plan, handle, !face);
  const frontEdge = useContext(FrontEdge);
  const margins = faceMargins(plan, handle, face?.pane ? FRAME_MM : FACE_MARGIN_MM);

  useTween(amount, (v) => {
    const g = ref.current;
    if (!g) return;
    // the other axis always rests at 0 (a front that changed hinge type must not keep an old swing)
    if (hinge === "T") g.rotation.set(v * openRad, 0, 0);
    else g.rotation.set(0, v * openRad, 0);
  });

  return (
    <group ref={ref} position={pivot} userData={{ openKey: plan.key }}>
      <group position={offset}>
        {face?.pane ? (
          <DoorFrame w={w} h={h} d={d} left={margins.LEFT} right={margins.RIGHT} top={margins.TOP} bottom={margins.BOTTOM} ox={x} oy={y} material={material} />
        ) : (
          <>
            <mesh material={material} geometry={geometry} castShadow receiveShadow />
            <Outline geometry={edges ?? UNIT_BOX_EDGES} material={lineMaterial(frontEdge.color, frontEdge.opacity)} scale={edges ? undefined : [w * S, h * S, d * S]} />
          </>
        )}
        {face && <FaceSheet w={w} h={h} d={d} margins={margins} face={face} />}
        {plan.hardware && <FrontHardware kind={handle} mode={hinge} w={w} h={h} d={d} yMm={y} cls={plan.cls} notch={notch} mats={mats} />}
        {hovered && <HoverGlow w={w} h={h} d={d} />}
      </group>
    </group>
  );
});

const BOX_WALL_MM = 14;

/** The box behind a drawer front: two sides, a back and a bottom, in the carcass colour (one mesh). */
const DrawerBox = memo(function DrawerBox({ plan, material }: { plan: FrontPlan; material: THREE.Material }) {
  const { x, y, w, h, d } = plan.piece;
  const bd = plan.boxDepthMm;
  const geometry = useOwned(
    useMemo(() => {
      const t = BOX_WALL_MM;
      const bw = Math.max(w * 0.7, w - 52);
      const bh = Math.max(40, h - 70);
      const bottom = -h / 2 + Math.min(18, h * 0.1);
      const cy = bottom + bh / 2;
      const cz = -d / 2 - bd / 2;
      const part = (size: [number, number, number], at: [number, number, number], ox: number): BoardSpec => ({
        size: [size[0] * S, size[1] * S, size[2] * S],
        at: [at[0] * S, at[1] * S, at[2] * S],
        origin: [ox * S, y * S, 0],
        grain: "auto",
      });
      return mergeBoards([
        part([t, bh, bd], [-(bw / 2 - t / 2), cy, cz], x),
        part([t, bh, bd], [bw / 2 - t / 2, cy, cz], x + w),
        part([bw - 2 * t, bh, t], [0, cy, -d / 2 - bd + t / 2], x),
        part([bw - 2 * t, 10, bd - t], [0, bottom + 13, -d / 2 - (bd - t) / 2], x),
      ]);
    }, [x, y, w, h, d, bd]),
  );
  return geometry ? <mesh geometry={geometry} material={material} castShadow receiveShadow /> : null;
});

/** A drawer front: it slides straight out, with its box behind it. */
const DrawerFront = memo(function DrawerFront({ plan, scene, material, carcassMaterial, handle, mats, amount, hovered }: FrontProps & { carcassMaterial: THREE.Material }) {
  const ref = useRef<THREE.Group>(null);
  const { x, y, z, w, h, d } = plan.piece;
  const baseZ = (z + d / 2 - scene.depthMm / 2) * S;
  const travel = plan.travelMm * S;
  const { notch, geometry, edges } = useFrontBoard(plan, handle, true);
  const frontEdge = useContext(FrontEdge);
  // the box is built the first time the drawer opens (most drawers are never opened)
  const [boxed, setBoxed] = useState(false);
  if (amount > 0 && !boxed) setBoxed(true);

  useTween(amount, (v) => {
    if (ref.current) ref.current.position.z = baseZ + v * travel;
  });

  return (
    <group ref={ref} position={[(x + w / 2 - scene.widthMm / 2) * S, (y + h / 2) * S, baseZ]} userData={{ openKey: plan.key }}>
      <mesh material={material} geometry={geometry} castShadow receiveShadow />
      <Outline geometry={edges ?? UNIT_BOX_EDGES} material={lineMaterial(frontEdge.color, frontEdge.opacity)} scale={edges ? undefined : [w * S, h * S, d * S]} />
      {plan.hardware && <FrontHardware kind={handle} mode="DRAWER" w={w} h={h} d={d} yMm={y} cls={plan.cls} notch={notch} mats={mats} />}
      {boxed && <DrawerBox plan={plan} material={carcassMaterial} />}
      {hovered && <HoverGlow w={w} h={h} d={d} />}
    </group>
  );
});

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

const UNIT_RAIL = new THREE.CylinderGeometry(1, 1, 1, 20);

function RailMesh({ rail, scene, material }: { rail: Rail; scene: AtelierScene; material: THREE.Material }) {
  const len = rail.x1 - rail.x0;
  return (
    <mesh
      position={[((rail.x0 + rail.x1) / 2 - scene.widthMm / 2) * S, rail.y * S, (rail.z - scene.depthMm / 2) * S]}
      rotation={[0, 0, Math.PI / 2]}
      scale={[RAIL_RADIUS_MM * S, len * S, RAIL_RADIUS_MM * S]}
      geometry={UNIT_RAIL}
      material={material}
      castShadow
      raycast={noRaycast}
    />
  );
}
/* ── Sliding doors ── */

const SLIDING_FACE_MARGIN: Margins = { LEFT: 16, RIGHT: 16, TOP: 16, BOTTOM: 16 };
const SLIDING_FRAME: Margins = { LEFT: 38, RIGHT: 38, TOP: 38, BOTTOM: 52 };
const meshRaycast = THREE.Mesh.prototype.raycast;

const Door = memo(function Door({
  door,
  openKey,
  targetXmm,
  zMm,
  scene,
  material,
  face,
  solid,
  hovered,
}: {
  door: SceneDoor;
  openKey: string;
  targetXmm: number;
  zMm: number;
  scene: AtelierScene;
  material: THREE.Material;
  /** the mirror / glass sheet on the door, if any */
  face: Face | null;
  /** false while the doors are see-through ghosts („open all"): they must not shade the interior nor catch taps */
  solid: boolean;
  hovered: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const geometry = usePanel(door.w * S, door.h * S, DOOR_THICKNESS_MM * S, door.x * S, 0, 0, "y");
  const bottom = Math.max(0, scene.heightMm - door.h);
  const frontEdge = useContext(FrontEdge);
  const targetX = (targetXmm + door.w / 2 - scene.widthMm / 2) * S;

  // X is owned by the animation, never by a prop (a prop would snap it into place).
  useTween(targetX, (v) => {
    if (ref.current) ref.current.position.x = v;
  });

  return (
    <group position={[0, (bottom + door.h / 2) * S, (zMm + DOOR_THICKNESS_MM / 2 - scene.depthMm / 2) * S]}>
      <group ref={ref} userData={{ openKey }}>
        {solid && face?.pane ? (
          <DoorFrame
            w={door.w}
            h={door.h}
            d={DOOR_THICKNESS_MM}
            left={SLIDING_FRAME.LEFT}
            right={SLIDING_FRAME.RIGHT}
            top={SLIDING_FRAME.TOP}
            bottom={SLIDING_FRAME.BOTTOM}
            ox={door.x}
            oy={bottom}
            material={material}
          />
        ) : (
          <>
            <mesh material={material} geometry={geometry} renderOrder={2} castShadow={solid} receiveShadow={solid} raycast={solid ? meshRaycast : noRaycast} />
            <Outline
              geometry={UNIT_BOX_EDGES}
              material={lineMaterial(frontEdge.color, solid ? frontEdge.opacity : 0.22)}
              scale={[door.w * S, door.h * S, DOOR_THICKNESS_MM * S]}
            />
          </>
        )}
        {solid && face && <FaceSheet w={door.w} h={door.h} d={DOOR_THICKNESS_MM} margins={face.pane ? SLIDING_FRAME : SLIDING_FACE_MARGIN} face={face} />}
        {solid && hovered && <HoverGlow w={door.w} h={door.h} d={DOOR_THICKNESS_MM} />}
      </group>
    </group>
  );
});

/* ── Mirror and glass ── */

type FaceFill = "OGLINDA" | "STICLA";
const faceKey = (fill: FaceFill, look: { tint?: string; matte?: boolean; opaque?: boolean }) =>
  `${fill}|${look.tint ?? ""}|${look.matte ? 1 : 0}|${look.opaque ? 1 : 0}`;
const hexColor = (hex: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? new THREE.Color(hex) : null);

function makeFace(key: string, frontColor: string, env: THREE.Texture, mirrorRoom: THREE.Texture): Face {
  const [fill, tintHex, matteFlag, opaqueFlag] = key.split("|");
  const tint = hexColor(tintHex);
  const matte = matteFlag === "1";
  const white = new THREE.Color("#ffffff");
  if (fill === "OGLINDA") {
    // a mirror is polished metal seen through glass: it shows the (bright) room, in the colour of its tint
    const hsl = { h: 0, s: 0, l: 0 };
    const color = tint ? tint.clone() : new THREE.Color("#e9eef0");
    color.getHSL(hsl);
    // a pale tint must stay a bright mirror; a dark one keeps its depth but still shines
    if (hsl.l > 0.7) color.lerp(white, 0.5);
    return {
      material: new THREE.MeshStandardMaterial({
        color,
        metalness: 1,
        roughness: matte ? 0.4 : 0.03,
        envMap: mirrorRoom,
        envMapIntensity: matte ? 1.1 : hsl.l < 0.35 ? 1.9 : 1.25,
      }),
      pane: false,
      glint: matte ? 0 : hsl.l < 0.35 ? 0.12 : 0.24,
    };
  }
  if (matte) {
    // frosted glass: a milky pane, shapes behind it stay a blur of light and shade
    return {
      material: new THREE.MeshStandardMaterial({
        color: (tint ?? new THREE.Color("#e9eeee")).clone().lerp(white, 0.55),
        roughness: 0.85,
        metalness: 0,
        envMapIntensity: 0.6,
        transparent: true,
        opacity: 0.9,
      }),
      pane: true,
      glint: 0.06,
    };
  }
  if (!tint || opaqueFlag === "1") {
    // lacquered (back-painted) glass: a solid colour under a glossy coat, nothing shows through.
    // Older CRM, no glass type: the front colour, cooled down.
    const hsl = { h: 0, s: 0, l: 0 };
    (tint ?? white).getHSL(hsl);
    return {
      material: new THREE.MeshPhysicalMaterial({
        color: tint ?? new THREE.Color(frontColor).lerp(new THREE.Color("#6f93a3"), 0.6),
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMap: tint ? mirrorRoom : env,
        envMapIntensity: tint ? (hsl.l < 0.35 ? 1.3 : 0.6) : 0.8,
        transparent: !tint,
        opacity: tint ? 1 : 0.92,
      }),
      pane: false,
      glint: 0.1,
    };
  }
  // clear / tinted glass: a real pane, the shelves show behind it (the darker the tint, the less)
  const hsl = { h: 0, s: 0, l: 0 };
  tint.getHSL(hsl);
  return {
    material: new THREE.MeshStandardMaterial({
      color: tint,
      roughness: 0.04,
      metalness: 0,
      envMap: mirrorRoom,
      envMapIntensity: 1.4,
      transparent: true,
      opacity: 0.14 + 0.62 * (1 - hsl.l),
      depthWrite: false,
    }),
    pane: true,
    glint: 0.3,
  };
}

/** One material per kind of mirror / glass in the scene (shared by all the doors that carry it). */
function useFaceMaterials(scene: AtelierScene, frontColor: string) {
  const env = useRoomEnvironment();
  const gl = useThree((state) => state.gl);
  const signature = useMemo(() => {
    const keys = new Set<string>();
    for (const p of scene.pieces) if (p.fill === "OGLINDA" || p.fill === "STICLA") keys.add(faceKey(p.fill, p));
    for (const d of scene.doors) if (d.fill === "OGLINDA" || d.fill === "STICLA") keys.add(faceKey(d.fill, d));
    return [...keys].sort().join(";");
  }, [scene]);
  const materials = useMemo(() => {
    const map = new Map<string, Face>();
    for (const key of signature.split(";")) if (key) map.set(key, makeFace(key, frontColor, env, mirrorRoomOf(gl)));
    return map;
  }, [signature, frontColor, env, gl]);
  useEffect(() => () => materials.forEach((f) => f.material.dispose()), [materials]);
  return materials;
}

const GHOST_OPACITY = 0.06;
/** Thin parts lying on a face win the depth test from far away too (no flicker). */
const OVERLAY = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 } as const;

/* ── The whole piece ── */

const Wardrobe = memo(function Wardrobe({
  scene,
  plan,
  open,
  columns,
  railPositions,
  carcass,
  front,
  handle,
  handleFinish,
  onToggle,
  worktop,
}: Pick<Viewer3DProps, "columns" | "railPositions" | "carcass" | "front" | "worktop"> & {
  scene: AtelierScene;
  plan: ScenePlan;
  open: OpenState;
  handle: EffectiveHandle;
  handleFinish: HandleFinish;
  onToggle: (key: string) => void;
}) {
  const carcassMat = useLookMaterial(carcass, 0.75);
  const backMat = useLookMaterial(carcass, 0.9);
  const frontMat = useLookMaterial(front, 0.55);
  const worktopMat = useLookMaterial(worktop ?? carcass, 0.45);
  const env0 = useRoomEnvironment();
  const applianceMats = useMemo<ApplianceMaterials>(
    () => ({
      inox: new THREE.MeshStandardMaterial({ color: "#c9ccd0", metalness: 1, roughness: 0.3, envMap: env0, envMapIntensity: 1 }),
      glass: new THREE.MeshStandardMaterial({ color: "#131313", metalness: 0.3, roughness: 0.12, envMap: env0, envMapIntensity: 0.8 }),
      basin: new THREE.MeshStandardMaterial({ color: "#8c9096", metalness: 1, roughness: 0.45, envMap: env0, envMapIntensity: 0.6 }),
      white: new THREE.MeshStandardMaterial({ color: "#eef0f2", roughness: 0.5 }),
      ring: new THREE.MeshBasicMaterial({ color: "#5d5d5d", toneMapped: false }),
      ceramic: new THREE.MeshStandardMaterial({ color: "#f6f5f2", roughness: 0.18, envMap: env0, envMapIntensity: 0.5 }),
    }),
    [env0],
  );
  useEffect(() => () => Object.values(applianceMats).forEach((m) => m.dispose()), [applianceMats]);
  const legB = useMemo(() => legBTransform(scene), [scene]);
  const legBMatrix = useMemo(
    () => (legB ? new THREE.Matrix4().compose(new THREE.Vector3(...legB.position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...legB.rotation)), new THREE.Vector3(1, 1, 1)) : null),
    [legB],
  );
  // which pieces are drawn on their own because they open; everything else is merged (see StaticPieces)
  const moving = useMemo(() => plan.fronts.map((f) => (f ? "1" : "0")).join(""), [plan]);
  // every frame that follows a change of the piece redraws the shadow map; orbiting does not
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    refreshShadows(gl);
  });
  const onLeg = (piece: ScenePiece | undefined, key: string, el: React.ReactNode) =>
    piece?.leg === "B" && legB ? (
      <group key={key} position={legB.position} rotation={legB.rotation}>
        {el}
      </group>
    ) : (
      el
    );
  const slidingTexture = useOptionalTexture(front);
  const faces = useFaceMaterials(scene, front.color);
  const env = useRoomEnvironment();
  const ghost = open.ghost;
  // „Open all" reduces the sliding doors to a faint outline, so the interior being edited reads clearly.
  const slidingMat = useDisposable(
    useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: slidingTexture ? "#ffffff" : front.color,
          map: slidingTexture,
          roughness: 0.5,
          ...(ghost ? { transparent: true, opacity: GHOST_OPACITY, depthWrite: false } : {}),
        }),
      [slidingTexture, front.color, ghost],
    ),
  );
  const railMat = useDisposable(
    useMemo(
      () => new THREE.MeshStandardMaterial({ color: "#c9cdd2", metalness: 1, roughness: 0.28, envMap: env, envMapIntensity: 1 }),
      [env],
    ),
  );
  const finish = FINISH_LOOK[handleFinish] ?? FINISH_LOOK.NEGRU;
  const metalMat = useDisposable(
    useMemo(
      () => new THREE.MeshStandardMaterial({ color: finish.color, metalness: finish.metalness, roughness: finish.roughness, envMap: env, envMapIntensity: finish.env }),
      [finish, env],
    ),
  );
  const channelMat = useDisposable(
    useMemo(
      () => new THREE.MeshStandardMaterial({ color: finish.color, metalness: 0.55, roughness: 0.62, envMap: env, envMapIntensity: 0.45 }),
      [finish, env],
    ),
  );
  const shellMat = useDisposable(
    useMemo(
      // satin, so the scoop shows its shading instead of mirroring the room
      () => new THREE.MeshStandardMaterial({ color: finish.color, metalness: 0.45, roughness: 0.55, envMap: env, envMapIntensity: finish.env * 0.5, vertexColors: true }),
      [finish, env],
    ),
  );
  const shadeMat = useDisposable(
    useMemo(() => new THREE.MeshBasicMaterial({ color: "#0d0a08", transparent: true, opacity: 0.34, depthWrite: false, toneMapped: false, ...OVERLAY }), []),
  );
  const veilMat = useDisposable(
    useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, ...OVERLAY }), []),
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
  const mats = useMemo<HardwareMaterials>(
    () => ({ metal: metalMat, shell: shellMat, channel: channelMat, shade: shadeMat, veil: veilMat, cut: lineMaterial(frontEdge.color, frontEdge.opacity) }),
    [metalMat, shellMat, channelMat, shadeMat, veilMat, frontEdge],
  );
  // Gola: the aluminium channel fixed to the carcass in the gap each shortened front leaves, with the
  // half under its upper lip (or towards the hinge side) in shade — all of them as two meshes
  const gola = useMemo(() => {
    const channels: BoardSpec[] = [];
    const shades: BoardSpec[] = [];
    plan.fronts.forEach((f, i) => {
      const rect = f?.channel;
      if (!f || !rect) return;
      const matrix = scene.pieces[i]?.leg === "B" ? legBMatrix : null;
      const horizontal = rect.w >= rect.h;
      const cx = (rect.x + rect.w / 2 - scene.widthMm / 2) * S;
      const cy = (rect.y + rect.h / 2) * S;
      const cz = (f.piece.z + f.piece.d - GOLA_RECESS_MM - GOLA_THICK_MM / 2 - scene.depthMm / 2) * S;
      const zShade = cz + (GOLA_THICK_MM / 2 + 1.2) * S;
      channels.push({ size: [rect.w * S, rect.h * S, GOLA_THICK_MM * S], at: [cx, cy, cz], origin: [0, 0, 0], grain: "auto", matrix });
      shades.push(
        horizontal
          ? { size: [rect.w * S, (rect.h / 2) * S, 0.6 * S], at: [cx, cy + (rect.h / 4) * S, zShade], origin: [0, 0, 0], grain: "auto", matrix }
          : { size: [rect.w * 0.5 * S, rect.h * S, 0.6 * S], at: [cx, cy, zShade], origin: [0, 0, 0], grain: "auto", matrix },
      );
    });
    return { channels: mergeBoards(channels), shades: mergeBoards(shades) };
  }, [plan, scene, legBMatrix]);
  useEffect(
    () => () => {
      gola.channels?.dispose();
      gola.shades?.dispose();
    },
    [gola],
  );

  /* Taps and hover: one set of handlers on the whole piece. The nearest thing under the pointer
     answers (a carcass side hides the drawer behind it), and it opens only if it is a front. */
  const [hover, setHover] = useState<string | null>(null);
  const canvas = useThree((s) => s.gl.domElement);
  useEffect(() => {
    canvas.style.setProperty("cursor", hover ? "pointer" : "");
    return () => {
      canvas.style.removeProperty("cursor");
    };
  }, [hover, canvas]);
  const keyOf = (e: ThreeEvent<MouseEvent | PointerEvent>): string | null => {
    for (let o: THREE.Object3D | null = e.object; o; o = o.parent) {
      const key = (o.userData as { openKey?: unknown }).openKey;
      if (typeof key === "string") return key;
      if (o === e.eventObject) break;
    }
    return null;
  };

  return (
    <FrontEdge.Provider value={frontEdge}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          // a drag that rotated the model is not a tap
          if (e.delta > TAP_SLOP_PX) return;
          const key = keyOf(e);
          if (!key) return;
          onToggle(key);
          // the front moves away from under the pointer: its highlight must not stay behind
          setHover(null);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          // touch has no hover: a highlight would stay stuck after the tap
          if (e.pointerType !== "mouse") return;
          setHover(keyOf(e));
        }}
        onPointerOut={(e) => {
          const key = keyOf(e);
          setHover((current) => (current === key ? null : current));
        }}
      >
        <StaticPieces scene={scene} moving={moving} legB={legBMatrix} carcass={carcassMat} back={backMat} worktop={worktopMat} front={frontMat} />
        <Appliances scene={scene} legB={legBMatrix} mats={applianceMats} />
        {scene.pieces.map((piece, i) => {
          const f = plan.fronts[i];
          if (!f) return null;
          const fill = piece.fill === "OGLINDA" || piece.fill === "STICLA" ? piece.fill : null;
          const face = fill ? (faces.get(faceKey(fill, piece)) ?? null) : null;
          const common = { plan: f, scene, handle, mats, amount: open.amount[i] ?? 0, hovered: hover === f.key };
          return f.kind === "door"
            ? // a mirror / lacquered glass is glued on a board of the carcass material; a glass pane sits in a frame of the fronts' board
              onLeg(piece, `${i}-${f.mode}`, <HingedFront key={`${i}-${f.mode}`} {...common} material={face && !face.pane ? carcassMat : frontMat} face={face} />)
            : onLeg(piece, `${i}-drawer`, <DrawerFront key={`${i}-drawer`} {...common} material={frontMat} carcassMaterial={carcassMat} />);
        })}
        {gola.channels && <mesh geometry={gola.channels} material={channelMat} receiveShadow />}
        {gola.shades && <mesh geometry={gola.shades} material={shadeMat} raycast={noRaycast} />}
        {rails.map((rail, i) => (
          <RailMesh key={i} rail={rail} scene={scene} material={railMat} />
        ))}
        {scene.doors.map((door, i) => {
          const fill = door.fill === "OGLINDA" || door.fill === "STICLA" ? door.fill : null;
          return (
            <Door
              key={i}
              door={door}
              openKey={slidingKey(i)}
              targetXmm={open.slideX[i] ?? door.x}
              zMm={trackZ[door.track] ?? trackZ[0]}
              scene={scene}
              material={slidingMat}
              face={fill ? (faces.get(faceKey(fill, door)) ?? null) : null}
              solid={!ghost}
              hovered={hover === slidingKey(i)}
            />
          );
        })}
      </group>
    </FrontEdge.Provider>
  );
});

/** A finger (or the mouse) may wander this far between down and up and still count as a tap. */
const TAP_SLOP_PX = 8;

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
  const gl = useThree((s) => s.gl);
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
    refreshShadows(gl);
    invalidate();
  }, [W, H, D, gl, invalidate]);
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
interface Footprint {
  x: number;
  z: number;
  w: number;
  d: number;
}

function Stage({ W, H, D, wallHung, footprints }: { W: number; H: number; D: number; wallHung: boolean; footprints: readonly Footprint[] | null }) {
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
      {(footprints ?? [{ x: 0, z: 0, w: W, d: D }]).map((f, i) => (
        <mesh key={i} position={[f.x, -(f.z + 0.04), -0.002]} scale={[f.w + 0.5, f.d + 0.6, 1]} geometry={UNIT_PLANE} renderOrder={-2}>
          <meshBasicMaterial map={shade} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** A soft accent strip right under the front edge of one column (on the floor, or under a wall cabinet). */
function ColumnHighlight({ scene, range, wallHung }: { scene: AtelierScene; range: { x0: number; x1: number }; wallHung: boolean }) {
  const width = Math.max(0.05, (range.x1 - range.x0) * S - 0.03);
  const x = ((range.x0 + range.x1) / 2 - scene.widthMm / 2) * S;
  // a kitchen's scene is as deep as its second wall: the strip goes in front of the main wall's base units
  const frontMm = scene.kitchen
    ? Math.max(0, ...scene.pieces.filter((p) => !p.leg && p.y < 900).map((p) => p.z + p.d))
    : scene.depthMm;
  const front = (frontMm - scene.depthMm / 2) * S;
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

/* The „tap a door" hint is shown until the client opens something, once per browser session. */
const HINT_KEY = "atelier:viewer-tap-hint";
function hintSeen(): boolean {
  try {
    return window.sessionStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}
function rememberHint() {
  try {
    window.sessionStorage.setItem(HINT_KEY, "1");
  } catch {
    // private mode / storage blocked: the hint simply comes back after a reload
  }
}

/** The hint leaves by itself after this long. */
const HINT_MS = 4000;
/** Short viewports (a phone held sideways): no room for words over the model. */
const SHORT_HIDE = "[@media(max-height:419px)]:hidden";

/** Is the viewer phone-sized (narrower than Tailwind's `sm`, and not a short landscape strip)? */
function usePhoneBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setPhone(window.innerWidth < 640 && window.innerHeight >= 420);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, phone };
}

/**
 * The same object for as long as its content (`key`) stays the same. The shell hands over a new scene
 * with every price response and new colour objects with every change: held like this, an answer that
 * changes nothing re-renders nothing in the canvas.
 */
function useHeld<T>(value: T, key: string): T {
  const [held, setHeld] = useState({ key, value });
  if (held.key !== key) setHeld({ key, value });
  return held.key === key ? held.value : value;
}
const lookKey = (look: MaterialLook | null | undefined) =>
  look ? `${look.color}|${look.imageUrl ?? ""}|${look.grainHorizontal ? 1 : 0}|${look.crop ? look.crop.join(",") : ""}` : "";

/** Is the viewer on screen (and the tab in front)? Off screen nothing is drawn at all. */
function useOnScreen(ref: React.RefObject<HTMLDivElement | null>) {
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => setInView(entries[entries.length - 1]?.isIntersecting ?? true));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState !== "hidden");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return inView && tabVisible;
}

/** Back on screen: draw one frame (things may have changed meanwhile). */
function Wake({ awake }: { awake: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (!awake) return;
    refreshShadows(gl);
    invalidate();
  }, [awake, gl, invalidate]);
  return null;
}

export default function Viewer3D({
  scene: sceneProp,
  columns: columnsProp,
  railPositions: railPositionsProp,
  carcass: carcassProp,
  front: frontProp,
  updating,
  doorsOpen: doorsOpenProp,
  onDoorsOpenChange,
  highlight,
  handles = false,
  handle,
  handleFinish = "NEGRU",
  focus = null,
  onInteract,
  stale = false,
  worktop: worktopProp = null,
}: Viewer3DProps) {
  const scene = useHeld(sceneProp, useMemo(() => (sceneProp ? JSON.stringify(sceneProp) : ""), [sceneProp]));
  const columns = useHeld(columnsProp, columnsProp.join("|"));
  const railPositions = useHeld(railPositionsProp, railPositionsProp ? railPositionsProp.join("|") : "-");
  const carcass = useHeld(carcassProp, lookKey(carcassProp));
  const front = useHeld(frontProp, lookKey(frontProp));
  const worktop = useHeld(worktopProp, lookKey(worktopProp));
  const [doorsOpenLocal, setDoorsOpenLocal] = useState(false);
  const doorsOpen = doorsOpenProp ?? doorsOpenLocal;
  const setDoorsOpen = (open: boolean) => {
    setDoorsOpenLocal(open);
    onDoorsOpenChange?.(open);
  };
  const [resetSignal, setResetSignal] = useState(0);
  // the "drag to rotate" hint has done its job once the client has touched the model
  const [interacted, setInteracted] = useState(false);
  const [tapHint, setTapHint] = useState(() => !hintSeen());
  // the hint also leaves by itself: it must not sit on the model for long
  const hasScene = !!scene;
  useEffect(() => {
    if (!hasScene || !tapHint) return;
    const timer = setTimeout(() => setTapHint(false), HINT_MS);
    return () => clearTimeout(timer);
  }, [hasScene, tapHint]);
  const { ref: boxRef, phone } = usePhoneBox();
  const onScreen = useOnScreen(boxRef);

  // what the fronts carry: the shell's choice, else the scene's, else the legacy flag (older CRM)
  const handleKind: EffectiveHandle = handle ?? scene?.handle ?? (handles ? "APLICAT" : "FARA");
  const plan = useMemo(() => (scene ? planScene(scene, handleKind) : null), [scene, handleKind]);

  /* What is open. `doorsOpen` is „everything" (the button, or the shell); on top of it the client
     opens and closes single doors and drawers by tapping them. Using the button, a change of
     `doorsOpen` from outside or a different set of fronts forgets the single choices. */
  const [overrides, setOverrides] = useState<OpenOverrides>({});
  // drawers come out with „open all" only when the client asked for it with the button
  // (the shell opening the doors for the interior step must not pull every drawer out)
  const [allDrawers, setAllDrawers] = useState(false);
  // a focus (choosing handles / door faces) shows the piece closed; the shell's „open" waits
  const allOpen = doorsOpen && !focus;
  const resetKey = `${allOpen}|${focus ?? ""}|${plan?.signature ?? ""}`;
  const [seenResetKey, setSeenResetKey] = useState(resetKey);
  if (seenResetKey !== resetKey) {
    setSeenResetKey(resetKey);
    setOverrides({});
    if (!allOpen) setAllDrawers(false);
  }
  const open = useMemo(
    () => (scene && plan ? resolveOpen(scene, plan, overrides, allOpen, allDrawers) : null),
    [scene, plan, overrides, allOpen, allDrawers],
  );
  const hasOpenables = !!plan && plan.doors + plan.drawers + plan.sliding > 0;
  // the button reads „close all" only when the piece really stands open, not after one door
  const everythingOpen = open?.allOpen ?? false;

  const dismissHint = () => {
    if (!tapHint) return;
    setTapHint(false);
    rememberHint();
  };
  const toggleAll = () => {
    const next = !everythingOpen;
    setOverrides({});
    setAllDrawers(next);
    setDoorsOpen(next);
    dismissHint();
    onInteract?.("all", next);
  };
  const toggleOne = (key: string) => {
    if (!scene || !plan) return;
    const result = toggleOpen(scene, plan, overrides, allOpen, allDrawers, key);
    setOverrides(result.overrides);
    if (!result.changed) return;
    dismissHint();
    onInteract?.(key.startsWith("sliding") ? "sliding" : key.startsWith("drawer") ? "drawer" : "door", result.open);
  };
  // one handler for the life of the canvas (a new one per render would re-render the whole model)
  const toggleRef = useRef(toggleOne);
  useEffect(() => {
    toggleRef.current = toggleOne;
  });
  const onToggle = useCallback((key: string) => toggleRef.current(key), []);

  const W = (scene?.widthMm ?? 2400) * S;
  const H = (scene?.heightMm ?? 2600) * S;
  const D = (scene?.depthMm ?? 600) * S;
  // wall cabinets are the only furniture without legs / plinth: they hang on a wall, not on the floor
  const wallHung = plan?.wallHung ?? false;
  // opened doors and drawers stick out: the view must hold their free corners too. (Exact corners, not
  // a margin all around: one door of a wide piece moves the camera only as far as that door needs.)
  const pad = useMemo<OpenPad>(() => {
    if (!scene || !plan || !open) return NO_PAD;
    const legB = legBTransform(scene);
    const turn = legB ? new THREE.Matrix4().compose(new THREE.Vector3(...legB.position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...legB.rotation)), new THREE.Vector3(1, 1, 1)) : null;
    const points: [number, number, number][] = [];
    const v = new THREE.Vector3();
    plan.fronts.forEach((f, i) => {
      const amount = open.amount[i] ?? 0;
      if (!f || amount <= 0) return;
      const p = f.piece;
      const face = p.z + p.d;
      const add = (x: number, y: number, z: number) => {
        v.set((x - scene.widthMm / 2) * S, y * S, (z - scene.depthMm / 2) * S);
        if (p.leg === "B" && turn) v.applyMatrix4(turn);
        points.push([v.x, v.y, v.z]);
      };
      if (f.mode === "DRAWER") {
        const z = face + f.travelMm * amount;
        for (const x of [p.x, p.x + p.w]) for (const y of [p.y, p.y + p.h]) add(x, y, z);
      } else if (f.mode === "T") {
        const y = p.y + p.h - p.h * Math.cos(LIFT_OPEN_RAD);
        const z = face + p.h * Math.sin(LIFT_OPEN_RAD);
        add(p.x, y, z);
        add(p.x + p.w, y, z);
      } else {
        const sign = f.mode === "L" ? -1 : 1;
        const x = (f.mode === "L" ? p.x : p.x + p.w) + sign * -p.w * Math.cos(SWING_OPEN_RAD);
        const z = face + p.w * Math.sin(SWING_OPEN_RAD);
        add(x, p.y, z);
        add(x, p.y + p.h, z);
      }
    });
    return points.length === 0 ? NO_PAD : { ...NO_PAD, points };
  }, [scene, plan, open]);
  // an L kitchen is seen from its open side, so both walls show their fronts
  const azimuth = scene?.kitchen?.layout === "L_DREAPTA" ? -VIEW_AZIMUTH : VIEW_AZIMUTH;
  // what stands on the floor, for the soft shadow under it: an L kitchen is two strips, not the whole rectangle
  const footprints = useMemo<Footprint[] | null>(() => {
    if (!scene?.kitchen) return null;
    const legB = legBTransform(scene);
    const turn = legB ? new THREE.Matrix4().compose(new THREE.Vector3(...legB.position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...legB.rotation)), new THREE.Vector3(1, 1, 1)) : null;
    const v = new THREE.Vector3();
    const boxes: Record<"A" | "B", THREE.Box3> = { A: new THREE.Box3(), B: new THREE.Box3() };
    for (const p of scene.pieces) {
      if (p.y > 400 || p.role === "SPATE") continue;
      for (const x of [p.x, p.x + p.w])
        for (const z of [p.z, p.z + p.d]) {
          v.set((x - scene.widthMm / 2) * S, 0, (z - scene.depthMm / 2) * S);
          if (p.leg === "B" && turn) v.applyMatrix4(turn);
          boxes[p.leg === "B" ? "B" : "A"].expandByPoint(v);
        }
    }
    const out = Object.values(boxes)
      .filter((b) => !b.isEmpty())
      .map((b) => ({ x: (b.min.x + b.max.x) / 2, z: (b.min.z + b.max.z) / 2, w: b.max.x - b.min.x, d: b.max.z - b.min.z }));
    return out.length > 0 ? out : null;
  }, [scene]);

  // the hint names only what the client can see and tap right now
  const seenDoors = plan ? plan.doors + plan.sliding : 0;
  const seenDrawers = plan ? plan.fronts.filter((f) => f?.kind === "drawer" && f.coveredBy.length === 0 && !f.behindSliding).length : 0;
  const hintText =
    seenDoors > 0 && seenDrawers > 0
      ? "Atinge o ușă sau un sertar ca să-l deschizi"
      : seenDoors > 0
        ? "Atinge o ușă ca să o deschizi"
        : seenDrawers > 0
          ? "Atinge un sertar ca să-l deschizi"
          : null;
  const allLabel = everythingOpen ? "Închide tot" : "Deschide tot";
  const showHint = !!scene && !!hintText && tapHint && !focus;

  const focusSpec = useMemo<FocusSpec | null>(() => {
    if (!focus || !scene || !plan) return null;
    if (focus === "doors") return { kind: "doors" };
    // the front nearest the middle of the piece that shows its handle (not the drawers behind doors)
    let best: FrontPlan | null = null;
    let bestOff = Infinity;
    const routed = handleKind === "INGROPAT" || handleKind === "PROFIL_J";
    for (const f of plan.fronts) {
      if (!f || !f.hardware || f.coveredBy.length > 0 || f.behindSliding || f.piece.leg === "B") continue;
      if (handleKind === "GOLA" && !f.channel) continue;
      // a grip is never routed into a door that carries a mirror or glass: looking there would show nothing
      if (routed && (f.piece.fill || !gripNotch(handleKind, f.mode, f.edge, f.cls, f.piece.w, f.piece.h, f.piece.d, f.piece.y))) continue;
      const off = Math.abs(f.piece.x + f.piece.w / 2 - scene.widthMm / 2) - (f.kind === "door" ? 1 : 0);
      if (off < bestOff) {
        best = f;
        bestOff = off;
      }
    }
    if (!best) return null;
    const p = best.piece;
    const [gx, gy] = gripPoint(best, handleKind);
    return {
      kind: "handles",
      point: [(p.x + p.w / 2 + gx - scene.widthMm / 2) * S, (p.y + p.h / 2 + gy) * S, (p.z + p.d - scene.depthMm / 2) * S],
      side: best.mode === "R" ? -1 : 1,
      span: best.kind === "door" && p.h > 1400 ? 0.8 : 0.6,
    };
  }, [focus, scene, plan, handleKind]);
  // on a phone the round buttons and the caption take a band at the bottom: the model is fitted above it
  const insets = useMemo<Insets>(() => (phone ? { top: 4, bottom: 52 } : { top: 0, bottom: 0 }), [phone]);

  return (
    <div
      ref={boxRef}
      className="relative h-full w-full overflow-hidden rounded-[var(--image-radius)] bg-[#ddd6cb]"
      style={{ backgroundImage: BACKDROP }}
    >
      {scene && plan && open ? (
        <Canvas
          // an out-of-date model (old shape in new colours) must not pass for the result
          style={{ opacity: stale && !updating ? 0.5 : 1, transition: "opacity 0.3s ease" }}
          // a frame is drawn only when something changed (a tween, an orbit, new props); off screen, never
          frameloop={onScreen ? "demand" : "never"}
          dpr={[1, 2]}
          shadows="percentage"
          // the shadow map is redrawn when the piece changes (see Wardrobe, useTween), not on every orbit frame
          onCreated={({ gl }) => {
            gl.shadowMap.autoUpdate = false;
            refreshShadows(gl);
          }}
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
          <Wake awake={onScreen} />
          <StudioEnvironment />
          <hemisphereLight args={["#ffffff", "#b3a89c", 0.9]} />
          <KeyLight W={W} H={H} D={D} />
          <directionalLight position={[-4, 2.5, 3]} intensity={0.5} color="#eef2ff" />
          <Stage W={W} H={H} D={D} wallHung={wallHung} footprints={footprints} />
          <Wardrobe
            scene={scene}
            plan={plan}
            open={open}
            columns={columns}
            railPositions={railPositions}
            carcass={carcass}
            front={front}
            handle={handleKind}
            handleFinish={handleFinish}
            onToggle={onToggle}
            worktop={worktop}
          />
          {scene.kitchen && <KitchenWalls scene={scene} />}
          {highlight && <ColumnHighlight scene={scene} range={highlight} wallHung={wallHung} />}
          <OrbitControls
            makeDefault
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2 - 0.04}
            minAzimuthAngle={-Math.PI / 2.4}
            maxAzimuthAngle={Math.PI / 2.4}
            // (the default 0.05 keeps drawing frames for seconds after the hand lets go)
            dampingFactor={0.12}
            onStart={() => setInteracted(true)}
          />
          <CameraRig W={W} H={H} D={D} pad={pad} resetSignal={resetSignal} insets={insets} focus={focusSpec} azimuth={azimuth} />
        </Canvas>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-[var(--home-ivory)]/60">
          Se pregătește modelul 3D…
        </div>
      )}

      {hasOpenables && !focus && (
        <button
          type="button"
          aria-pressed={everythingOpen}
          aria-label={allLabel}
          title={allLabel}
          onClick={toggleAll}
          className={`atelier-doors absolute left-2 top-2 flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold shadow-sm backdrop-blur transition-colors sm:left-3 sm:top-3 sm:px-3.5 ${
            everythingOpen ? "bg-[var(--home-orange)] text-white" : "bg-white/90 text-[var(--home-ivory)]/85 hover:text-[var(--home-ivory)]"
          }`}
        >
          {everythingOpen ? <DoorOpen size={18} aria-hidden="true" /> : <DoorClosed size={18} aria-hidden="true" />}
          <span className={`max-sm:hidden ${SHORT_HIDE}`}>{allLabel}</span>
        </button>
      )}

      {/* desktop: the hint is a pill at the top (there is room above the model) */}
      {showHint && (
        <p className={`pointer-events-none absolute left-0 right-0 top-3.5 flex justify-center max-sm:hidden ${SHORT_HIDE}`}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-medium leading-tight text-[var(--home-ivory)]/85 shadow-sm backdrop-blur">
            <Pointer size={15} aria-hidden="true" className="shrink-0 text-[var(--home-orange)]" />
            {hintText}
          </span>
        </p>
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
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-[var(--home-ivory)]/80 shadow-sm backdrop-blur transition-colors hover:text-[var(--home-ivory)]"
          >
            <ScanEye size={18} aria-hidden="true" />
          </button>
          {/* phone: the hint takes the caption's place in the bottom band (the model is fitted above it) */}
          {showHint && (
            <p className={`pointer-events-none flex items-center gap-1 text-[0.72rem] font-medium leading-tight text-[var(--home-ivory)]/85 sm:hidden ${SHORT_HIDE}`}>
              <Pointer size={14} aria-hidden="true" className="shrink-0 text-[var(--home-orange)]" />
              {hintText}
            </p>
          )}
          <p
            className={`pointer-events-none text-[0.7rem] text-[var(--home-ivory)]/60 ${SHORT_HIDE} ${focus ? "hidden" : showHint || interacted ? "max-sm:hidden" : ""}`}
          >
            Trage pentru a roti<span className="max-lg:hidden"> · scroll / ciupește pentru zoom</span>
          </p>
        </div>
      )}
    </div>
  );
}
