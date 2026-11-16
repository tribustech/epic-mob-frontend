"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { AtelierIssue, AtelierPriceResult } from "@/lib/atelier/types";

const priceFormat = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

export function formatLei(value: number): string {
  return `${priceFormat.format(Math.round(value))} lei`;
}

function IssueList({ issues, tone }: { issues: AtelierIssue[]; tone: "error" | "warning" }) {
  if (issues.length === 0) return null;
  const cls =
    tone === "error"
      ? "border-red-500/40 bg-red-500/10 text-red-700"
      : "border-amber-400/40 bg-amber-400/10 text-amber-800";
  return (
    <ul className={`mt-3 space-y-1 rounded-lg border p-3 text-sm ${cls}`}>
      {issues.map((issue, i) => (
        <li key={`${issue.code}-${i}`}>{issue.message}</li>
      ))}
    </ul>
  );
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Live price. On mobile it is a compact sticky bar (price + status on one line;
 * the label and any errors / warnings fold into a tap-to-expand count) so it never
 * covers the panels or the form. On desktop everything is shown.
 */
export function PriceBar({
  result,
  loading,
  unavailable,
}: {
  result: AtelierPriceResult | null;
  loading: boolean;
  unavailable: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];
  const price = errors.length === 0 ? result?.sellPrice ?? null : null;

  let main: ReactNode;
  if (unavailable) {
    main = <span className="text-base text-[var(--home-ivory)]/80 lg:text-lg">Prețul e momentan indisponibil</span>;
  } else if (price != null) {
    main = (
      <span
        className={`display-font text-[1.75rem] leading-none transition-opacity lg:text-4xl ${loading ? "opacity-50" : ""}`}
      >
        {formatLei(price)}
      </span>
    );
  } else if (errors.length > 0) {
    main = <span className="text-base text-red-700 lg:text-lg">Configurația are nevoie de ajustări</span>;
  } else {
    main = <span className="text-base text-[var(--home-ivory)]/60 lg:text-lg">Se calculează…</span>;
  }

  return (
    <section
      className="atelier-panel !p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.45)] lg:!p-5 lg:shadow-none"
      aria-live="polite"
      aria-labelledby="atelier-price"
    >
      <p id="atelier-price" className="home-kicker hidden lg:block">
        Preț estimativ
      </p>
      <div className="flex min-w-0 items-center gap-3 lg:mt-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
          {main}
          <span className="text-xs text-[var(--home-ivory)]/60 lg:hidden">estimativ</span>
          {loading && !unavailable && (
            <span className="text-xs text-[var(--home-ivory)]/60">se recalculează…</span>
          )}
        </div>
        <button
            type="button"
            className={`atelier-chip shrink-0 !px-3 !py-1.5 text-xs lg:hidden ${
              errors.length > 0
                ? "!border-red-500/60 !text-red-700"
                : warnings.length > 0
                  ? "!border-amber-400/60 !text-amber-800"
                  : ""
            }`}
            aria-expanded={expanded}
            aria-controls="atelier-price-details"
            onClick={() => setExpanded((v) => !v)}
          >
            {errors.length > 0
              ? plural(errors.length, "eroare", "erori")
              : warnings.length > 0
                ? plural(warnings.length, "avertisment", "avertismente")
                : "Detalii"}
            <ChevronDown size={14} aria-hidden="true" className={expanded ? "rotate-180" : ""} />
          </button>
      </div>
      <div
        id="atelier-price-details"
        className={`${expanded ? "block" : "hidden"} max-h-[40vh] overflow-y-auto lg:block lg:max-h-none lg:overflow-visible`}
      >
        <p className="mt-2 text-xs text-[var(--home-ivory)]/60">
          preț estimativ — prețul final se stabilește după măsurători
        </p>
        <IssueList issues={errors} tone="error" />
        <IssueList issues={warnings} tone="warning" />
      </div>
    </section>
  );
}
