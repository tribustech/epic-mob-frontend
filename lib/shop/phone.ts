/**
 * The Romanian phone rule of the shop order form, the same in the basket (under the field) and in the order
 * route (400): a mobile number, 10 digits starting with 07, also written as +40 7… or 0040 7…. Spaces, dots,
 * dashes, slashes and brackets are allowed between the digits.
 */

/** „+40 (0)712 345 678" / „0040 712 345 678" / „0712.345.678" → „0712345678"; null when other characters are in it. */
export function normalizeRoPhone(input: string): string | null {
  const raw = input.trim();
  if (!/^\+?[\d\s().\-/]*$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || digits.startsWith("0040")) {
    if (raw.startsWith("+")) {
      if (!digits.startsWith("40")) return digits; // another country: fails the 07 check
      digits = digits.slice(2);
    } else digits = digits.slice(4);
    // „+40 (0)712…" carries the trunk 0 too
    digits = digits.startsWith("0") ? digits : `0${digits}`;
  }
  return digits;
}

/** The message for a phone that does not pass the rule, or null when it is fine. */
export function phoneProblem(input: string): string | null {
  const raw = input.trim();
  if (raw === "") return "Scrie numărul de telefon pe care te putem suna.";
  const digits = normalizeRoPhone(raw);
  if (digits === null) return "Numărul de telefon poate avea doar cifre (și + la început). Exemplu: 0712 345 678.";
  if (!digits.startsWith("07")) return "Scrie un număr de mobil din România, care începe cu 07 (sau +40 7).";
  if (digits.length < 10) return "Numărul are prea puține cifre. Un număr de mobil are 10 cifre, de exemplu 0712 345 678.";
  if (digits.length > 10) return "Numărul are prea multe cifre. Un număr de mobil are 10 cifre, de exemplu 0712 345 678.";
  return null;
}
