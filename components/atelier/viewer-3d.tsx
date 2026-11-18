"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
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

function requestTexture(url: string) {
  if (textureCache.has(url)) return;
  textureCache.set(url, "loading");
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const settle = (entry: TextureEntry) => {
    textureCache.set(url, entry);
    textureListeners.forEach((fn) => fn());
  };
  loader.load(
    url,
    (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      settle(t);
    },
    undefined,
    () => settle("failed"), // CORS / 404 → flat colour
  );
}

function useOptionalTexture(url: string | null): THREE.Texture | null {
  const entry = useSyncExternalStore(
    subscribeTextures,
    () => (url ? textureCache.get(url) : undefined),
    () => undefined,
  );
  useEffect(() => {
    if (url) requestTexture(url);
  }, [url]);
  return entry instanceof THREE.Texture ? entry : null;
}

function useDisposable<T extends THREE.Material>(material: T): T {
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

function useLookMaterial(look: MaterialLook, roughness: number) {
  const texture = useOptionalTexture(look.imageUrl);
  return useDisposable(
    useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: texture ? "#ffffff" : look.color,
          map: texture,
          roughness,
          metalness: 0,
          envMapIntensity: 0.35,
        }),
      [texture, look.color, roughness],
    ),
  );
}

/* ── Environment: a procedural room, so mirrors and metal have something to reflect (no download) ── */

function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    return texture;
  }, [gl]);
  useEffect(() => () => env.dispose(), [env]);
  // Attached to the root scene as scene.environment.
  return <primitive object={env} attach="environment" />;
}

/* ── Camera: frame the whole wardrobe (plinth to top) with margin; re-frame on notable size changes ── */

function CameraRig({ W, H, D }: { W: number; H: number; D: number }) {
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
  const aB = Math.round(aspect * 10);

  useEffect(() => {
    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2;
    const halfH = (H / 2) * 1.18 + 0.12;
    const halfW = (W / 2) * 1.08 + 0.08;
    const dist = Math.max(halfH / Math.tan(halfFov), halfW / (Math.tan(halfFov) * aspect)) + D / 2;
    const target = new THREE.Vector3(0, H / 2, 0);
    const dir = new THREE.Vector3(0.3, 0.08, 1).normalize();
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.near = 0.05;
    camera.far = dist * 6 + 10;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.copy(target);
      controls.minDistance = dist * 0.35;
      controls.maxDistance = dist * 2;
      controls.update();
    }
    invalidate();
    // Deliberately keyed on the size buckets (see above), not on exact values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wB, hB, dB, aB, controls, camera, invalidate]);
  return null;
}

/* ── Pieces, rails, doors ── */

function Piece({ piece, scene, material }: { piece: ScenePiece; scene: AtelierScene; material: THREE.Material }) {
  const { x, y, z, w, h, d } = piece;
  return (
    <mesh
      position={[(x + w / 2 - scene.widthMm / 2) * S, (y + h / 2) * S, (z + d / 2 - scene.depthMm / 2) * S]}
      material={material}
    >
      <boxGeometry args={[Math.max(w, 1) * S, Math.max(h, 1) * S, Math.max(d, 1) * S]} />
      {piece.role === "CORP" && <Edges threshold={20} color="#000000" transparent opacity={0.18} />}
      {piece.role === "FRONT" && <Edges threshold={20} color="#2a2420" transparent opacity={0.55} />}
    </mesh>
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
}: {
  piece: ScenePiece;
  scene: AtelierScene;
  material: THREE.Material;
  open: boolean;
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
      <mesh position={offset} material={material}>
        <boxGeometry args={[Math.max(w, 1) * S, Math.max(h, 1) * S, Math.max(d, 1) * S]} />
        <Edges threshold={20} color="#2a2420" transparent opacity={0.55} />
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
      const interiorMid = (bottomY + PANEL_MM + top - PANEL_MM) / 2;
      rails.push({ x0, x1, y: interiorMid - RAIL_DROP_MM / 2, z });
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
}: {
  door: SceneDoor;
  targetXmm: number;
  zMm: number;
  scene: AtelierScene;
  material: THREE.Material;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const bottom = Math.max(0, scene.heightMm - door.h);
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
      <mesh ref={ref} material={material} renderOrder={2}>
        <boxGeometry args={[door.w * S, door.h * S, DOOR_THICKNESS_MM * S]} />
        <Edges threshold={20} color="#2a2420" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function useDoorMaterials(front: MaterialLook, open: boolean) {
  const texture = useOptionalTexture(front.imageUrl);
  // Open doors turn into ghosts so the interior reads through them.
  const ghost = open ? { transparent: true, opacity: 0.22, depthWrite: false } : {};
  const panel = useDisposable(
    useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: texture ? "#ffffff" : front.color,
          map: texture,
          roughness: 0.5,
          envMapIntensity: 0.35,
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
          envMapIntensity: 1.7,
          ...ghost,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [open],
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
        envMapIntensity: 0.8,
        transparent: true,
        opacity: open ? 0.22 : 0.92,
        depthWrite: !open,
      });
    }, [front.color, open]),
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
}: Omit<Viewer3DProps, "updating" | "scene"> & { scene: AtelierScene; doorsOpen: boolean }) {
  const carcassMat = useLookMaterial(carcass, 0.75);
  const backMat = useLookMaterial(carcass, 0.9);
  const frontMat = useLookMaterial(front, 0.55);
  const doorMats = useDoorMaterials(front, doorsOpen);
  const railMat = useDisposable(
    useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9cdd2", metalness: 1, roughness: 0.28 }), []),
  );
  const rails = useMemo(() => railsFor(scene, columns, railPositions), [scene, columns, railPositions]);

  // Doors run on two tracks in the zone between the carcass front face and the full depth.
  const carcassFront =
    scene.pieces.reduce((max, p) => (p.role === "CORP" ? Math.max(max, p.z + p.d) : max), 0) ||
    scene.depthMm - 100;
  const zone = Math.max(2 * DOOR_THICKNESS_MM + 6, scene.depthMm - carcassFront);
  const gap = (zone - 2 * DOOR_THICKNESS_MM) / 3;
  const trackZ = [carcassFront + gap, carcassFront + 2 * gap + DOOR_THICKNESS_MM];

  return (
    <group>
      {scene.pieces.map((piece, i) =>
        piece.hinge ? (
          <HingedFront key={`${i}-${piece.hinge}`} piece={piece} scene={scene} material={frontMat} open={doorsOpen} />
        ) : (
          <Piece
            key={i}
            piece={piece}
            scene={scene}
            material={piece.role === "FRONT" ? frontMat : piece.role === "SPATE" ? backMat : carcassMat}
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
          />
        );
      })}
    </group>
  );
}

export default function Viewer3D({ scene, columns, railPositions, carcass, front, updating }: Viewer3DProps) {
  const [doorsOpen, setDoorsOpen] = useState(false);
  // sliding doors, or hinged fronts the CRM marked with their hinge side
  const hasDoors = (scene?.doors.length ?? 0) > 0 || (scene?.pieces.some((p) => p.hinge) ?? false);

  const W = (scene?.widthMm ?? 2400) * S;
  const H = (scene?.heightMm ?? 2600) * S;
  const D = (scene?.depthMm ?? 600) * S;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--image-radius)] bg-[#f1eee9]">
      {scene ? (
        <Canvas
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [1, 1.5, 6], fov: 35, near: 0.05, far: 100 }}
          fallback={
            <p className="p-6 text-sm text-[var(--home-ivory)]/70">
              Browserul tău nu poate afișa modelul 3D. Configurația și prețul funcționează în continuare.
            </p>
          }
        >
          <color attach="background" args={["#f1eee9"]} />
          <StudioEnvironment />
          <hemisphereLight args={["#fff6ea", "#2a241f", 0.5]} />
          <directionalLight position={[3, 5, 6]} intensity={1.0} />
          <directionalLight position={[-4, 3, -2]} intensity={0.3} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
            <planeGeometry args={[W + 6, 8]} />
            <meshStandardMaterial color="#e2ddd5" roughness={1} />
          </mesh>
          <Wardrobe scene={scene} columns={columns} railPositions={railPositions} carcass={carcass} front={front} doorsOpen={doorsOpen} />
          <OrbitControls
            makeDefault
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2 - 0.04}
            minAzimuthAngle={-Math.PI / 2.4}
            maxAzimuthAngle={Math.PI / 2.4}
          />
          <CameraRig W={W} H={H} D={D} />
        </Canvas>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-[var(--home-ivory)]/60">
          Se pregătește modelul 3D…
        </div>
      )}

      {hasDoors && (
        <div
          className="absolute left-3 top-3 flex gap-1 rounded-full bg-white/85 shadow-sm p-1 backdrop-blur"
          role="radiogroup"
          aria-label="Uși"
        >
          {[
            { open: false, label: "Uși închise" },
            { open: true, label: "Uși deschise" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={doorsOpen === o.open}
              onClick={() => setDoorsOpen(o.open)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                doorsOpen === o.open
                  ? "bg-[var(--home-orange)] text-white"
                  : "text-[var(--home-ivory)]/80 hover:text-[var(--home-ivory)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {updating && scene && (
        <span className="absolute right-3 top-3 rounded-full bg-white/85 shadow-sm px-3 py-1.5 text-xs text-[var(--home-ivory)]/80 backdrop-blur">
          Se actualizează…
        </span>
      )}
      <p className="pointer-events-none absolute bottom-3 left-3 text-[0.7rem] text-[var(--home-ivory)]/60">
        Trage pentru a roti · scroll / ciupește pentru zoom
      </p>
    </div>
  );
}
