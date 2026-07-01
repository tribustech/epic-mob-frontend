// Profile drawings for handle types — a side cross-section through the cabinet
// front (drawn faint) plus the grip detail (drawn solid) that defines the type.
// Colour comes from `currentColor`, set by the card accent.

function Door({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {/* door panel, seen edge-on (faint) */}
      <rect
        x={62}
        y={14}
        width={18}
        height={72}
        rx={4}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.32}
        strokeWidth={4}
      />
      {children}
    </>
  );
}

export function HandleProfile({ type }: { type: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 140 100"
      className="handle-profile"
      role="img"
      aria-hidden="true"
    >
      {type === "aplicat" ? (
        <Door>
          {/* bar handle mounted on the front face */}
          <path d="M80 28 H112 M80 62 H112 M112 28 V62" {...common} />
        </Door>
      ) : null}

      {type === "profil-j" ? (
        <Door>
          {/* top edge milled into a J finger pull */}
          <path d="M80 30 V22 a10 10 0 0 0 -10 -10 H64" {...common} />
        </Door>
      ) : null}

      {type === "gola" ? (
        <>
          {/* two stacked doors with an aluminium channel between */}
          <rect x={62} y={10} width={18} height={30} rx={3} fill="none" stroke="currentColor" strokeOpacity={0.32} strokeWidth={4} />
          <rect x={62} y={60} width={18} height={30} rx={3} fill="none" stroke="currentColor" strokeOpacity={0.32} strokeWidth={4} />
          <path d="M80 42 H104 V58 H80" {...common} />
        </>
      ) : null}

      {type === "buton" ? (
        <Door>
          {/* round knob on a short stem */}
          <line x1={80} y1={50} x2={94} y2={50} {...common} />
          <circle cx={106} cy={50} r={11} {...common} />
        </Door>
      ) : null}

      {type === "ingropat" ? (
        <Door>
          {/* recess scooped into the front face */}
          <path d="M80 32 q-16 8 -16 18 q0 10 16 18" {...common} />
        </Door>
      ) : null}

      {type === "push" ? (
        <Door>
          {/* fingertip pressing the front */}
          <circle cx={98} cy={50} r={4.5} fill="currentColor" stroke="none" />
          <path d="M124 50 H108 M114 44 L108 50 L114 56" {...common} />
          <path d="M88 40 a12 12 0 0 1 0 20" {...common} strokeOpacity={0.5} />
        </Door>
      ) : null}
    </svg>
  );
}
