const DEFAULT_WORD_REGEX =
  /[\p{L}\p{N}]+(?:[\p{M}]+)?(?:['’\-][\p{L}\p{N}\p{M}]+)*/gu;

const getWordSegments = (
  text: string,
): Array<{ isWordLike: boolean }> | null => {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
    return null;
  }

  const segmenter = new Intl.Segmenter(undefined, {
    granularity: "word",
  });

  return Array.from(segmenter.segment(text));
};

export const countCharacters = (text: string): number => text.length;

export const countGraphemes = (text: string): number => {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    let count = 0;
    for (const _segment of segmenter.segment(text)) {
      count += 1;
    }
    return count;
  }

  return Array.from(text).length;
};

export const countWords = (text: string): number => {
  const segments = getWordSegments(text);
  if (segments) {
    return segments.filter((segment) => segment.isWordLike).length;
  }

  const matches = text.match(DEFAULT_WORD_REGEX);
  return matches ? matches.length : 0;
};

export const countLines = (text: string): number => {
  if (text.length === 0) {
    return 0;
  }

  let count = 1;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      count += 1;
    }
  }
  return count;
};

export const countBytesUtf8 = (text: string): number =>
  new TextEncoder().encode(text).length;
