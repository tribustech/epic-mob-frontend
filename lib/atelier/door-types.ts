import { autoDoorCount } from "./doors.ts";
import type { AtelierCatalog, AtelierConfig, AtelierDoors, AtelierGlass, DoorFill, DoorType } from "./types.ts";

/** The doors panel asks two things: how the doors open, then what their face is. */
export type DoorOpening = "NONE" | "BATANTE" | "GLISANTE";
export type DoorFace = DoorFill;

export const DOOR_FILLS: readonly DoorFill[] = ["PANOU", "OGLINDA", "STICLA"];
export const isDoorFill = (v: unknown): v is DoorFill => (DOOR_FILLS as readonly unknown[]).includes(v);

export function doorOpening(type: DoorType): DoorOpening {
  return type.startsWith("BATANTE") ? "BATANTE" : type.startsWith("GLISANTE") ? "GLISANTE" : "NONE";
}

export function doorFace(type: DoorType): DoorFace {
  return type.endsWith("_OGLINDA") ? "OGLINDA" : type.endsWith("_STICLA") ? "STICLA" : "PANOU";
}

export function doorType(opening: DoorOpening, face: DoorFace): DoorType {
  if (opening === "NONE") return "NONE";
  return face === "PANOU" ? opening : (`${opening}_${face}` as DoorType);
}

export const isHinged = (type: DoorType) => doorOpening(type) === "BATANTE";

type DoorShape = Pick<AtelierConfig, "category" | "widthMm" | "columns" | "doors">;

/** How many faces the client can choose: one per sliding door, one per column with hinged doors. */
export function doorSlots(config: DoorShape): number {
  if (config.category !== "DRESSING") return 0;
  const opening = doorOpening(config.doors.type);
  if (opening === "GLISANTE") {
    const n = config.doors.count;
    return n && n >= 2 ? n : autoDoorCount(config.widthMm);
  }
  return opening === "BATANTE" ? config.columns.length : 0;
}

/** The face of every door, left to right: the per-door choice, else the face of the door type. */
export function doorFills(config: DoorShape): DoorFill[] {
  const base = doorFace(config.doors.type);
  const fills = config.doors.fills ?? [];
  return Array.from({ length: doorSlots(config) }, (_, i) => (isDoorFill(fills[i]) ? fills[i] : base));
}

export const hasMirror = (config: DoorShape): boolean => doorFills(config).includes("OGLINDA");
export const hasGlass = (config: DoorShape): boolean => doorFills(config).includes("STICLA");

/**
 * The doors written the way every CRM version understands them: the same face on every door is the
 * classic type (GLISANTE_OGLINDA…) with no `fills`; mixed faces are the plain type + `fills`. The mirror /
 * glass ids stay only while a door has that face. Returns `doors` itself when nothing changes.
 */
export function normalizeDoors(config: DoorShape, faces?: DoorFill[]): AtelierDoors {
  const { doors } = config;
  const opening = doorOpening(doors.type);
  if (opening === "NONE") {
    return doors.type === "NONE" && Object.keys(doors).length === 1 ? doors : { type: "NONE" };
  }
  const slots = doorSlots(config);
  const current = doorFills(config);
  const fills = Array.from({ length: slots }, (_, i) => {
    const f = faces?.[i];
    return isDoorFill(f) ? f : faces ? "PANOU" : current[i];
  });
  const uniform = fills.every((f) => f === fills[0]);
  const next: AtelierDoors = { type: doorType(opening, uniform ? (fills[0] ?? "PANOU") : "PANOU") };
  if (opening === "GLISANTE" && doors.count !== undefined) next.count = doors.count;
  if (!uniform) next.fills = fills;
  if (doors.mirrorId && fills.includes("OGLINDA")) next.mirrorId = doors.mirrorId;
  if (doors.glassId && fills.includes("STICLA")) next.glassId = doors.glassId;
  return JSON.stringify(next) === JSON.stringify(doors) ? doors : next;
}

/** „Una da, una nu": mirror on every other door, starting with the first. */
export function alternateFills(slots: number): DoorFill[] {
  return Array.from({ length: slots }, (_, i) => (i % 2 === 0 ? "OGLINDA" : "PANOU"));
}

/** The mirror / glass shown as chosen: the client's, else the first in the catalog. */
export function currentGlass(list: AtelierGlass[] | undefined, id: string | undefined): AtelierGlass | null {
  if (!list || list.length === 0) return null;
  return list.find((g) => g.id === id) ?? list[0];
}

/**
 * The ids to write so that what is shown as chosen is also what gets priced: a mirror door without a
 * mirror type takes the first one in the catalog (same for glass); ids the catalog no longer has are
 * replaced. Empty when the catalog has no types (older CRM) or nothing is missing.
 */
export function missingGlassIds(config: DoorShape, catalog: Pick<AtelierCatalog, "glass">): { mirrorId?: string; glassId?: string } {
  const out: { mirrorId?: string; glassId?: string } = {};
  const glass = catalog.glass;
  if (!glass) return out;
  const { mirrorId, glassId } = config.doors;
  if (hasMirror(config) && glass.mirrors.length > 0 && !glass.mirrors.some((g) => g.id === mirrorId)) out.mirrorId = glass.mirrors[0].id;
  if (hasGlass(config) && glass.glasses.length > 0 && !glass.glasses.some((g) => g.id === glassId)) out.glassId = glass.glasses[0].id;
  return out;
}

/** „Uși glisante: 2 cu oglindă, 1 în culoarea fronturilor" — the doors in plain words. */
export function doorsSummary(config: DoorShape): string | null {
  if (config.category !== "DRESSING") return null;
  const opening = doorOpening(config.doors.type);
  if (opening === "NONE") return "Fără uși";
  const kind = opening === "GLISANTE" ? "Uși glisante" : "Uși batante";
  const fills = doorFills(config);
  const count = (f: DoorFill) => fills.filter((x) => x === f).length;
  const [mirror, glass, panel] = [count("OGLINDA"), count("STICLA"), count("PANOU")];
  if (mirror === fills.length) return `${kind} cu oglindă`;
  if (glass === fills.length) return `${kind} cu sticlă`;
  if (panel === fills.length) return kind;
  const parts = [
    mirror ? `${mirror} cu oglindă` : "",
    glass ? `${glass} cu sticlă` : "",
    panel ? `${panel} în culoarea fronturilor` : "",
  ].filter(Boolean);
  return `${kind}: ${parts.join(", ")}`;
}
