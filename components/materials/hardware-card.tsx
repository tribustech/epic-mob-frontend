import Image from "next/image";
import type { Hardware } from "@/lib/hardware-data";
import { MaterialIcon } from "./material-icons";

// A "Feronerie" card — informational (no dedicated page). Shows a product photo
// if one is provided, otherwise a premium icon treatment.
export function HardwareCard({ item }: { item: Hardware }) {
  return (
    <article className="hardware-card" style={{ ["--mat-accent" as string]: item.accent }}>
      <span className="hardware-card__media">
        {item.image ? (
          <Image
            src={item.image}
            alt={`${item.brand} ${item.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="hardware-card__img"
          />
        ) : (
          <span className="hardware-card__icon" aria-hidden="true">
            <MaterialIcon name={item.icon} size={30} strokeWidth={1.5} />
          </span>
        )}
      </span>

      <div className="hardware-card__body">
        <div className="hardware-card__head">
          <span className="hardware-card__kind">{item.kind}</span>
          <span className="hardware-card__brand">{item.brand}</span>
        </div>
        <h3 className="hardware-card__name">{item.name}</h3>
        <p className="hardware-card__desc">{item.description}</p>
      </div>
    </article>
  );
}
