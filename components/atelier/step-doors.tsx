"use client";

import { categoryRules } from "@/lib/atelier/categories";
import { doorFills, doorOpening, doorType } from "@/lib/atelier/door-types";
import { hasHandledFronts } from "@/lib/atelier/handles";
import type { AtelierCatalog, AtelierConfig } from "@/lib/atelier/types";
import { DoorsPanel } from "./doors-panel";
import { HandlePicker } from "./handle-picker";
import type { MaterialLook } from "./material-look";
import type { Act } from "./session";
import { Section } from "./ui";

/**
 * „Uși și mânere": everything that is on the outside of the furniture. A dressing chooses its doors
 * (how they open, mirror / glass per door) and, for hinged doors, the handles; a comodă, a wall
 * cabinet or a separator with a closed bottom chooses only the handles. The 3D view keeps the doors
 * closed here, so every tap is seen.
 */
export function StepDoors({
  catalog,
  config,
  act,
  front,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  act: Act;
  /** the look of the fronts (the door chips are drawn with it; a painted handle starts from it) */
  front: MaterialLook;
}) {
  const dressing = categoryRules(config.category).slidingDoors;
  const handled = hasHandledFronts(config);
  const opening = doorOpening(config.doors.type);
  const canHinge = (catalog.handles?.types ?? []).length > 0;
  // the same face on every door carries over to the hinged doors; a mix starts again from plain doors
  const fills = doorFills(config);
  const face = fills.length > 0 && fills.every((f) => f === fills[0]) ? fills[0] : "PANOU";

  return (
    <div className="atelier-stack">
      {dressing && <DoorsPanel catalog={catalog} config={config} act={act} front={front} />}
      {handled && <HandlePicker catalog={catalog} config={config} act={act} front={front} />}
      {dressing && !handled && (
        <Section title="Mânere" anchor="manere">
          <div className="atelier-box atelier-nohandles">
            <p>{opening === "GLISANTE" ? "Ușile glisante nu au mânere: le împingi ușor cu mâna." : "Un dulap fără uși nu are mânere."}</p>
            {canHinge && (
              <button
                type="button"
                className="atelier-chip"
                onClick={() =>
                  act({ type: "setDoors", doors: { type: doorType("BATANTE", face), mirrorId: config.doors.mirrorId, glassId: config.doors.glassId } })
                }
              >
                Vreau uși cu mânere
              </button>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
