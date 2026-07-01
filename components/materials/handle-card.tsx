import type { Handle } from "@/lib/handle-data";
import { HandleProfile } from "./handle-profile";

// A "Mânere" card — informational, with a profile drawing instead of a photo.
// Reuses the hardware-card shell for visual consistency.
export function HandleCard({ item }: { item: Handle }) {
  return (
    <article className="hardware-card" style={{ ["--mat-accent" as string]: item.accent }}>
      <span className="hardware-card__media hardware-card__media--profile">
        <span className="handle-profile-wrap" style={{ color: item.accent }}>
          <HandleProfile type={item.profile} />
        </span>
      </span>

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
