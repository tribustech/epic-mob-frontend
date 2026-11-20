"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, MessageCircle } from "lucide-react";
import { shareUrl } from "@/lib/atelier/share";
import type { AtelierCategory, AtelierConfig } from "@/lib/atelier/types";
import { contactDetails } from "@/lib/site-data";
import { Section, cm, formatLei } from "./ui";

const WHAT: Record<AtelierCategory, string> = {
  DRESSING: "dressing",
  COMODA: "comodă",
  SEPARATOR: "separator de cameră",
  SUSPENDAT: "corp suspendat",
};

/** The short Romanian message that opens the WhatsApp chat with the workshop. */
export function whatsappText(config: AtelierConfig, price: number | null, link: string): string {
  const what = WHAT[config.category] ?? "mobilier";
  const size = `${cm(config.widthMm)} × ${cm(config.heightMm)} × ${cm(config.depthMm)} cm`;
  const estimate = price != null ? `, preț estimativ ${formatLei(price)}` : "";
  return `Bună ziua! Am făcut o configurație pe site (${what}, ${size}${estimate}) și aș vrea să o discutăm: ${link}`;
}

/**
 * „Arată-i cuiva configurația": a link that reopens exactly this configuration, to copy or to send
 * straight to the workshop on WhatsApp.
 */
export function ShareBlock({ config, price }: { config: AtelierConfig; price: number | null }) {
  const [copied, setCopied] = useState(false);
  /** shown only when the browser would not copy: the link itself, selected, to copy by hand */
  const [manual, setManual] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const field = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (manual) field.current?.select();
  }, [manual]);
  // a link shown for one configuration must not linger after the configuration changes
  const configKey = JSON.stringify(config);
  const [shownFor, setShownFor] = useState(configKey);
  if (shownFor !== configKey) {
    setShownFor(configKey);
    setCopied(false);
    setManual(null);
  }

  const link = () => shareUrl(window.location.origin, config);

  const copy = async () => {
    const url = link();
    try {
      await navigator.clipboard.writeText(url);
      setManual(null);
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setManual(url);
    }
  };

  const whatsappHref = () => `${contactDetails.whatsapp}?text=${encodeURIComponent(whatsappText(config, price, link()))}`;

  return (
    <Section
      title="Arată-i cuiva configurația"
      hint="Linkul deschide exact ce ai făcut aici. Îl poți trimite și ție, pentru mai târziu."
    >
      <div className="atelier-share">
        <div className="atelier-share__actions">
          <button type="button" className="atelier-share__btn" onClick={copy}>
            {copied ? <Check size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
            <span aria-live="polite">{copied ? "Link copiat" : "Copiază linkul"}</span>
          </button>
          {/* a real link (opens the app on phones); the message with the configuration is filled in at the tap */}
          <a
            className="atelier-share__btn atelier-share__btn--wa"
            href={contactDetails.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.currentTarget.href = whatsappHref();
            }}
          >
            <MessageCircle size={18} aria-hidden="true" />
            Discută configurația pe WhatsApp
          </a>
        </div>
        {manual && (
          <input
            ref={field}
            className="atelier-input atelier-share__link"
            readOnly
            value={manual}
            aria-label="Linkul configurației (copiază-l de aici)"
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
      </div>
    </Section>
  );
}
