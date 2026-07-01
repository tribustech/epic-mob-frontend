import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Material } from "@/lib/materials-data";

// A "Lemn" card on the /materiale index — links to the material's dedicated page.
export function MaterialCard({ material }: { material: Material }) {
  return (
    <Link
      href={`/materiale/${material.slug}`}
      className="material-card"
      style={{ ["--mat-accent" as string]: material.accent }}
    >
      <span className="material-card__media">
        <Image
          src={material.heroImage}
          alt={`${material.name} — ${material.tagline}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="material-card__img"
        />
        <span className="material-card__swatch" style={{ background: material.accent }} />
      </span>

      <span className="material-card__body">
        <span className="material-card__name">{material.name}</span>
        <span className="material-card__tagline">{material.tagline}</span>

        <span className="material-card__pros">
          {material.pros.slice(0, 2).map((pro) => (
            <span key={pro} className="material-card__pro">
              <Check size={13} strokeWidth={3} style={{ color: material.accent }} />
              {pro}
            </span>
          ))}
        </span>

        <span className="material-card__more" style={{ color: material.accent }}>
          Vezi detalii
          <ArrowRight size={16} strokeWidth={2} />
        </span>
      </span>
    </Link>
  );
}
