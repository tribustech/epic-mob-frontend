import type { ColumnContent } from "@/lib/atelier/types";

/**
 * A tiny schematic of what a column holds (shelves, rails, drawers, doors). Drawn in a
 * 0–100 box that stretches to its container; strokes keep their width.
 */
export function ContentGlyph({ content, className = "" }: { content: ColumnContent; className?: string }) {
  const line = (y: number, x1 = 6, x2 = 94) => <line key={`l${y}-${x1}`} x1={x1} y1={y} x2={x2} y2={y} />;
  const rail = (y: number) => (
    <g key={`r${y}`}>
      <line x1={6} y1={y} x2={94} y2={y} strokeWidth={2.4} />
      {[28, 50, 72].map((x) => (
        <line key={x} x1={x} y1={y} x2={x} y2={y + 16} opacity={0.55} />
      ))}
    </g>
  );
  const drawer = (y: number, h: number) => (
    <g key={`d${y}`}>
      <rect x={10} y={y} width={80} height={h} rx={2} fill="currentColor" fillOpacity={0.1} />
      <line x1={40} y1={y + h / 2} x2={60} y2={y + h / 2} strokeWidth={2.2} />
    </g>
  );

  let inner;
  switch (content) {
    case "POLITE":
      inner = [22, 41, 60, 79].map((y) => line(y));
      break;
    case "BARA":
      inner = [rail(18)];
      break;
    case "BARA_DUBLA":
      inner = [rail(16), rail(56)];
      break;
    case "POLITE_BARA":
      inner = [rail(16), line(54), line(69), line(84)];
      break;
    case "BARA_SERTARE":
      inner = [rail(16), drawer(60, 15), drawer(79, 15)];
      break;
    case "SERTARE":
      inner = [drawer(8, 24), drawer(38, 24), drawer(68, 24)];
      break;
    case "USI":
      inner = [
        <rect key="d" x={10} y={8} width={80} height={84} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <line key="h" x1={76} y1={42} x2={76} y2={58} strokeWidth={2.4} />,
      ];
      break;
    case "USA_RIDICABILA":
      inner = [
        <rect key="d" x={10} y={8} width={80} height={84} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <polyline key="a" points="36,56 50,40 64,56" fill="none" strokeWidth={2.2} />,
      ];
      break;
    case "DESCHIS":
      inner = [36, 66].map((y) => line(y));
      break;
    /* kitchen modules */
    case "CHIUVETA":
      inner = [
        <path key="s" d="M24 14 h52 v10 a8 8 0 0 1 -8 8 h-36 a8 8 0 0 1 -8 -8 z" fill="currentColor" fillOpacity={0.15} />,
        <path key="t" d="M50 14 v-8 h10" strokeWidth={2.2} />,
        <rect key="d" x={10} y={40} width={80} height={52} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <line key="h" x1={42} y1={46} x2={58} y2={46} strokeWidth={2.2} />,
      ];
      break;
    case "CUPTOR":
      inner = [
        <line key="p" x1={20} y1={10} x2={80} y2={10} strokeWidth={3} />,
        <rect key="o" x={12} y={22} width={76} height={50} rx={2} fill="currentColor" fillOpacity={0.35} />,
        <line key="b" x1={28} y1={30} x2={72} y2={30} strokeWidth={2.2} />,
        drawer(78, 14),
      ];
      break;
    case "PLITA":
      inner = [<line key="p" x1={20} y1={10} x2={80} y2={10} strokeWidth={3} />, drawer(20, 22), drawer(46, 22), drawer(72, 20)];
      break;
    case "MASINA_VASE":
      inner = [
        <rect key="d" x={10} y={8} width={80} height={84} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <line key="h" x1={36} y1={16} x2={64} y2={16} strokeWidth={2.2} />,
        <circle key="c1" cx={35} cy={60} r={9} />,
        <circle key="c2" cx={65} cy={60} r={9} />,
      ];
      break;
    case "FRIGIDER":
      inner = [
        <rect key="u" x={10} y={6} width={80} height={24} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <rect key="d" x={10} y={34} width={80} height={60} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <line key="h" x1={78} y1={44} x2={78} y2={62} strokeWidth={2.4} />,
        <path key="f" d="M44 56 l12 12 m0 -12 l-12 12 M50 54 v16" strokeWidth={1.4} />,
      ];
      break;
    case "COLOANA_CUPTOR":
      inner = [
        <rect key="u" x={10} y={6} width={80} height={18} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <rect key="m" x={12} y={28} width={76} height={16} rx={2} fill="currentColor" fillOpacity={0.35} />,
        <rect key="o" x={12} y={48} width={76} height={22} rx={2} fill="currentColor" fillOpacity={0.35} />,
        drawer(74, 9),
        drawer(85, 9),
      ];
      break;
    case "COLOANA":
      inner = [
        <rect key="u" x={10} y={6} width={80} height={52} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <rect key="d" x={10} y={62} width={80} height={32} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <line key="h1" x1={78} y1={46} x2={78} y2={54} strokeWidth={2.4} />,
        <line key="h2" x1={78} y1={66} x2={78} y2={74} strokeWidth={2.4} />,
      ];
      break;
    case "COLT":
      inner = [
        <rect key="b" x={6} y={8} width={44} height={84} fill="currentColor" fillOpacity={0.25} />,
        <rect key="d" x={52} y={8} width={40} height={84} rx={2} fill="currentColor" fillOpacity={0.1} />,
        <line key="h" x1={58} y1={16} x2={58} y2={30} strokeWidth={2.4} />,
      ];
      break;
    /* bathroom modules */
    case "LAVOAR":
      inner = [
        <path key="b" d="M22 8 h56 v8 a10 10 0 0 1 -10 10 h-36 a10 10 0 0 1 -10 -10 z" fill="currentColor" fillOpacity={0.15} />,
        <path key="t" d="M50 8 v-5 h8" strokeWidth={2.2} />,
        drawer(34, 27),
        drawer(65, 27),
      ];
      break;
    case "MASINA_SPALAT":
      inner = [
        <line key="w" x1={6} y1={10} x2={94} y2={10} strokeWidth={3} />,
        <rect key="m" x={14} y={20} width={72} height={74} rx={4} fill="currentColor" fillOpacity={0.08} />,
        <circle key="c" cx={50} cy={60} r={18} fill="currentColor" fillOpacity={0.3} />,
        <line key="p" x1={20} y1={28} x2={44} y2={28} strokeWidth={2.2} />,
      ];
      break;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`atelier-glyph ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x={2} y={2} width={96} height={96} rx={3} strokeWidth={1.8} />
      {inner}
    </svg>
  );
}
