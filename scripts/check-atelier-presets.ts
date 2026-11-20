/**
 * Prices every layout preset in the CRM and fails if one comes back with errors, warnings or without a
 * 3D scene. Also lists palettes that do not resolve against the live catalog.
 *
 *   CRM_API_URL=http://localhost:4010 ATELIER_API_KEY=dev npx tsx scripts/check-atelier-presets.ts
 *
 * (reads .env.local when the variables are not set)
 */
import { readFileSync } from "node:fs";
import { COMBO_PRESETS, LAYOUT_PRESETS } from "../lib/atelier/presets";
import { PALETTES, resolvePalettes } from "../lib/atelier/palettes";
import type { AtelierCatalog, AtelierConfig, AtelierPriceResult } from "../lib/atelier/types";

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {}

const base = (process.env.CRM_API_URL ?? "").replace(/\/+$/, "");
const headers = { "x-atelier-key": process.env.ATELIER_API_KEY ?? "", "content-type": "application/json" };

async function price(config: AtelierConfig): Promise<AtelierPriceResult> {
  const res = await fetch(`${base}/api/atelier/price`, { method: "POST", headers, body: JSON.stringify(config) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as AtelierPriceResult;
}

async function main() {
  const catalog = (await (await fetch(`${base}/api/atelier/catalog`, { headers })).json()) as AtelierCatalog;
  const palettes = resolvePalettes(catalog);
  const byId = new Map(palettes.map((p) => [p.id, p]));
  const unresolved = PALETTES.filter((p) => !byId.has(p.id)).map((p) => p.id);
  console.log(`palettes: ${palettes.length}/${PALETTES.length} resolve${unresolved.length ? ` (missing: ${unresolved.join(", ")})` : ""}`);

  let failed = 0;
  const check = async (label: string, presetId: string, paletteId: string | undefined) => {
    const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
    const palette = (paletteId && byId.get(paletteId)) || palettes[0];
    if (!preset || !palette) {
      failed++;
      console.log(`FAIL ${label}: missing preset / palette`);
      return;
    }
    if (paletteId && palette.id !== paletteId) console.log(`note ${label}: palette ${paletteId} unresolved, using ${palette.id}`);
    try {
      const r = await price({ ...preset.shape, carcassMaterialId: palette.carcassMaterialId, fronts: palette.fronts });
      // a preset must not open with a warning either (e.g. „polița e lungă")
      const ok = r.errors.length === 0 && r.warnings.length === 0 && r.scene !== null && r.sellPrice !== null;
      if (!ok) failed++;
      const warn = r.warnings.length ? `  warnings: ${r.warnings.map((w) => w.message).join(" | ")}` : "";
      console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(44)} ${String(r.sellPrice === null ? "-" : Math.round(r.sellPrice)).padStart(6)}${warn}`);
      for (const e of r.errors) console.log(`       ${e.code}: ${e.message}`);
    } catch (error) {
      failed++;
      console.log(`FAIL ${label}: ${error instanceof Error ? error.message : error}`);
    }
  };

  for (const p of LAYOUT_PRESETS) await check(p.id, p.id, p.paletteId);
  for (const c of COMBO_PRESETS) await check(`combo ${c.id}`, c.presetId, c.paletteId);
  // every palette prices too (on a preset with hinged fronts)
  for (const p of palettes) await check(`palette ${p.id}`, "dressing-hol-120", p.id);

  console.log(failed ? `\n${failed} FAILED` : `\nall ${LAYOUT_PRESETS.length} presets, ${COMBO_PRESETS.length} combos and ${palettes.length} palettes price without errors`);
  process.exit(failed ? 1 : 0);
}

main();
