"use client";

import { ArrowLeftRight, ArrowUpDown, MoveDiagonal } from "lucide-react";
import type { ReactNode } from "react";
import { categoryRules } from "@/lib/atelier/categories";
import type { AtelierCategory, AtelierConfig } from "@/lib/atelier/types";
import type { Act } from "./session";
import { Choice, LengthControl, Section, cm } from "./ui";

/** Common widths per category (mm), offered as one-tap chips. */
const QUICK_WIDTHS: Record<AtelierCategory, number[]> = {
  DRESSING: [1600, 2000, 2400, 3000, 3600],
  COMODA: [800, 1200, 1600, 2000],
  SEPARATOR: [900, 1200, 1600, 2000],
  SUSPENDAT: [600, 900, 1200, 1800],
};

function SizeCard({
  icon,
  label,
  range,
  children,
}: {
  icon: ReactNode;
  label: string;
  range: readonly [number, number];
  children: ReactNode;
}) {
  return (
    <div className="atelier-box">
      <div className="atelier-size__head">
        <span className="atelier-size__icon" aria-hidden="true">
          {icon}
        </span>
        <h3 className="atelier-box__title">{label}</h3>
        <p className="atelier-hint ml-auto">
          {cm(range[0])}–{cm(range[1])} cm
        </p>
      </div>
      {children}
    </div>
  );
}

export function StepSize({ config, act }: { config: AtelierConfig; act: Act }) {
  const rules = categoryRules(config.category);
  const legOptions = rules.legs.filter((l) => l > 0);
  // Different categories have different limits: remount the fields so no half-typed draft survives a switch.
  const k = config.category;
  const quick = QUICK_WIDTHS[k].filter((w) => w >= rules.width[0] && w <= rules.width[1]);

  return (
    <div className="atelier-stack">
      <Section title="Dimensiuni" hint={`${rules.sizeHint} Aproximativ e de ajuns — măsurăm noi exact înainte de execuție.`}>
        <div className="space-y-3">
          <SizeCard icon={<ArrowLeftRight size={16} />} label="Lățime" range={rules.width}>
            <LengthControl
              key={`w-${k}`}
              id="atelier-width"
              label="Lățime"
              valueMm={config.widthMm}
              minMm={rules.width[0]}
              maxMm={rules.width[1]}
              slider
              onCommit={(widthMm) => act({ type: "setSize", widthMm })}
            />
            <div className="atelier-scrollrow atelier-scrollrow--wrap mt-3" role="group" aria-label="Lățimi uzuale">
              {quick.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="atelier-chip atelier-chip--sm"
                  aria-pressed={config.widthMm === w}
                  onClick={() => act({ type: "setSize", widthMm: w })}
                >
                  {cm(w)} cm
                </button>
              ))}
            </div>
          </SizeCard>
          <SizeCard icon={<ArrowUpDown size={16} />} label="Înălțime" range={rules.height}>
            <LengthControl
              key={`h-${k}`}
              id="atelier-height"
              label="Înălțime"
              valueMm={config.heightMm}
              minMm={rules.height[0]}
              maxMm={rules.height[1]}
              slider
              onCommit={(heightMm) => act({ type: "setSize", heightMm })}
            />
          </SizeCard>
          <SizeCard icon={<MoveDiagonal size={16} />} label="Adâncime" range={rules.depth}>
            <LengthControl
              key={`d-${k}`}
              id="atelier-depth"
              label="Adâncime"
              valueMm={config.depthMm}
              minMm={rules.depth[0]}
              maxMm={rules.depth[1]}
              slider
              onCommit={(depthMm) => act({ type: "setSize", depthMm })}
            />
          </SizeCard>
        </div>
      </Section>

      {legOptions.length > 0 && (
        <Section title="Picioare" hint="Înălțimea soclului de sub corp, inclusă în înălțimea totală.">
          <Choice
            label="Înălțime picioare"
            value={config.legsMm}
            options={legOptions.map((legsMm) => ({ value: legsMm, label: `${cm(legsMm)} cm` }))}
            onChange={(legsMm) => act({ type: "setLegs", legsMm })}
          />
        </Section>
      )}
    </div>
  );
}
