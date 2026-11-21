import { useId } from "react";
import type { ReactNode } from "react";
import type { PresetShape } from "@/lib/atelier/presets";
import { autoDrawers, autoShelves, BOTTOM_DEFAULT_HEIGHT_MM } from "@/lib/atelier/categories";
import { DOOR_OVERLAP_MM, autoDoorCount, doorWidthMm } from "@/lib/atelier/doors";
import { doorFills } from "@/lib/atelier/door-types";
import { FINISH_INFO, effectiveHandle } from "@/lib/atelier/handles";
import type { DoorFill } from "@/lib/atelier/types";
import { glassStops, type Glazing } from "./glass-look";
import type { MaterialLook } from "./material-look";
import { KitchenMini } from "./kitchen-mini";

/**
 * A small front elevation of a model, drawn from its shape alone (no CRM call): what the
 * client would see standing in front of it. Dressings with doors show the doors; without
 * doors, the interior. Proportions are real: the drawing is scaled to fit a fixed 4:3 box,
 * so a low, long comodă looks low and long next to a tall wardrobe.
 */

/** viewBox of the drawing (SVG units); the model is fitted inside, standing on the floor line. */
const VIEW_W = 240;
const VIEW_H = 180;
const PAD_X = 14;
const PAD_TOP = 10;
const FLOOR_Y = 164;
/** the smallest furniture still fills a good part of the box, the biggest never overflows */
const MAX_SCALE = 0.15;
const PANEL = 18;
const GAP = 3;
/** photo tile, mm across the grain (same as the 3D viewer) */
const TILE_MM = 620;

const STROKE = "#2b2520";

function hex(color: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return [216, 207, 193];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mixes a colour towards black (amount < 0) or white (amount > 0). */
function shade(color: string, amount: number): string {
  const target = amount < 0 ? 0 : 255;
  const k = Math.abs(amount);
  return `rgb(${hex(color).map((v) => Math.round(v + (target - v) * k)).join(",")})`;
}

function luminance(color: string): number {
  const [r, g, b] = hex(color);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function MiniPreview(props: Parameters<typeof FurniturePreview>[0] & { worktop?: MaterialLook | null }) {
  if (props.shape.category === "BUCATARIE") return <KitchenMini {...props} />;
  return <FurniturePreview {...props} />;
}

function FurniturePreview({
  shape,
  carcass,
  front,
  className,
  bold = false,
  glazing,
}: {
  shape: PresetShape;
  carcass: MaterialLook;
  front: MaterialLook;
  className?: string;
  /** drawn very small (an icon): heavier lines, so doors and drawers still read */
  bold?: boolean;
  /** the mirror / glass on the doors, to tint them as chosen (silver / bluish when not given) */
  glazing?: Glazing;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `mp-${uid}-${name}`;

  const W = Math.max(1, shape.widthMm);
  const H = Math.max(1, shape.heightMm);
  const wallHung = shape.category === "SUSPENDAT";
  const legs = wallHung ? 0 : shape.legsMm;

  // Fit: real proportions, never larger than MAX_SCALE, never outside the box.
  const availW = VIEW_W - 2 * PAD_X;
  const availH = (wallHung ? FLOOR_Y - 26 : FLOOR_Y) - PAD_TOP;
  const k = Math.min(availW / W, availH / H, MAX_SCALE);
  const ox = (VIEW_W - W * k) / 2;
  // wall cabinets hang at eye level: centred a little above the middle; the rest stands on the floor
  const oy = wallHung ? PAD_TOP + (availH - H * k) * 0.42 : FLOOR_Y - H * k;
  /** stroke widths are given in SVG units and converted to mm inside the scaled group */
  const px = (v: number) => (v * (bold ? 2.6 : 1)) / k;

  // dark boards get light lines (and a touch heavier), or doors and drawers melt into one black blob
  const dark = (look: MaterialLook) => luminance(look.color) < 0.34;
  const line = (look: MaterialLook, strength = 1) =>
    dark(look) ? `rgba(255,255,255,${Math.min(0.85, 0.62 * strength)})` : `rgba(43,37,32,${0.42 * strength})`;

  const fill = (look: MaterialLook, name: string) => (look.imageUrl ? `url(#${id(name)})` : look.color);
  const carcassFill = fill(carcass, "carcass");
  const frontFill = fill(front, "front");
  // a separator has no back: you see the room through it
  const interior =
    shape.category === "SEPARATOR" ? "rgba(255,255,255,0.55)" : shade(carcass.color, dark(carcass) ? 0.12 : -0.2);

  const bodyTop = 0;
  const bodyBottom = H - legs;
  const bodyH = bodyBottom - bodyTop;
  const doorType = shape.category === "DRESSING" ? shape.doors.type : "NONE";
  const sliding = doorType.startsWith("GLISANTE");
  const hinged = doorType.startsWith("BATANTE");
  // the face of every door (sliding: per door; hinged: per column): panel, mirror or glass
  const faces = doorFills(shape);
  const GLAZED = "rgba(60,80,95,0.5)";
  const faceFill = (f: DoorFill | undefined) => (f === "OGLINDA" ? `url(#${id("mirror")})` : f === "STICLA" ? `url(#${id("glass")})` : frontFill);
  const faceLine = (f: DoorFill | undefined) => (f === "OGLINDA" || f === "STICLA" ? GLAZED : line(front));

  // a hint of the handle: a bar, a knob, or a line along the edge; push-to-open fronts stay plain
  const shownHandle = effectiveHandle(shape);
  const handleKind = shownHandle?.type ?? null;
  // the chosen metal colour, unless it would vanish on these fronts (black on black)
  const finishColor = shownHandle?.finish ? FINISH_INFO[shownHandle.finish].color : null;
  const handleFinishColor = finishColor && Math.abs(luminance(finishColor) - luminance(front.color)) > 0.22 ? finishColor : null;

  const out: ReactNode[] = [];
  let key = 0;
  const rect = (x: number, y: number, w: number, h: number, f: string, stroke?: string, sw = 0.5, extra: object = {}) =>
    out.push(
      <rect
        key={key++}
        x={x}
        y={y}
        width={Math.max(0, w)}
        height={Math.max(0, h)}
        fill={f}
        stroke={stroke}
        strokeWidth={stroke ? px(sw) : undefined}
        {...extra}
      />,
    );
  const hline = (x0: number, x1: number, y: number, stroke: string, sw: number) =>
    out.push(<line key={key++} x1={x0} x2={x1} y1={y} y2={y} stroke={stroke} strokeWidth={px(sw)} strokeLinecap="round" />);

  /** a front panel (door / drawer) with a little handle hint */
  const frontPanel = (
    x: number,
    y: number,
    w: number,
    h: number,
    handle: "none" | "left" | "right" | "top" | "bottom" | "center" = "none",
    f = frontFill,
    stroke = line(front),
  ) => {
    rect(x, y, w, h, f, stroke, dark(front) && f === frontFill ? 0.8 : 0.55, { rx: px(0.4) });
    const glazed = f !== frontFill;
    // a diagonal glint says „mirror / glass" even at icon size
    if (glazed && w > px(3) && h > px(3)) {
      const g = Math.min(w, h) * 0.55;
      for (const [off, sw, op] of [[0.16, 1.5, 0.75], [0.42, 0.7, 0.6]] as const) {
        const gx = x + w * off;
        out.push(
          <line key={key++} x1={gx} y1={y + h * 0.16 + g} x2={gx + g} y2={y + h * 0.16} stroke="#fff" strokeOpacity={op} strokeWidth={px(sw)} strokeLinecap="round" />,
        );
      }
    }
    if (handle === "none" || !handleKind || handleKind === "PUSH") return;
    const vertical = handle === "left" || handle === "right";
    const metal = handleFinishColor ?? (dark(front) ? "#f1eee9" : "#2b2520");
    const quiet = glazed ? "rgba(70,85,95,0.75)" : dark(front) ? "rgba(255,255,255,0.8)" : "rgba(43,37,32,0.5)";
    const inset = Math.min(px(2.6), w * 0.12);
    const hx = handle === "left" ? x + inset : x + w - inset;
    const hy = handle === "top" ? y + Math.min(px(2.6), h * 0.2) : handle === "bottom" ? y + h - Math.min(px(2.6), h * 0.2) : y + h / 2;
    if (handleKind === "BUTON") {
      // a knob: one dot
      out.push(<circle key={key++} cx={vertical ? hx : x + w / 2} cy={vertical ? y + h / 2 : hy} r={px(1.05)} fill={metal} />);
      return;
    }
    if (handleKind === "APLICAT") {
      // a bar standing off the front
      const len = Math.min(px(7), Math.max(px(2.5), (vertical ? h : w) * 0.16));
      if (vertical) {
        const cy = y + h / 2;
        out.push(<line key={key++} x1={hx} x2={hx} y1={cy - len / 2} y2={cy + len / 2} stroke={metal} strokeWidth={px(0.95)} strokeLinecap="round" />);
      } else hline(x + w / 2 - len / 2, x + w / 2 + len / 2, hy, metal, 0.95);
      return;
    }
    // recessed grip, milled edge, hidden profile: a line along the edge you pull
    const edge = handleKind === "INGROPAT" ? 0.36 : 0.86;
    const sw = handleKind === "GOLA" ? 1.15 : 0.75;
    const c = handleKind === "PROFIL_J" ? quiet : (handleFinishColor ?? quiet);
    if (vertical) {
      const ex = handle === "left" ? x + px(0.7) : x + w - px(0.7);
      const len = h * edge;
      out.push(<line key={key++} x1={ex} x2={ex} y1={y + (h - len) / 2} y2={y + (h + len) / 2} stroke={c} strokeWidth={px(sw)} strokeLinecap="round" />);
    } else {
      const ey = handle === "bottom" ? y + h - px(0.7) : y + px(0.7);
      const len = w * edge;
      hline(x + (w - len) / 2, x + (w + len) / 2, ey, c, sw);
    }
  };

  /** n evenly spaced shelves between y0 and y1 */
  const shelves = (x: number, w: number, y0: number, y1: number, n: number) => {
    for (let i = 1; i <= n; i++) {
      const y = y0 + ((y1 - y0) * i) / (n + 1);
      // at least ~1 px thick, or shelves vanish on a 6 m wardrobe
      const t = Math.max(PANEL, px(1.1));
      rect(x, y - t / 2, w, t, carcassFill, line(carcass, 0.8), 0.35);
    }
  };

  /** a hanging rail with a few hangers and clothes */
  const rail = (x: number, w: number, y: number, room: number) => {
    const metal = dark(carcass) ? "#d9dcdf" : "#8d9399";
    hline(x + 8, x + w - 8, y, metal, 1.1);
    const n = Math.max(2, Math.min(5, Math.round(w / 190)));
    const drop = Math.min(room * 0.72, 620);
    const cloth = ["#f4efe7", "#b9c2c9", "#e2d3bf", "#8f9aa3", "#f4efe7"];
    for (let i = 0; i < n; i++) {
      const cx = x + (w * (i + 0.5)) / n;
      const half = Math.min(w / n / 2 - 14, 105);
      if (half < 20 || drop < 120) continue;
      const garment = drop * (i % 2 ? 0.82 : 1);
      out.push(
        <g key={key++}>
          <path
            d={`M${cx} ${y} v${22} M${cx - half} ${y + 62} L${cx} ${y + 22} L${cx + half} ${y + 62}`}
            fill="none"
            stroke={metal}
            strokeWidth={px(0.6)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x={cx - half}
            y={y + 62}
            width={half * 2}
            height={Math.max(0, garment - 62)}
            rx={px(0.8)}
            fill={cloth[i % cloth.length]}
            fillOpacity={0.92}
            stroke={line(carcass, 0.55)}
            strokeWidth={px(0.3)}
          />
        </g>,
      );
    }
  };

  /** a stack of drawer fronts filling a zone */
  const drawerStack = (x: number, w: number, y0: number, y1: number, n: number) => {
    const h = (y1 - y0 - GAP * (n - 1)) / n;
    for (let i = 0; i < n; i++) frontPanel(x, y0 + i * (h + GAP), w, h, h < 150 ? "center" : "top");
  };

  /** hinged doors over a zone: one or two leaves, handles at the meeting edge */
  const swingDoors = (
    x: number,
    w: number,
    y0: number,
    y1: number,
    leaves: number,
    rows = 1,
    f = frontFill,
    stroke = line(front),
    /** where a single leaf opens (its handle side) */
    single: "left" | "right" = "right",
  ) => {
    const rowH = (y1 - y0 - GAP * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * (rowH + GAP);
      if (leaves === 2) {
        const half = (w - GAP) / 2;
        frontPanel(x, y, half, rowH, "right", f, stroke);
        frontPanel(x + half + GAP, y, half, rowH, "left", f, stroke);
      } else frontPanel(x, y, w, rowH, single, f, stroke);
    }
  };

  // ── body ──
  rect(0, bodyTop, W, bodyH, shape.category === "SEPARATOR" ? "#e6dfd5" : carcassFill, undefined);
  if (shape.category === "SEPARATOR") {
    // only the frame is board: sides, top and base
    for (const [fx, fy, fw, fh] of [
      [0, bodyTop, PANEL, bodyH],
      [W - PANEL, bodyTop, PANEL, bodyH],
      [0, bodyTop, W, PANEL],
      [0, bodyBottom - PANEL, W, PANEL],
    ])
      rect(fx, fy, fw, fh, carcassFill, undefined);
  }

  // separator: closed bottom zone on the full width, shelves above
  const bottom = shape.category === "SEPARATOR" && shape.bottom && shape.bottom.type !== "NONE" ? shape.bottom : null;
  const bottomTop = bottom ? H - Math.min(H - 300, bottom.heightMm ?? BOTTOM_DEFAULT_HEIGHT_MM) : bodyBottom;

  let x = 0;
  shape.columns.forEach((c, i) => {
    const colX = x + (i === 0 ? PANEL : PANEL / 2);
    const colEnd = x + c.widthMm - (i === shape.columns.length - 1 ? PANEL : PANEL / 2);
    const colW = colEnd - colX;
    const y0 = bodyTop + PANEL;
    const y1 = (bottom ? bottomTop : bodyBottom) - PANEL;
    const zoneH = y1 - y0;
    x += c.widthMm;

    // interior (visible when nothing closes the column)
    const open = (n: number) => {
      rect(colX, y0, colW, zoneH, interior, undefined);
      shelves(colX, colW, y0, y1, n);
    };

    switch (c.content) {
      case "POLITE":
        open(c.shelves ?? Math.max(0, Math.round(bodyH / 350) - 1));
        break;
      case "BARA":
        rect(colX, y0, colW, zoneH, interior, undefined);
        rect(colX, y0 + 260, colW, PANEL, carcassFill, line(carcass, 0.8), 0.35);
        rail(colX, colW, y0 + 260 + PANEL + 70, zoneH - 350);
        break;
      case "BARA_DUBLA": {
        rect(colX, y0, colW, zoneH, interior, undefined);
        const mid = y0 + zoneH / 2;
        rail(colX, colW, y0 + 70, zoneH / 2 - 90);
        rect(colX, mid - PANEL / 2, colW, PANEL, carcassFill, line(carcass, 0.8), 0.35);
        rail(colX, colW, mid + 80, zoneH / 2 - 100);
        break;
      }
      case "POLITE_BARA": {
        rect(colX, y0, colW, zoneH, interior, undefined);
        const mid = y0 + zoneH / 2;
        rect(colX, mid - PANEL / 2, colW, PANEL, carcassFill, line(carcass, 0.8), 0.35);
        const n = c.shelves ?? 2;
        if (c.railPosition === "JOS") {
          shelves(colX, colW, y0, mid, n);
          rail(colX, colW, mid + 80, zoneH / 2 - 100);
        } else {
          rail(colX, colW, y0 + 70, zoneH / 2 - 90);
          shelves(colX, colW, mid, y1, n);
        }
        break;
      }
      case "BARA_SERTARE": {
        rect(colX, y0, colW, zoneH, interior, undefined);
        const n = c.drawers ?? 1;
        const stackTop = y1 - n * 253;
        rect(colX, stackTop - 20 - PANEL, colW, PANEL, carcassFill, line(carcass, 0.8), 0.35);
        rail(colX, colW, y0 + 70, stackTop - 40 - y0 - 70);
        drawerStack(colX + 6, colW - 12, stackTop, y1, n);
        break;
      }
      case "SERTARE":
        drawerStack(x - c.widthMm + GAP / 2, c.widthMm - GAP, bodyTop + GAP / 2, bodyBottom - GAP / 2, c.drawers ?? autoDrawers(bodyH));
        break;
      case "USI":
        swingDoors(x - c.widthMm + GAP / 2, c.widthMm - GAP, bodyTop + GAP / 2, bodyBottom - GAP / 2, c.widthMm > 600 ? 2 : 1);
        break;
      case "USA_RIDICABILA":
        frontPanel(x - c.widthMm + GAP / 2, bodyTop + GAP / 2, c.widthMm - GAP, bodyH - GAP, "bottom");
        break;
      case "DESCHIS":
      default:
        open(c.shelves ?? autoShelves("DESCHIS", zoneH + 2 * PANEL));
        break;
    }

    // separator bottom, per column
    if (bottom) {
      const bx = x - c.widthMm + GAP / 2;
      const bw = c.widthMm - GAP;
      if (bottom.type === "SERTARE") drawerStack(bx, bw, bottomTop + GAP / 2, bodyBottom - GAP / 2, bottom.drawers ?? 2);
      else swingDoors(bx, bw, bottomTop + GAP / 2, bodyBottom - GAP / 2, 1);
    }
    // column divider on top of the interior
    if (i > 0 && !["SERTARE", "USI", "USA_RIDICABILA"].includes(c.content) && !["SERTARE", "USI", "USA_RIDICABILA"].includes(shape.columns[i - 1].content)) {
      rect(x - c.widthMm - PANEL / 2, bodyTop + PANEL, PANEL, (bottom ? bottomTop : bodyBottom) - bodyTop - 2 * PANEL, carcassFill, line(carcass, 0.8), 0.35);
    }
  });

  // ── doors of a dressing: what the client sees ──
  if (sliding) {
    const requested = shape.doors.count;
    const n = requested && requested >= 2 ? requested : autoDoorCount(W);
    const dw = doorWidthMm(W, n);
    // back track first, then the front track on top (they overlap)
    for (const track of [0, 1]) {
      for (let i = 0; i < n; i++) {
        if (i % 2 !== track) continue;
        const dx = i * (dw - DOOR_OVERLAP_MM);
        frontPanel(dx, bodyTop, dw, bodyH, "none", faceFill(faces[i]), faceLine(faces[i]));
        // the vertical aluminium profile of a sliding door
        const profile = faces[i] !== "PANOU" ? "rgba(235,240,243,0.9)" : dark(front) ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.55)";
        for (const ex of [dx + 9, dx + dw - 9])
          out.push(<line key={key++} x1={ex} x2={ex} y1={bodyTop + 4} y2={bodyBottom - 4} stroke={profile} strokeWidth={px(0.7)} />);
      }
    }
  } else if (hinged) {
    let dx = 0;
    for (const [i, c] of shape.columns.entries()) {
      // a single door is hinged towards the outside: on the right for the last column, else on the left
      const single = shape.columns.length > 1 && i === shape.columns.length - 1 ? "left" : "right";
      // same rule as the CRM and the „Uși pe lățime" control: one leaf unless the client asked for two
      const leaves = c.doorsAcross ?? 1;
      swingDoors(dx + GAP / 2, c.widthMm - GAP, bodyTop + GAP / 2, bodyBottom - GAP / 2, leaves, c.doorRows ?? 1, faceFill(faces[i]), faceLine(faces[i]), single);
      dx += c.widthMm;
    }
  }

  // ── outline, legs / plinth ──
  rect(0, bodyTop, W, bodyH, "none", dark(carcass) ? "rgba(20,16,13,0.9)" : "rgba(43,37,32,0.62)", 0.8, { rx: px(0.5) });
  if (legs > 0) {
    // Same as the 3D scene from the CRM: every floor-standing piece (dressing, comodă,
    // separator) sits on a plinth in the body material, full width, set back in depth.
    // Seen from the front that is a band under the body, darker because it is recessed.
    rect(0, bodyBottom, W, legs, carcassFill, undefined);
    rect(0, bodyBottom, W, legs, "rgba(30,24,19,0.26)", "rgba(43,37,32,0.45)", 0.4);
  }

  const pattern = (name: string, look: MaterialLook) =>
    look.imageUrl ? (
      <pattern
        id={id(name)}
        patternUnits="userSpaceOnUse"
        width={TILE_MM}
        height={TILE_MM}
        patternTransform={look.grainHorizontal ? "rotate(90)" : undefined}
      >
        <rect width={TILE_MM} height={TILE_MM} fill={look.color} />
        {look.crop ? (
          // only the clean region of the photo (no supplier label)
          <svg width={TILE_MM} height={TILE_MM} viewBox={look.crop.join(" ")} preserveAspectRatio="none">
            <image href={look.imageUrl} width={1} height={1} preserveAspectRatio="none" />
          </svg>
        ) : (
          <image href={look.imageUrl} width={TILE_MM} height={TILE_MM} preserveAspectRatio="xMidYMid slice" />
        )}
      </pattern>
    ) : null;

  const mirrorStops = glassStops("OGLINDA", glazing?.mirror, ["#eef3f6", "#cfdae1", "#dfe8ed", "#b9c8d1"]);
  const glassFill = glassStops("STICLA", glazing?.glass, [shade(front.color, 0.35), "#9fb6c1", "#9fb6c1", shade(front.color, -0.05)]);
  const shadowW = W * k;
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", overflow: "hidden" }}
    >
      <defs>
        {pattern("carcass", carcass)}
        {pattern("front", front)}
        <linearGradient id={id("mirror")} x1="0" y1="0" x2="1" y2="1">
          {mirrorStops.map((c, n) => (
            <stop key={n} offset={[0, 0.45, 0.55, 1][n]} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={id("glass")} x1="0" y1="0" x2="1" y2="1">
          {glassFill.map((c, n) => (
            <stop key={n} offset={[0, 0.45, 0.55, 1][n]} stopColor={c} />
          ))}
        </linearGradient>
        <radialGradient id={id("floor")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={STROKE} stopOpacity="0.26" />
          <stop offset="1" stopColor={STROKE} stopOpacity="0" />
        </radialGradient>
      </defs>
      {wallHung ? (
        // hung on the wall: a soft shadow under the cabinet, nothing touching the floor
        <ellipse cx={VIEW_W / 2} cy={oy + H * k + 5} rx={shadowW * 0.5} ry={5} fill={`url(#${id("floor")})`} />
      ) : (
        <ellipse cx={VIEW_W / 2} cy={FLOOR_Y + 1} rx={shadowW * 0.56 + 4} ry={5.5} fill={`url(#${id("floor")})`} />
      )}
      <g transform={`translate(${ox} ${oy}) scale(${k})`}>{out}</g>
    </svg>
  );
}
