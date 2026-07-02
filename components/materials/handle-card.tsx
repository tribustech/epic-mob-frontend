import Image from "next/image";
import type { Handle } from "@/lib/handle-data";
import { HandleProfile } from "./handle-profile";

// A "Mânere" card — informational. Shows a product photo when one is provided,
// otherwise falls back to the profile drawing. Reuses the hardware-card shell.
export function HandleCard({ item }: { item: Handle }) {
  return (
    <article className="hardware-card" style={{ ["--mat-accent" as string]: item.accent }}>
      {item.image ? (
        <span className="hardware-card__media">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="hardware-card__img"
          />
        </span>
      ) : (
        <span className="hardware-card__media hardware-card__media--profile">
          <span className="handle-profile-wrap" style={{ color: item.accent }}>
            <HandleProfile type={item.profile} />
          </span>
        </span>
      )}

      <div className="hardware-card__body">
        <div className="hardware-card__head">
          <span className="hardware-card__kind">Mâner</span>
        </div>
        <h3 className="hardware-card__name">{item.name}</h3>
        <p className="hardware-card__desc">{item.description}</p>
      </div>
    </article>
  );
}
