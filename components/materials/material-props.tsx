import type { Material } from "@/lib/materials-data";
import { MaterialIcon } from "./material-icons";

// The icon row from the infographic — a material's headline strengths.
export function MaterialProps({ material }: { material: Material }) {
  return (
    <div className="material-props">
      {material.properties.map((prop) => (
        <div key={prop.label} className="material-props__item">
          <span
            className="material-props__icon"
            style={{ background: material.accentSoft, color: material.accent }}
          >
            <MaterialIcon name={prop.icon} size={20} strokeWidth={1.6} />
          </span>
          <span className="material-props__label">{prop.label}</span>
        </div>
      ))}
    </div>
  );
}
