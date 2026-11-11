import Link from "next/link";

const CATEGORIES = [
  { id: "DRESSING", label: "Dressing & depozitare", active: true },
  { id: "COMODE", label: "Comode & noptiere", active: false },
  { id: "SEPARATOARE", label: "Separatoare cameră", active: false },
  { id: "SUSPENDATE", label: "Corpuri suspendate", active: false },
] as const;

export function CategoryPicker() {
  return (
    <section className="atelier-panel" aria-labelledby="atelier-category">
      <h2 id="atelier-category" className="atelier-panel__title">
        Ce construim?
      </h2>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Categorie">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.active}
            disabled={!c.active}
            className="atelier-chip"
          >
            {c.label}
            {!c.active && (
              <span className="rounded-full bg-[var(--home-ivory)]/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em]">
                În curând
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-[var(--home-ivory)]/65">
        Bucătărie sau altceva?{" "}
        <Link href="/cere-oferta" className="atelier-link">
          Cere ofertă
        </Link>
      </p>
    </section>
  );
}
