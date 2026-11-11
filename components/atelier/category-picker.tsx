"use client";

import Link from "next/link";
import type { Dispatch } from "react";
import { CATEGORY_ORDER, categoryRules } from "@/lib/atelier/categories";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierCategory } from "@/lib/atelier/types";

export function CategoryPicker({
  category,
  dispatch,
}: {
  category: AtelierCategory;
  dispatch: Dispatch<AtelierAction>;
}) {
  return (
    <section className="atelier-panel" aria-labelledby="atelier-category">
      <h2 id="atelier-category" className="atelier-panel__title">
        Ce construim?
      </h2>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Categorie">
        {CATEGORY_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={category === id}
            className="atelier-chip"
            onClick={() => dispatch({ type: "setCategory", category: id })}
          >
            {categoryRules(id).label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-[var(--home-ivory)]/75">{categoryRules(category).intro}</p>
      <p className="mt-2 text-sm text-[var(--home-ivory)]/65">
        Bucătărie sau altceva?{" "}
        <Link href="/cere-oferta" className="atelier-link">
          Cere ofertă
        </Link>
      </p>
    </section>
  );
}
