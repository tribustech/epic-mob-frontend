"use client";

import type { ReactNode } from "react";
import { WizardFooterBar } from "./wizard-footer-bar";

type WizardStepProps = {
  eyebrow?: string;
  question: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function WizardStep({ eyebrow, question, description, children, footer }: WizardStepProps) {
  return (
    <div className="flex flex-col">
      {eyebrow ? <p className="eyebrow-warm">{eyebrow}</p> : null}
      <h2 className="display-font mt-4 text-[clamp(1.9rem,4vw,3rem)] leading-[1.08] text-espresso">
        {question}
      </h2>
      {description ? (
        <p className="mt-4 max-w-xl text-lg leading-8 text-espresso/60">{description}</p>
      ) : null}

      <div className="mt-9">{children}</div>

      {footer ? (
        <>
          {/* Spacer so the last content clears the fixed bar. */}
          <div className="h-24" aria-hidden />
          <WizardFooterBar>{footer}</WizardFooterBar>
        </>
      ) : null}
    </div>
  );
}
