"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { AtelierConfig } from "@/lib/atelier/types";
import { STEP_IDS, stepLabel, type StepId } from "./session";

/** The five steps as tabs; on narrow screens the row scrolls and keeps the current step centred. */
export function StepBar({
  step,
  config,
  onStep,
  flagged,
}: {
  step: StepId;
  config: AtelierConfig;
  onStep: (step: StepId) => void;
  /** step that needs attention (the configuration has an error it can fix) */
  flagged: StepId | null;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !tab) return;
    // scroll only the bar itself (scrollIntoView would also move the page)
    const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [step]);

  const move = (dir: 1 | -1) => {
    const next = STEP_IDS[STEP_IDS.indexOf(step) + dir];
    if (!next) return;
    onStep(next);
    requestAnimationFrame(() => document.getElementById(`atelier-tab-${next}`)?.focus());
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Pașii configuratorului"
      className="atelier-steps"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") move(1);
        else if (e.key === "ArrowLeft") move(-1);
      }}
    >
      {STEP_IDS.map((id, i) => {
        const selected = id === step;
        return (
          <button
            key={id}
            id={`atelier-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="atelier-step-panel"
            tabIndex={selected ? 0 : -1}
            className="atelier-steps__tab"
            onClick={() => onStep(id)}
          >
            {selected && (
              <motion.span
                layoutId="atelier-step-pill"
                className="atelier-steps__pill"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <span className="atelier-steps__num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="relative">{stepLabel(id, config)}</span>
            {flagged === id && !selected && (
              <span className="atelier-steps__flag">
                <span className="sr-only">(are nevoie de o ajustare)</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
