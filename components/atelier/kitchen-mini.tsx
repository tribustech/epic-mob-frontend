import type { ReactNode } from "react";
import type { PresetShape } from "@/lib/atelier/presets";
import type { AtelierColumn } from "@/lib/atelier/types";
import { COUNTER_MM, UPPER_GAP_MM, isTall, kitchenLayout, upperOf } from "@/lib/atelier/kitchen";
import type { MaterialLook } from "./material-look";

/**
 * A small front elevation of a kitchen, drawn from its shape alone: modules under the worktop, wall cabinets
 * above, tall columns. In an L the second wall is drawn unfolded beside the main one, a shade darker, so the
 * whole kitchen reads in one drawing.
 */

const VIEW_W = 240;
const VIEW_H = 180;
const PAD_X = 10;
const PAD_TOP = 14;
const FLOOR_Y = 164;
const GAP = 4;
const WORKTOP_MM = 38;
const DEFAULT_WORKTOP = "#c9b495";
const STEEL = "#9aa1a6";
const GLASS = "#2f3438";

function hex(color: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return [216, 207, 193];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(color: string, amount: number): string {
  const target = amount < 0 ? 0 : 255;
  const k = Math.abs(amount);
  return `rgb(${hex(color).map((v) => Math.round(v + (target - v) * k)).join(",")})`;
}
const luminance = (color: string) => {
  const [r, g, b] = hex(color);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

export function KitchenMini({
  shape,
  carcass,
  front,
  worktop,
  className,
  bold = false,
}: {
  shape: PresetShape;
  carcass: MaterialLook;
  front: MaterialLook;
  worktop?: MaterialLook | null;
  className?: string;
  bold?: boolean;
}) {
  const layout = kitchenLayout(shape);
  const legB = layout !== "LINIAR" ? shape.kitchen?.legB : undefined;
  const H = Math.max(1, shape.heightMm);
  const legs = shape.legsMm;
  const mainW = Math.max(1, shape.widthMm);
  const sideW = legB ? Math.max(0, legB.widthMm - shape.depthMm) : 0;
  const totalW = mainW + (sideW > 0 ? sideW + 120 : 0);

  const k = Math.min((VIEW_W - 2 * PAD_X) / totalW, (FLOOR_Y - PAD_TOP) / H);
  const ox = (VIEW_W - totalW * k) / 2;
  const oy = FLOOR_Y - H * k;
  const px = (v: number) => (v * (bold ? 2.4 : 1)) / k;
  /** y of a height above the floor (mm) */
  const Y = (mm: number) => H - mm;

  const dark = luminance(front.color) < 0.34;
  const frontLine = dark ? "rgba(255,255,255,0.6)" : "rgba(43,37,32,0.45)";
  const counterTop = COUNTER_MM;
  const counterBody = COUNTER_MM - WORKTOP_MM;
  const upperBottom = COUNTER_MM + UPPER_GAP_MM;
  const top = worktop?.color ?? DEFAULT_WORKTOP;
  const interior = shade(carcass.color, luminance(carcass.color) < 0.34 ? 0.14 : -0.18);

  const out: ReactNode[] = [];
  let key = 0;
  const rect = (x: number, y: number, w: number, h: number, fill: string, stroke?: string, sw = 0.5, rx = 0) =>
    out.push(
      <rect key={key++} x={x} y={y} width={Math.max(0, w)} height={Math.max(0, h)} rx={rx} fill={fill} stroke={stroke} strokeWidth={stroke ? px(sw) : undefined} />,
    );
  const bar = (x0: number, x1: number, y: number) =>
    out.push(<line key={key++} x1={x0} x2={x1} y1={y} y2={y} stroke={frontLine} strokeWidth={px(0.9)} strokeLinecap="round" />);
  const vbar = (x: number, y0: number, y1: number) =>
    out.push(<line key={key++} x1={x} x2={x} y1={y0} y2={y1} stroke={frontLine} strokeWidth={px(0.9)} strokeLinecap="round" />);

  /** a front from height a to b (mm above the floor) */
  const panel = (x: number, w: number, a: number, b: number, fill = front.color) => rect(x + GAP / 2, Y(b) + GAP / 2, w - GAP, b - a - GAP, fill, frontLine, 0.5);
  const drawers = (x: number, w: number, a: number, b: number, n: number) => {
    const h = (b - a) / n;
    for (let i = 0; i < n; i++) {
      panel(x, w, a + i * h, a + (i + 1) * h);
      bar(x + w * 0.35, x + w * 0.65, Y(a + (i + 1) * h) + Math.min(45, h * 0.2));
    }
  };
  const doors = (x: number, w: number, a: number, b: number, leaves: number, handleAt: "top" | "bottom") => {
    const lw = w / leaves;
    for (let i = 0; i < leaves; i++) {
      panel(x + i * lw, lw, a, b);
      const hx = leaves === 2 ? (i === 0 ? x + lw - 40 : x + lw + 40) : x + lw - 40;
      vbar(hx, handleAt === "top" ? Y(b) + 50 : Y(a) - 170, handleAt === "top" ? Y(b) + 170 : Y(a) - 50);
    }
  };
  const appliance = (x: number, w: number, a: number, b: number) => {
    rect(x + GAP / 2, Y(b) + GAP / 2, w - GAP, b - a - GAP, STEEL, "rgba(0,0,0,0.35)", 0.5);
    rect(x + 40, Y(b) + 90, w - 80, b - a - 160, GLASS, undefined, 0, 6);
  };

  /** one wall's modules from x; returns nothing (draws) */
  const wall = (cols: AtelierColumn[], x0: number) => {
    let x = x0;
    for (const c of cols) {
      const w = c.widthMm;
      // the body behind the fronts
      if (isTall(c.content)) {
        rect(x, Y(H), w, H - legs, carcass.color);
        switch (c.content) {
          case "FRIGIDER":
            panel(x, w, legs, H - 420);
            panel(x, w, H - 420, H);
            vbar(x + w - 40, Y(H - 420) + 60, Y(H - 420) + 360);
            break;
          case "COLOANA_CUPTOR": {
            drawers(x, w, legs, legs + 760, 2);
            appliance(x, w, legs + 760, legs + 1360);
            appliance(x, w, legs + 1360, legs + 1740);
            panel(x, w, legs + 1740, H);
            break;
          }
          default: {
            const mid = legs + (H - legs) * 0.45;
            doors(x, w, legs, mid, w > 600 ? 2 : 1, "top");
            doors(x, w, mid, H, w > 600 ? 2 : 1, "bottom");
          }
        }
        x += w;
        continue;
      }
      // under the worktop
      rect(x, Y(counterBody), w, counterBody - legs, carcass.color);
      switch (c.content) {
        case "SERTARE":
        case "PLITA":
          drawers(x, w, legs, counterBody, c.drawers ?? 3);
          break;
        case "CUPTOR":
          panel(x, w, legs, legs + 160);
          bar(x + w * 0.35, x + w * 0.65, Y(legs + 160) + 40);
          appliance(x, w, legs + 160, counterBody);
          break;
        case "MASINA_VASE":
          panel(x, w, legs, counterBody);
          bar(x + w * 0.3, x + w * 0.7, Y(counterBody) + 50);
          break;
        case "COLT":
          // a door and the blind panel that hides the corner
          panel(x, Math.min(w, 500), legs, counterBody);
          panel(x + Math.min(w, 500), w - Math.min(w, 500), legs, counterBody, shade(front.color, dark ? 0.06 : -0.06));
          vbar(x + Math.min(w, 500) - 40, Y(counterBody) + 50, Y(counterBody) + 170);
          break;
        default:
          doors(x, w, legs, counterBody, w > 600 ? 2 : 1, "top");
      }
      // on the worktop: the tap, the hob
      if (c.content === "CHIUVETA") {
        const cx = x + w / 2;
        out.push(
          <path
            key={key++}
            d={`M${cx} ${Y(counterTop)} v${-220} q0 ${-60} ${60} ${-60} h40`}
            fill="none"
            stroke={STEEL}
            strokeWidth={px(1.6)}
            strokeLinecap="round"
          />,
        );
      }
      if (c.content === "CUPTOR" || c.content === "PLITA") rect(x + 60, Y(counterTop) - 14, w - 120, 14, GLASS);
      // above: wall cabinet, shelf, hood
      const upper = upperOf(c);
      if (upper === "USI") {
        rect(x, Y(H), w, H - upperBottom, carcass.color);
        doors(x, w, upperBottom, H, w > 600 ? 2 : 1, "bottom");
      } else if (upper === "RIDICABILA") {
        rect(x, Y(H), w, H - upperBottom, carcass.color);
        panel(x, w, upperBottom, H);
        bar(x + w * 0.3, x + w * 0.7, Y(upperBottom) - 50);
      } else if (upper === "DESCHIS") {
        const h = Math.min(H - upperBottom, 700);
        rect(x, Y(upperBottom + h), w, h, interior, "rgba(43,37,32,0.3)", 0.5);
        rect(x, Y(upperBottom + h / 2) - 9, w, 18, carcass.color);
      } else if (upper === "HOTA") {
        const hoodTop = upperBottom + 120;
        out.push(
          <path
            key={key++}
            d={`M${x + 40} ${Y(upperBottom)} h${w - 80} l-${(w - 80) * 0.3} ${-120} h-${(w - 80) * 0.4} z`}
            fill={STEEL}
          />,
        );
        rect(x + w * 0.36, Y(H), w * 0.28, H - hoodTop, STEEL);
      }
      x += w;
    }
  };

  // the worktop: one strip over every run of modules under it
  const worktops = (cols: AtelierColumn[], x0: number) => {
    let x = x0;
    let run: number | null = null;
    for (const c of cols) {
      if (isTall(c.content)) {
        if (run !== null) rect(run, Y(counterTop), x - run, WORKTOP_MM, top, "rgba(0,0,0,0.25)", 0.4);
        run = null;
      } else if (run === null) run = x;
      x += c.widthMm;
    }
    if (run !== null) rect(run, Y(counterTop), x - run, WORKTOP_MM, top, "rgba(0,0,0,0.25)", 0.4);
  };

  const mainX = layout === "L_STANGA" && sideW > 0 ? sideW + 120 : 0;
  const sideX = layout === "L_STANGA" ? 0 : mainW + 120;
  if (legB && sideW > 0) {
    out.push(<g key={key++} opacity={0.82}>{(() => { const before = out.length; wall(legB.columns, sideX); worktops(legB.columns, sideX); return out.splice(before); })()}</g>);
    // the corner where the two walls meet
    const cx = layout === "L_STANGA" ? sideW + 60 : mainW + 60;
    out.push(<line key={key++} x1={cx} x2={cx} y1={Y(H) - 40} y2={H} stroke="rgba(43,37,32,0.35)" strokeWidth={px(0.6)} strokeDasharray={`${px(3)} ${px(3)}`} />);
  }
  wall(shape.columns, mainX);
  worktops(shape.columns, mainX);
  // plinth shadow
  rect(0, H - legs, totalW, legs, "rgba(43,37,32,0.18)");

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <line x1={8} x2={VIEW_W - 8} y1={FLOOR_Y + 0.5} y2={FLOOR_Y + 0.5} stroke="rgba(43,37,32,0.25)" strokeWidth={1} />
      <g transform={`translate(${ox} ${oy}) scale(${k})`}>{out}</g>
    </svg>
  );
}
