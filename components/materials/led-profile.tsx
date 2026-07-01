// Profile drawings for LED control types — small line illustrations (like the
// handle profiles). Colour comes from `currentColor`, set by the card accent.

export function LedProfile({ type }: { type: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const faint = { ...common, strokeOpacity: 0.45 };

  return (
    <svg viewBox="0 0 140 100" className="handle-profile" role="img" aria-hidden="true">
      {type === "telecomanda" ? (
        <>
          {/* IR signal */}
          <path d="M62 18 q8 -7 16 0" {...faint} />
          <path d="M56 11 q14 -12 28 0" {...faint} />
          {/* remote body */}
          <rect x={52} y={26} width={40} height={62} rx={9} {...common} />
          <circle cx={72} cy={42} r={5} {...common} />
          <path d="M64 58 H80 M64 68 H80 M64 78 H80" {...common} />
        </>
      ) : null}

      {type === "touch" ? (
        <>
          {/* LED profile / surface */}
          <path d="M26 74 H114" {...faint} />
          {/* fingertip approaching */}
          <path d="M63 30 a7 7 0 0 1 14 0 v22 a7 7 0 0 1 -14 0 z" {...common} />
          {/* contact + ripple */}
          <circle cx={70} cy={74} r={3.5} fill="currentColor" stroke="none" />
          <path d="M58 70 a16 12 0 0 1 24 0" {...faint} />
        </>
      ) : null}

      {type === "senzor-miscare" ? (
        <>
          {/* open hand */}
          <path d="M62 26 V16 M70 26 V13 M78 26 V16" {...common} />
          <path d="M56 34 q0 -8 8 -8 h12 q8 0 8 8 v16 q0 8 -8 8 h-12 q-8 0 -8 -8 z" {...common} />
          {/* detection waves fanning down */}
          <path d="M54 66 a16 11 0 0 0 32 0" {...faint} />
          <path d="M47 69 a23 14 0 0 0 46 0" {...faint} />
          <path d="M40 72 a30 17 0 0 0 60 0" {...faint} />
        </>
      ) : null}

      {type === "senzor-usa" ? (
        <>
          {/* cabinet body */}
          <rect x={36} y={28} width={42} height={52} rx={3} {...common} />
          {/* open door */}
          <path d="M78 30 L104 23 V67 L78 74" {...common} />
          {/* light spilling out */}
          <path d="M82 42 L98 34 M84 52 L102 46 M84 62 L96 58" {...faint} />
        </>
      ) : null}

      {type === "smart" ? (
        <>
          {/* wifi */}
          <path d="M86 25 q7 -7 14 0" {...faint} />
          <path d="M81 20 q12 -12 24 0" {...faint} />
          <circle cx={93} cy={31} r={2} fill="currentColor" stroke="none" />
          {/* phone */}
          <rect x={52} y={30} width={32} height={56} rx={7} {...common} />
          <circle cx={68} cy={50} r={5} {...common} />
          <path d="M60 68 H76" {...common} />
          <path d="M64 78 H72" {...faint} />
        </>
      ) : null}
    </svg>
  );
}
