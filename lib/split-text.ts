type SplitMode = "chars" | "words" | "lines";

type SplitTextResult = {
  chars: HTMLElement[];
  words: HTMLElement[];
  lines: HTMLElement[];
  revert: () => void;
};

function createSpan(className: string, text: string) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  span.style.display = "inline-block";
  span.style.willChange = "transform";
  return span;
}

export function splitText(
  element: HTMLElement,
  mode: SplitMode = "chars"
): SplitTextResult {
  const original = element.innerHTML;
  const text = element.textContent ?? "";
  const chars: HTMLElement[] = [];
  const words: HTMLElement[] = [];
  const lines: HTMLElement[] = [];

  element.textContent = "";

  if (mode === "lines") {
    const line = createSpan("split-line", text);
    line.style.overflow = "clip";
    element.appendChild(line);
    lines.push(line);

    return {
      chars,
      words,
      lines,
      revert: () => {
        element.innerHTML = original;
      },
    };
  }

  const parts = text.split(/(\s+)/);

  parts.forEach((part) => {
    if (part.trim().length === 0) {
      element.appendChild(document.createTextNode(part));
      return;
    }

    const word = createSpan("split-word", "");
    word.style.overflow = "clip";
    words.push(word);

    if (mode === "words") {
      word.textContent = part;
    } else {
      Array.from(part).forEach((character) => {
        const char = createSpan("split-char", character);
        chars.push(char);
        word.appendChild(char);
      });
    }

    element.appendChild(word);
  });

  return {
    chars,
    words,
    lines,
    revert: () => {
      element.innerHTML = original;
    },
  };
}

export function createHoverText(element: HTMLElement) {
  const original = element.innerHTML;
  const text = element.textContent?.trim() ?? "";

  if (!text) {
    return {
      top: [] as HTMLElement[],
      bottom: [] as HTMLElement[],
      revert: () => {
        element.innerHTML = original;
      },
    };
  }

  element.textContent = "";
  element.style.overflow = "hidden";
  element.style.position = "relative";

  const topWrap = document.createElement("span");
  const bottomWrap = document.createElement("span");
  topWrap.className = "hover-link-top";
  bottomWrap.className = "hover-link-bottom";
  bottomWrap.style.position = "absolute";
  bottomWrap.style.inset = "0 auto auto 0";

  const top = Array.from(text).map((character) =>
    createSpan("hover-link-char", character === " " ? "\u00a0" : character)
  );
  const bottom = Array.from(text).map((character) =>
    createSpan("hover-link-char", character === " " ? "\u00a0" : character)
  );

  top.forEach((char) => topWrap.appendChild(char));
  bottom.forEach((char) => bottomWrap.appendChild(char));
  element.append(topWrap, bottomWrap);

  return {
    top,
    bottom,
    revert: () => {
      element.innerHTML = original;
      element.style.overflow = "";
      element.style.position = "";
    },
  };
}
