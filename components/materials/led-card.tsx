import type { Led } from "@/lib/led-data";
import { LedProfile } from "./led-profile";

// An "Iluminat LED" card — informational, with a profile drawing (control type).
// Reuses the hardware-card shell for visual consistency.
export function LedCard({ item }: { item: Led }) {
  return (
    <article className="hardware-card" style={{ ["--mat-accent" as string]: item.accent }}>
      <span className="hardware-card__media hardware-card__media--profile">
        <span className="handle-profile-wrap" style={{ color: item.accent }}>
          <LedProfile type={item.profile} />
        </span>
      </span>

      <div className="hardware-card__body">
        <div className="hardware-card__head">
          <span className="hardware-card__kind">Comandă</span>
        </div>
        <h3 className="hardware-card__name">{item.name}</h3>
        <p className="hardware-card__desc">{item.description}</p>
      </div>
    </article>
  );
}
