export interface RenderShowcaseMotion {
  startScale: number;
  endScale: number;
  startX: string;
  endX: string;
  startY: string;
  endY: string;
}

const motionById: Record<string, RenderShowcaseMotion> = {
  baie: {
    startScale: 1.28,
    endScale: 1.04,
    startX: "-3.5%",
    endX: "0%",
    startY: "-4%",
    endY: "0%",
  },
  bucatarie: {
    startScale: 1.3,
    endScale: 1.05,
    startX: "4.5%",
    endX: "0%",
    startY: "2.5%",
    endY: "-1%",
  },
  living: {
    startScale: 1.26,
    endScale: 1.03,
    startX: "3%",
    endX: "0%",
    startY: "4%",
    endY: "0%",
  },
};

const fallbackMotion: RenderShowcaseMotion = {
  startScale: 1.24,
  endScale: 1.02,
  startX: "0%",
  endX: "0%",
  startY: "2.5%",
  endY: "0%",
};

export function getRenderShowcaseMotion(id: string): RenderShowcaseMotion {
  return motionById[id] ?? fallbackMotion;
}
