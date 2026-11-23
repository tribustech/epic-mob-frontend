/**
 * The CRM's price breakdown (lib/atelier/breakdown.ts in the CRM), as the site receives it. Every number
 * comes from the CRM engine and the CRM catalog: the site stores no prices, it only shows them to an admin.
 */

export interface BreakdownTotals {
  boards: number;
  edging: number;
  cuttingService: number;
  hardware: number;
  freeLines: number;
  /** what the workshop pays (boards + edging + cutting + hardware + free lines) */
  materials: number;
  laborBase: number;
  laborPct: number;
  labor: number;
  /** = the configurator / shop price before the offer */
  sellPrice: number;
  discountPct: number;
  discount: number;
  finalPrice: number;
}

export interface MoneyLine { name: string; total: number; detail?: string }

export type CostBucket = "boards" | "edging" | "cuttingService" | "hardware";

/** One edge with banding: L1/L2 = the long sides (length), W1/W2 = the short sides (width). */
export interface PartEdgeDetail { side: "L1" | "L2" | "W1" | "W2"; edgeBandId: string; name: string; lengthMm: number }

/** One line of the engine's cut list (with qty) and its share of the cost, in lei rounded to bani. */
export interface PartCostLine {
  name: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number | null;
  qty: number;
  materialId: string;
  materialName: string;
  decorCode: string | null;
  /** m² for all pieces */
  areaSqm: number;
  /** share of the material's cost by m² (billing + waste as in the totals) */
  boardCost: number;
  cuttingCost: number;
  edges: PartEdgeDetail[];
  edgeMl: number;
  edgeCost: number;
  total: number;
  /** how the board cost was shared when it is not the catalog board (e.g. painted MDF) */
  basis?: string;
}

export interface CabinetCostBlock {
  label: string;
  kind: "CORP" | "BLAT" | "ALTELE";
  type: string | null;
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  parts: PartCostLine[];
  hardware: HardwareLine[];
  extras: (MoneyLine & { bucket: CostBucket })[];
  totals: { boards: number; cuttingService: number; edging: number; hardware: number; total: number };
}

/** Per bucket: the engine total = the sum over cabinets + the rest (rounding to bani). */
export interface BreakdownReconciliation { bucket: CostBucket; engine: number; allocated: number; rest: number; restName: string }

export interface HardwareLine { code: string; name: string; category: string; qty: number; unitPrice: number; total: number }

export interface PriceBreakdown {
  key: string | null;
  ok: boolean;
  sellPrice: number | null;
  errors?: { code: string; message: string }[];
  warnings?: { code: string; message: string; cabinet?: string }[];
  totals: BreakdownTotals | null;
  boards?: { materialId: string; name: string; kind: string; thicknessMm: number; areaSqm: number; sheets: number | null; wastePct: number | null; pricePerSheet: number | null; pricePerSqm: number | null; total: number }[];
  edging?: { edgeBandId: string; name: string; ml: number; pricePerMl: number; total: number }[];
  cutting?: MoneyLine[];
  hardware?: HardwareLine[];
  unresolvedHardware?: { slot: string; name: string; category: string; qty: number }[];
  hardwareExtra?: MoneyLine[];
  freeLines?: (MoneyLine & { kind: string; inCommission: boolean })[];
  other?: (MoneyLine & { bucket: string })[];
  problems: string[];
  notes?: string[];
  /** every cabinet with all its pieces (CRM versions from Nov 2026 on) */
  cabinets?: CabinetCostBlock[];
  reconciliation?: BreakdownReconciliation[];
}

/** One request line: a configuration (or a `/configurator?c=` code) and the running shop offer. */
export interface BreakdownRequest {
  key: string;
  config?: unknown;
  share?: string;
  offerPercent?: number | null;
}

/** Hardware categories in plain words. */
export const HARDWARE_CATEGORY: Record<string, string> = {
  BALAMA: "Balamale",
  SERTAR: "Sertare (glisiere)",
  MANER: "Mânere",
  PICIOR: "Picioare",
  SINA_SUSPENDARE: "Prindere pe perete",
  SUPORT_POLITA: "Suporți poliță",
  CLEMA_SOCLU: "Cleme soclu",
  PISTON_AVENTOS: "Aventos",
  HOLTSURUB: "Holtșuruburi",
  CONFIRMAT: "Ericsoane",
  ACCESORIU: "Accesorii",
};

const lei = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });
const lei2 = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** „1.234 lei" */
export const formatLei = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? "—" : `${lei.format(Math.round(v))} lei`);
/** „12,50 lei" (unit prices) */
export const formatLei2 = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? "—" : `${lei2.format(v)} lei`);
export const formatNum = (v: number | null | undefined, digits = 2) =>
  v == null || !Number.isFinite(v) ? "—" : new Intl.NumberFormat("ro-RO", { maximumFractionDigits: digits }).format(v);

/** Materials as the owner reads them: everything the workshop buys, hardware shown on its own. */
export function headline(t: BreakdownTotals): { materials: number; hardware: number } {
  return { materials: t.materials - t.hardware, hardware: t.hardware };
}

/** The `c` code from a pasted configurator link (or the bare code). */
export function shareCodeOf(text: string): string | null {
  const s = text.trim();
  if (/^[A-Za-z0-9_-]{20,4000}$/.test(s)) return s;
  try {
    return new URL(s, "https://epicmob.ro").searchParams.get("c");
  } catch {
    return null;
  }
}

/** For search: „Parțială" → „partiala", so a search typed without diacritics still finds it. */
export function foldText(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export const BUCKET_LABEL: Record<CostBucket, string> = {
  boards: "Plăci",
  cuttingService: "Debitare",
  edging: "Cant",
  hardware: "Feronerie",
};

/** „L1 L2 W1" → which sides carry edge banding, short. */
export const edgeSides = (p: PartCostLine) => p.edges.map((e) => e.side).join(" ");

/** The text a part is searched by (cabinet, name, material, decor, edge band), folded. */
export function partSearchText(c: CabinetCostBlock, p: PartCostLine): string {
  return foldText([c.label, p.name, p.materialName, p.decorCode ?? "", ...p.edges.map((e) => e.name), `${p.lengthMm}x${p.widthMm}`].join(" "));
}

const csvCell = (v: string | number | null) => {
  const s = v == null ? "" : typeof v === "number" ? String(v).replace(".", ",") : v;
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every piece of every cabinet as CSV (semicolon, decimal comma: opens straight in Excel RO). */
export function partsCsv(cabinets: CabinetCostBlock[]): string {
  const head = ["Corp", "Piesă", "Lungime mm", "Lățime mm", "Grosime mm", "Buc", "Material", "Decor", "m²", "Cost placă", "Cost debitare", "Cant laturi", "Cant", "Cant ml", "Cost cant", "Total"];
  const rows = cabinets.flatMap((c) =>
    c.parts.map((p) => [
      c.label, p.name, p.lengthMm, p.widthMm, p.thicknessMm, p.qty, p.materialName, p.decorCode, p.areaSqm,
      p.boardCost, p.cuttingCost, edgeSides(p), [...new Set(p.edges.map((e) => e.name))].join(" + "), p.edgeMl, p.edgeCost, p.total,
    ]),
  );
  return [head, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
}
