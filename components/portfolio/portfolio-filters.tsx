"use client";

import { useEffect, useState } from "react";
import type { ProjectCategory } from "@/lib/portfolio-data";

type FilterValue = "toate" | ProjectCategory;

const CHIPS: { value: FilterValue; label: string }[] = [
  { value: "toate", label: "Toate" },
  { value: "bucatarie", label: "Bucatarie" },
  { value: "dressing", label: "Dressing" },
  { value: "baie", label: "Baie" },
  { value: "detaliu", label: "Detaliu" },
];

type PortfolioFiltersProps = {
  totalShown: number;
  totalProjects: number;
};

export function PortfolioFilters({
  totalShown,
  totalProjects,
}: PortfolioFiltersProps) {
  const [active, setActive] = useState<FilterValue>("toate");
  const [visibleCount, setVisibleCount] = useState(totalShown);

  useEffect(() => {
    const scenes = document.querySelectorAll<HTMLElement>("[data-category]");
    let visible = 0;
    scenes.forEach((scene) => {
      const matches =
        active === "toate" || scene.dataset.category === active;
      scene.hidden = !matches;
      if (matches) visible += 1;
    });
    setVisibleCount(visible);
  }, [active]);

  return (
    <div className="portfolio-filters">
      <div className="portfolio-shell">
        <div className="portfolio-filters__row">
          <div className="portfolio-filters__group">
            <span className="portfolio-filters__group-label">Camere</span>
            {CHIPS.map((chip) => {
              const isActive = chip.value === active;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setActive(chip.value)}
                  className={`portfolio-filters__chip${
                    isActive ? " portfolio-filters__chip--active" : ""
                  }`}
                  aria-pressed={isActive}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
          <span className="portfolio-filters__count">
            {visibleCount} / {totalProjects} afisate
          </span>
        </div>
      </div>
    </div>
  );
}
