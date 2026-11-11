"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { AtelierScene, SceneDoor, ScenePiece } from "@/lib/atelier/types";
import type { MaterialLook } from "./material-look";

/** Scene units are millimetres; three.js works in metres. */
const S = 0.001;
const DOOR_THICKNESS_MM = 18;
const TRACK_OFFSET_MM = [14, 46] as const;

export interface Viewer3DProps {
  scene: AtelierScene | null;
  carcass: MaterialLook;
  front: MaterialLook;
  /** A newer configuration is being priced; the last valid scene stays on screen. */
  updating: boolean;
}

/** Loads a texture if the URL works; any failure (CORS, 404) just falls back to the flat colour. */
function useOptionalTexture(url: string | null): THREE.Texture | null {
  const [loaded, setLoaded] = useState<{ url: string; texture: THREE.Texture } | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let texture: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        if (cancelled) {
          t.dispose();
          return;
        }
        t.colorSpace = THREE.SRGBColorSpace;
        texture = t;
        setLoaded({ url, texture: t });
      },
      undefined,
      () => {
        /* keep the flat colour */
      },
    );
    return () => {
      cancelled = true;
      texture?.dispose();
    };
  }, [url]);
  return url && loaded?.url === url ? loaded.texture : null;
}

function useLookMaterial(look: MaterialLook, extra: THREE.MeshStandardMaterialParameters = {}) {
  const texture = useOptionalTexture(look.imageUrl);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: texture ? "#ffffff" : look.color,
        map: texture,
        roughness: 0.75,
        metalness: 0,
        ...extra,
      }),
    // `extra` is a literal per call site; its values never change between renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texture, look.color],
  );
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

function Piece({ piece, scene, material }: { piece: ScenePiece; scene: AtelierScene; material: THREE.Material }) {
  const { x, y, z, w, h, d } = piece;
  return (
    <mesh
      position={[(x + w / 2 - scene.widthMm / 2) * S, (y + h / 2) * S, (z + d / 2 - scene.depthMm / 2) * S]}
      material={material}
    >
      <boxGeometry args={[Math.max(w, 1) * S, Math.max(h, 1) * S, Math.max(d, 1) * S]} />
      {piece.role === "CORP" && <Edges threshold={20} color="#000000" transparent opacity={0.18} />}
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
  const bottom = Math.max(0, scene.heightMm - door.h);
  const targetX = (targetXmm + door.w / 2 - scene.widthMm / 2) * S;

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const dx = targetX - mesh.position.x;
    if (Math.abs(dx) < 0.0005) {
      mesh.position.x = targetX;
      return;
    }
    mesh.position.x += dx * Math.min(1, delta * 8);
    state.invalidate();
  });

  return (
    <mesh
      ref={ref}
      position={[targetX, (bottom + door.h / 2) * S, (zMm + DOOR_THICKNESS_MM / 2 - scene.depthMm / 2) * S]}
      material={material}
      renderOrder={2}
    >
      <boxGeometry args={[door.w * S, door.h * S, DOOR_THICKNESS_MM * S]} />
      <Edges threshold={20} color="#d66c00" transparent opacity={0.35} />
    </mesh>
  );
}

function Wardrobe({ scene, carcass, front, doorsOpen }: Omit<Viewer3DProps, "updating" | "scene"> & { scene: AtelierScene; doorsOpen: boolean }) {
  const carcassMat = useLookMaterial(carcass);
  const backMat = useLookMaterial(carcass, { roughness: 0.9 });
  const frontMat = useLookMaterial(front, { roughness: 0.55 });
  const panelDoorMat = useLookMaterial(front, { transparent: true, opacity: 0.55, depthWrite: false });
  const mirrorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cfd8de",
        metalness: 0.85,
        roughness: 0.12,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    [],
  );
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#bcd6e2",
        metalness: 0.1,
        roughness: 0.05,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      mirrorMat.dispose();
      glassMat.dispose();
    },
    [mirrorMat, glassMat],
  );

  // The carcass front face; door tracks sit in front of it.
  const carcassFront = scene.pieces.reduce(
    (max, p) => (p.role === "CORP" ? Math.max(max, p.z + p.d) : max),
    0,
  ) || scene.depthMm - 80;

  const doorMaterial = (fill: SceneDoor["fill"]) =>
    fill === "OGLINDA" ? mirrorMat : fill === "STICLA" ? glassMat : panelDoorMat;

  return (
    <group>
      {scene.pieces.map((piece, i) => (
        <Piece
          key={i}
          piece={piece}
          scene={scene}
          material={piece.role === "FRONT" ? frontMat : piece.role === "SPATE" ? backMat : carcassMat}
        />
      ))}
      {scene.doors.map((door, i) => {
        // Opening slides each rear-track door over its neighbour, revealing the column behind it.
        const prev = scene.doors[i - 1];
        const targetXmm = doorsOpen && door.track === 1 && prev ? prev.x : door.x;
        return (
          <Door
            key={i}
            door={door}
            targetXmm={targetXmm}
            zMm={carcassFront + TRACK_OFFSET_MM[door.track]}
            scene={scene}
            material={doorMaterial(door.fill)}
          />
        );
      })}
    </group>
  );
}

export default function Viewer3D({ scene, carcass, front, updating }: Viewer3DProps) {
  const [doorsOpen, setDoorsOpen] = useState(false);
  const hasDoors = (scene?.doors.length ?? 0) > 0;

  const W = (scene?.widthMm ?? 2400) * S;
  const H = (scene?.heightMm ?? 2600) * S;
  const span = Math.max(W, H);
  const distance = span * 1.35 + 1.2;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--image-radius)] bg-[#141414]">
      {scene ? (
        <Canvas
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [distance * 0.35, H * 0.62, distance], fov: 35, near: 0.05, far: 100 }}
          fallback={
            <p className="p-6 text-sm text-[var(--home-ivory)]/70">
              Browserul tău nu poate afișa modelul 3D. Configurația și prețul funcționează în continuare.
            </p>
          }
        >
          <color attach="background" args={["#141414"]} />
          <hemisphereLight args={["#fff6ea", "#2a241f", 0.9]} />
          <directionalLight position={[3, 5, 6]} intensity={1.6} />
          <directionalLight position={[-4, 3, -2]} intensity={0.35} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
            <planeGeometry args={[W + 6, 8]} />
            <meshStandardMaterial color="#1f1c19" roughness={1} />
          </mesh>
          <Wardrobe scene={scene} carcass={carcass} front={front} doorsOpen={doorsOpen} />
          <OrbitControls
            makeDefault
            target={[0, H / 2, 0]}
            enablePan={false}
            minDistance={span * 0.6 + 0.6}
            maxDistance={span * 2.6 + 2}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2 - 0.04}
            minAzimuthAngle={-Math.PI / 2.4}
            maxAzimuthAngle={Math.PI / 2.4}
          />
        </Canvas>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-[var(--home-ivory)]/60">
          Se pregătește modelul 3D…
        </div>
      )}

      {hasDoors && (
        <div
          className="absolute left-3 top-3 flex gap-1 rounded-full bg-black/60 p-1 backdrop-blur"
          role="radiogroup"
          aria-label="Uși glisante"
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
                  ? "bg-[var(--home-orange)] text-[var(--home-black)]"
                  : "text-[var(--home-ivory)]/80 hover:text-[var(--home-ivory)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {updating && scene && (
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs text-[var(--home-ivory)]/80 backdrop-blur">
          Se actualizează…
        </span>
      )}
      <p className="pointer-events-none absolute bottom-3 left-3 text-[0.7rem] text-[var(--home-ivory)]/45">
        Trage pentru a roti · scroll / ciupește pentru zoom
      </p>
    </div>
  );
}
