import { Check, TriangleAlert, X } from "lucide-react";
import {
  placementZones,
  type Material,
  type PlacementVerdict,
} from "@/lib/materials-data";
import { MaterialIcon } from "./material-icons";

// Metadata for the three verdict levels, shared by the full section and the
// compact card row. Colours map to the warm theme's semantic tokens.
const VERDICT: Record<
  PlacementVerdict,
  { label: string; Icon: typeof Check; tone: string }
> = {
  recomandat: { label: "Recomandat", Icon: Check, tone: "ok" },
  atentie: { label: "Cu atenție", Icon: TriangleAlert, tone: "warn" },
  evita: { label: "De evitat", Icon: X, tone: "avoid" },
};

// Full "Unde se potrivește" section — one row per zone with a verdict badge and
// the "de ce". Used on the per-material article page.
export function MaterialPlacement({ material }: { material: Material }) {
  return (
    <ul className="placement">
      {placementZones.map((zone) => {
        const rating = material.placement[zone.key];
        if (!rating) return null;
        const v = VERDICT[rating.verdict];
        return (
          <li
            key={zone.key}
            className="placement__row"
            data-verdict={rating.verdict}
          >
            <span className="placement__zone">
              <span className="placement__zone-icon">
                <MaterialIcon name={zone.icon} size={19} strokeWidth={1.7} />
              </span>
              <span className="placement__zone-label">{zone.label}</span>
            </span>

            <span className={`placement__badge placement__badge--${v.tone}`}>
              <v.Icon size={13} strokeWidth={2.6} />
              {v.label}
            </span>

            {rating.note ? (
              <span className="placement__note">{rating.note}</span>
            ) : (
              <span className="placement__note placement__note--muted">
                Fără restricții în această zonă.
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
