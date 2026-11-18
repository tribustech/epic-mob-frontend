import type { AtelierCategory, AtelierConfig, HandleKind } from "./types";

/** Contents whose fronts carry a handle in comode / corpuri suspendate. */
const FRONT_CONTENTS = new Set(["SERTARE", "USI", "USA_RIDICABILA"]);

/** The handle the CRM uses when the client picks none (CRM effectiveHandle): push on comode and
 *  wall cabinets, an applied handle on a hinged-door wardrobe. null = no handled fronts. */
export function categoryDefaultHandle(category: AtelierCategory): HandleKind | null {
  if (category === "COMODA" || category === "SUSPENDAT") return "PUSH";
  return "APLICAT"; // dressing with hinged doors, separator with a closed bottom
}

/** Does this configuration have fronts whose handle the client can choose? */
export function hasHandledFronts(config: AtelierConfig): boolean {
  if (config.category === "DRESSING") return config.doors.type === "BATANTE";
  if (config.category === "SEPARATOR") return !!config.bottom && config.bottom.type !== "NONE";
  if (config.category === "COMODA" || config.category === "SUSPENDAT")
    return config.columns.some((c) => FRONT_CONTENTS.has(c.content));
  return false;
}

/** The handle shown as selected: the client's choice, else the category default. */
export function currentHandle(config: AtelierConfig): HandleKind | null {
  return config.handle?.type ?? categoryDefaultHandle(config.category);
}
