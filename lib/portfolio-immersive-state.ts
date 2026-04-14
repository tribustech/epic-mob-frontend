interface ImmersiveScrollStateInput {
  scrollY: number;
  sectionTop: number;
  step: number;
  slideCount: number;
}

interface ImmersiveScrollState {
  currentIndex: number;
  nextIndex: number;
  progress: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getImmersiveSectionHeight(slideCount: number, step: number) {
  return Math.max(slideCount, 1) * step;
}

export function getImmersiveScrollState({
  scrollY,
  sectionTop,
  step,
  slideCount,
}: ImmersiveScrollStateInput): ImmersiveScrollState {
  if (slideCount <= 1 || step <= 0) {
    return { currentIndex: 0, nextIndex: 0, progress: 1 };
  }

  const maxScroll = getImmersiveSectionHeight(slideCount, step);
  const relativeScroll = clamp(scrollY - sectionTop, 0, maxScroll);
  const cappedScroll = Math.min(relativeScroll, maxScroll - 1);
  const currentIndex = Math.min(Math.floor(cappedScroll / step), slideCount - 1);

  if (currentIndex >= slideCount - 1) {
    return { currentIndex: slideCount - 1, nextIndex: slideCount - 1, progress: 1 };
  }

  return {
    currentIndex,
    nextIndex: currentIndex + 1,
    progress: (cappedScroll % step) / step,
  };
}
