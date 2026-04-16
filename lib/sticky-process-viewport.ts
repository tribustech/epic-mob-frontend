export function getStickyProcessViewportHeight({
  innerHeight,
  visualViewportHeight,
  headerHeight,
}: {
  innerHeight: number;
  visualViewportHeight?: number;
  headerHeight: number;
}) {
  const base = visualViewportHeight ?? innerHeight;
  return Math.max(base - headerHeight, 1);
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
