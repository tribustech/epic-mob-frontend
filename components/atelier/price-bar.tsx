import type { AtelierIssue, AtelierPriceResult } from "@/lib/atelier/types";

const priceFormat = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

export function formatLei(value: number): string {
  return `${priceFormat.format(Math.round(value))} lei`;
}

function IssueList({ issues, tone }: { issues: AtelierIssue[]; tone: "error" | "warning" }) {
  if (issues.length === 0) return null;
  const cls =
    tone === "error"
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : "border-amber-400/40 bg-amber-400/10 text-amber-200";
  return (
    <ul className={`mt-3 space-y-1 rounded-lg border p-3 text-sm ${cls}`} role={tone === "error" ? "alert" : undefined}>
      {issues.map((issue, i) => (
        <li key={`${issue.code}-${i}`}>{issue.message}</li>
      ))}
    </ul>
  );
}

export function PriceBar({
  result,
  loading,
  unavailable,
}: {
  result: AtelierPriceResult | null;
  loading: boolean;
  unavailable: boolean;
}) {
  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];
  const price = errors.length === 0 ? result?.sellPrice ?? null : null;

  return (
    <section className="atelier-panel" aria-live="polite" aria-labelledby="atelier-price">
      <p id="atelier-price" className="home-kicker">
        Preț estimativ
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {unavailable ? (
          <p className="text-lg text-[var(--home-ivory)]/80">Prețul e momentan indisponibil</p>
        ) : price != null ? (
          <p className={`display-font text-4xl leading-none transition-opacity ${loading ? "opacity-50" : ""}`}>
            {formatLei(price)}
          </p>
        ) : errors.length > 0 ? (
          <p className="text-lg text-red-300">Configurația are nevoie de ajustări</p>
        ) : (
          <p className="text-lg text-[var(--home-ivory)]/60">Se calculează…</p>
        )}
        {loading && !unavailable && (
          <span className="text-xs text-[var(--home-ivory)]/50">se recalculează…</span>
        )}
      </div>
      <p className="mt-2 text-xs text-[var(--home-ivory)]/55">
        preț estimativ — prețul final se stabilește după măsurători
      </p>
      <IssueList issues={errors} tone="error" />
      <IssueList issues={warnings} tone="warning" />
    </section>
  );
}
