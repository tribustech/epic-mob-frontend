"use client";

import { DRAWER_EXTENSION_LABEL, drawerExtensionOf, hasFrontDrawers, partialDrawersAvailable } from "@/lib/atelier/drawers";
import type { AtelierCatalog, AtelierConfig, DrawerExtension } from "@/lib/atelier/types";
import type { Act } from "./session";
import { Choice, Section } from "./ui";

/** Glisierele sertarelor: Blum TANDEM cu extracție completă (implicit) sau parțială, când CRM-ul le are pe amândouă. */
export function DrawerRunners({ catalog, config, act }: { catalog: AtelierCatalog; config: AtelierConfig; act: Act }) {
  if (!hasFrontDrawers(config) || !partialDrawersAvailable(catalog)) return null;
  const options: { value: DrawerExtension; label: string }[] = (["COMPLETA", "PARTIALA"] as const).map((value) => ({
    value,
    label: DRAWER_EXTENSION_LABEL[value],
  }));
  return (
    <Section title="Sertare" hint="Glisiere Blum TANDEM cu închidere lină. La extracția parțială sertarul iese cam trei sferturi, la un preț mai mic.">
      <Choice
        label="Glisiere sertare"
        columns={2}
        options={options}
        value={drawerExtensionOf(config)}
        onChange={(extension) => act({ type: "setDrawerExtension", extension })}
      />
    </Section>
  );
}
