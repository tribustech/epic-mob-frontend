/**
 * A length typed by a client → millimetres (null when it is not a number). Centimetres by default:
 * „240", „240,5", „240 cm", „2,4 m", „2400 mm". A bare decimal under 10 („2,4", „1.8") can only mean metres
 * (nobody types 2,4 cm for a piece of furniture), so it is read as metres. A bare whole number stays in
 * centimetres, even a small one: „5" is 5 cm, which the control then raises to its minimum with the
 * „între … și … cm" note, instead of silently turning it into 5 m.
 */
export function parseCm(text: string): number | null {
  const match = /^([0-9]+(?:[.,][0-9]*)?|[.,][0-9]+)\s*(cm|mm|m)?\.?$/i.exec(text.trim());
  if (!match) return null;
  const v = Number(match[1].replace(",", "."));
  if (!Number.isFinite(v)) return null;
  const decimal = /[.,][0-9]/.test(match[1]);
  const unit = (match[2] ?? (decimal && v > 0 && v < 10 ? "m" : "cm")).toLowerCase();
  return Math.round(unit === "m" ? v * 1000 : unit === "mm" ? v : v * 10);
}
