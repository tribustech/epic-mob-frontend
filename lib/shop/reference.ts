/**
 * The short order reference shown to the client after „Trimite comanda" and put in the owner's email:
 * the end of the CRM quote id when the CRM saved the order, else a code from the time it was sent.
 */
export function orderReference(crmIds: readonly (string | null | undefined)[], now: Date = new Date()): string {
  const id = crmIds.map((v) => (v ?? "").replace(/[^A-Za-z0-9]/g, "")).find((v) => v.length >= 4);
  if (id) return `EM-${id.slice(-6).toUpperCase()}`;
  return `EM-${Math.floor(now.getTime() / 1000).toString(36).toUpperCase()}`;
}
