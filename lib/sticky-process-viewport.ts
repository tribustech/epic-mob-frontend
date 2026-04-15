export function getStickyProcessViewportHeight({
  innerHeight,
  visualViewportHeight,
}: {
  innerHeight: number;
  visualViewportHeight?: number;
}) {
  return Math.max(visualViewportHeight ?? innerHeight, 1);
}

export function getStickyProcessScrollDistance({
  panelCount,
  viewportHeight,
}: {
  panelCount: number;
  viewportHeight: number;
}) {
  return Math.max(panelCount - 1, 0) * viewportHeight;
}
