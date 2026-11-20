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
