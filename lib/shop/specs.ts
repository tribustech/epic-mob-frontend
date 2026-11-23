import type { ResolvedPalette } from "@/lib/atelier/palettes";
import type { LayoutPreset } from "@/lib/atelier/presets";
import type { AtelierCatalog, AtelierMaterial } from "@/lib/atelier/types";

/**
 * What a shop product is made of, in plain words (Andrew 2026-11-23: say clearly it is PAL, which
 * slides and hinges, and that „Stejar natur" is only the name of a decor, not solid wood).
 * Only what the CRM prices for these pieces: 18 mm melamine board, Blum hinges and TANDEM slides
 * with soft close, gas struts on lift-up doors.
 */

const decorOf = (m: AtelierMaterial | undefined): string => {
  if (!m) return "";
  const code = [m.brand, m.decorCode].filter(Boolean).join(" ");
  return code ? `, decor ${code}` : "";
};

/** „PAL melaminat 18 mm, decor Egger W1000 ST9" for the body of one colour. */
export function carcassSpec(palette: ResolvedPalette, catalog: AtelierCatalog): string {
  const mdf = catalog.fronts.MDF_MELAMINAT.find((m) => m.id === palette.carcassMaterialId);
  const m = mdf ?? catalog.carcass.find((x) => x.id === palette.carcassMaterialId);
  return `${mdf ? "MDF melaminat" : "PAL melaminat"} 18 mm${decorOf(m)}`;
}

/** The doors / drawer fronts of one colour. */
export function frontSpec(palette: ResolvedPalette, catalog: AtelierCatalog): string {
  const f = palette.fronts;
  if (f.kind === "MDF_VOPSIT") return `MDF vopsit${f.ralCode ? ` ${f.ralCode}` : ""}, mat`;
  const list = f.kind === "MDF_MELAMINAT" ? catalog.fronts.MDF_MELAMINAT : catalog.fronts.PAL;
  const m = list.find((x) => x.id === f.materialId) ?? catalog.carcass.find((x) => x.id === f.materialId);
  return `${f.kind === "MDF_MELAMINAT" ? "MDF melaminat" : "PAL melaminat"} 18 mm${decorOf(m)}`;
}

const json = (preset: LayoutPreset) => JSON.stringify(preset.shape);

/** The hardware and construction, the same for every colour of the product. */
export function constructionSpec(preset: LayoutPreset): string[] {
  const s = preset.shape;
  const all = json(preset);
  const out: string[] = [];
  out.push("Cant ABS pe toate muchiile, în culoarea plăcii");
  if (s.category !== "BUCATARIE" && s.category !== "BAIE") out.push("Spate din PFL (HDF) alb");
  const sliding = s.category === "DRESSING" && s.doors.type.startsWith("GLISANTE");
  const hinged = (s.category === "DRESSING" && s.doors.type.startsWith("BATANTE")) || /"(USI|COLOANA|CHIUVETA|MASINA_VASE)"/.test(all) || s.category === "BUCATARIE";
  if (hinged) out.push("Balamale Blum CLIP top BLUMOTION, cu închidere lină");
  if (sliding) out.push("Sistem de uși glisante pe șine, sus și jos");
  if (/"(SERTARE|BARA_SERTARE|PLITA|LAVOAR)"/.test(all)) {
    out.push("Sertare din PAL pe glisiere Blum TANDEM BLUMOTION (30 kg, închidere lină, extracție completă; parțială la cerere)");
  }
  if (/RIDICAB/.test(all)) out.push("Ușile care se ridică stau deschise pe pistoane cu gaz");
  if (s.category === "BUCATARIE") out.push("Blat Egger de 38 mm, cu muchia în același decor");
  if (s.category === "SUSPENDAT" || ((s.category === "BAIE" || s.category === "COMODA") && s.legsMm === 0)) out.push("Se prinde de perete pe suporți ascunși");
  else if (s.legsMm > 0) out.push(`Picioare reglabile de ${s.legsMm / 10} cm${s.category === "BUCATARIE" ? ", cu plintă" : ""}`);
  return out;
}

/** Why the colour names are decors: said once, plainly. */
export const DECOR_NOTE =
  "Numele culorilor (de ex. „Stejar natur”) sunt decoruri: o suprafață melaminată, rezistentă la zgârieturi și ușor de șters, pe placă de PAL sau MDF. Nu e lemn masiv.";
