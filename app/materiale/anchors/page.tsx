"use client";

// DEV-ONLY anchor picker for the material structure diagram.
//
// The leader-line anchors in lib/materials-data.ts are normalised (0–1)
// coordinates on the detail (02) photo. This page lets you click the exact
// feature on each photo and copy the resulting coordinates straight back into
// the data file — no more guessing by eye.
//
// Usage: run the dev server and open /materiale/anchors. Pick a material, click
// the "active" layer chip, then click the feature on the photo. Repeat, then
// hit "Copy structure" and paste over the `structure` array for that material.
//
// Not linked anywhere and irrelevant in production — safe to delete once the
// anchors are dialled in.

import { useMemo, useRef, useState } from "react";
import { materials } from "@/lib/materials-data";

type Pt = { x: number; y: number };

// Mirror production: the image sits in a 3/2 box with object-fit: cover. We map
// a click back to normalised *image-content* coordinates, accounting for any
// cover crop, so the numbers are correct even if a photo's aspect ratio drifts.
function toNormalised(
  clientX: number,
  clientY: number,
  box: DOMRect,
  natW: number,
  natH: number,
): Pt {
  const boxAR = box.width / box.height;
  const imgAR = natW / natH;
  let dispW = box.width;
  let dispH = box.height;
  let offX = 0;
  let offY = 0;
  if (imgAR > boxAR) {
    dispH = box.height;
    dispW = box.height * imgAR;
    offX = (box.width - dispW) / 2;
  } else {
    dispW = box.width;
    dispH = box.width / imgAR;
    offY = (box.height - dispH) / 2;
  }
  const x = (clientX - box.left - offX) / dispW;
  const y = (clientY - box.top - offY) / dispH;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return { x: clamp(x), y: clamp(y) };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export default function AnchorPicker() {
  const [materialIdx, setMaterialIdx] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0);
  const [hover, setHover] = useState<Pt | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const material = materials[materialIdx];

  // Editable copy of this material's anchors, seeded from the data file.
  const [anchorsByMaterial, setAnchorsByMaterial] = useState<Record<string, Pt[]>>(
    () =>
      Object.fromEntries(
        materials.map((m) => [m.slug, m.structure.map((s) => ({ ...s.anchor }))]),
      ),
  );
  const anchors = anchorsByMaterial[material.slug];

  const boxAndNat = () => {
    const el = imgRef.current;
    if (!el) return null;
    return {
      box: el.getBoundingClientRect(),
      natW: el.naturalWidth || 1600,
      natH: el.naturalHeight || 1067,
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    const info = boxAndNat();
    if (!info) return;
    const p = toNormalised(e.clientX, e.clientY, info.box, info.natW, info.natH);
    setAnchorsByMaterial((prev) => {
      const next = prev[material.slug].slice();
      next[activeLayer] = p;
      return { ...prev, [material.slug]: next };
    });
    // Advance to the next layer for quick sequential placing.
    setActiveLayer((i) => (i + 1) % material.structure.length);
  };

  const handleMove = (e: React.MouseEvent) => {
    const info = boxAndNat();
    if (!info) return;
    setHover(toNormalised(e.clientX, e.clientY, info.box, info.natW, info.natH));
  };

  const snippet = useMemo(() => {
    const lines = material.structure.map((s, i) => {
      const a = anchors[i];
      const sub = s.sub ? `, sub: ${JSON.stringify(s.sub)}` : "";
      return `      { label: ${JSON.stringify(s.label)}${sub}, anchor: { x: ${r2(
        a.x,
      )}, y: ${r2(a.y)} } },`;
    });
    return `structure: [\n${lines.join("\n")}\n    ],`;
  }, [material, anchors]);

  const copy = () => {
    void navigator.clipboard?.writeText(snippet);
  };

  return (
    <main style={S.page}>
      <h1 style={S.h1}>Anchor picker (dev)</h1>
      <p style={S.hint}>
        Alege materialul, apasă chip-ul stratului „activ", apoi dă click pe feature-ul
        din poză. Coordonatele se scriu automat. La final: „Copy structure" → lipești
        peste array-ul <code>structure</code> în <code>lib/materials-data.ts</code>.
      </p>

      <div style={S.tabs}>
        {materials.map((m, i) => (
          <button
            key={m.slug}
            onClick={() => {
              setMaterialIdx(i);
              setActiveLayer(0);
            }}
            style={{ ...S.tab, ...(i === materialIdx ? S.tabActive : null) }}
          >
            {m.short}
          </button>
        ))}
      </div>

      <div style={S.layerChips}>
        {material.structure.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveLayer(i)}
            style={{ ...S.chip, ...(i === activeLayer ? S.chipActive : null) }}
          >
            <b>{i + 1}</b> {s.label}{" "}
            <span style={S.coord}>
              ({r2(anchors[i].x)}, {r2(anchors[i].y)})
            </span>
          </button>
        ))}
      </div>

      <div style={S.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={material.detailImage}
          alt={material.name}
          style={S.img}
          onClick={handleClick}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          draggable={false}
        />
        {anchors.map((a, i) => (
          <span
            key={i}
            style={{
              ...S.dot,
              left: `${a.x * 100}%`,
              top: `${a.y * 100}%`,
              outline: i === activeLayer ? "2px solid #fff" : "none",
            }}
          >
            {i + 1}
          </span>
        ))}
      </div>

      <div style={S.readout}>
        {hover ? `cursor: x ${r2(hover.x)}, y ${r2(hover.y)}` : "mișcă mouse-ul peste poză"}
      </div>

      <button onClick={copy} style={S.copyBtn}>
        Copy structure
      </button>
      <pre style={S.pre}>{snippet}</pre>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem 4rem", fontFamily: "system-ui, sans-serif", color: "#2A2420" },
  h1: { fontSize: "1.4rem", margin: "0 0 0.5rem" },
  hint: { fontSize: "0.85rem", lineHeight: 1.5, color: "#6b6258", margin: "0 0 1.25rem" },
  tabs: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" },
  tab: { padding: "0.4rem 0.8rem", borderRadius: "999px", border: "1px solid #d9cfc2", background: "#fff", cursor: "pointer", fontSize: "0.85rem" },
  tabActive: { background: "#2A2420", color: "#fff", borderColor: "#2A2420" },
  layerChips: { display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" },
  chip: { textAlign: "left", padding: "0.5rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #d9cfc2", background: "#fff", cursor: "pointer", fontSize: "0.85rem" },
  chipActive: { borderColor: "#BE9B6B", boxShadow: "0 0 0 2px rgba(190,155,107,0.3)" },
  coord: { color: "#9a9086", fontVariantNumeric: "tabular-nums" },
  stage: { position: "relative", width: "100%", aspectRatio: "3 / 2", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", cursor: "crosshair" },
  img: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", userSelect: "none" },
  dot: { position: "absolute", transform: "translate(-50%, -50%)", width: 22, height: 22, borderRadius: "999px", background: "#BE9B6B", color: "#2A2420", display: "grid", placeItems: "center", fontSize: "0.75rem", fontWeight: 700, boxShadow: "0 0 0 2px #fff", pointerEvents: "none" },
  readout: { marginTop: "0.5rem", fontSize: "0.8rem", color: "#6b6258", fontVariantNumeric: "tabular-nums" },
  copyBtn: { marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "0.6rem", border: "none", background: "#2A2420", color: "#fff", cursor: "pointer", fontSize: "0.85rem" },
  pre: { marginTop: "0.75rem", padding: "1rem", borderRadius: "0.6rem", background: "#f4efe8", overflowX: "auto", fontSize: "0.8rem", lineHeight: 1.5 },
};
