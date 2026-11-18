import type { DoorType } from "./types";

/** The doors panel asks two things: how the doors open, then what their face is. */
export type DoorOpening = "NONE" | "BATANTE" | "GLISANTE";
export type DoorFace = "PANOU" | "OGLINDA" | "STICLA";

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
