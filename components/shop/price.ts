const lei = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

/** 12345 → „12.345 lei" */
export function formatPrice(value: number): string {
  return `${lei.format(Math.round(value))} lei`;
}
