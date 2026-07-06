import { ImageResponse } from "next/og";

// Branded default social-share card, inherited by every route without its own
// opengraph-image. Per-page images (portfolio/materials) still override this.
export const alt = "Epic Mob Atelier — Mobilier la comandă";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #2A2420 0%, #3a2f26 60%, #C06A3E 100%)",
          padding: "80px",
          color: "#F5F0E8",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#F5F0E8",
            opacity: 0.85,
          }}
        >
          Epic Mob Atelier
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>
            <span>Mobilier premium</span>
            <span>la comandă</span>
          </div>
          <div style={{ fontSize: 34, color: "#EDE4D6", opacity: 0.9 }}>
            Bucătării · Dressinguri · Living · Băi
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, opacity: 0.85 }}>
          <span>Feronerie Blum · Montaj inclus</span>
          <span>epicmob.ro</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
