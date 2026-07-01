import { Check, Minus } from "lucide-react";
import type { Material } from "@/lib/materials-data";

// Honest pros / cons for a material — the "plusuri și minusuri" the client asked
// for. Shared by the /materiale hub and the per-material articles.
export function MaterialVerdict({ material }: { material: Material }) {
  return (
    <div className="material-verdict">
      <div className="material-verdict__col">
        <p className="material-verdict__head material-verdict__head--pro">
          <Check size={15} strokeWidth={2.5} />
          Avantaje
        </p>
        <ul className="material-verdict__list">
          {material.pros.map((pro) => (
            <li key={pro} className="material-verdict__item">
              <span className="material-verdict__mark material-verdict__mark--pro">
                <Check size={12} strokeWidth={3} />
              </span>
              {pro}
            </li>
          ))}
        </ul>
      </div>

      <div className="material-verdict__col">
        <p className="material-verdict__head material-verdict__head--con">
          <Minus size={15} strokeWidth={2.5} />
          De luat în calcul
        </p>
        <ul className="material-verdict__list">
          {material.cons.map((con) => (
            <li key={con} className="material-verdict__item">
              <span className="material-verdict__mark material-verdict__mark--con">
                <Minus size={12} strokeWidth={3} />
              </span>
              {con}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
