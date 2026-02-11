const DEFAULT_WORD_REGEX =
  /[\p{L}\p{N}]+(?:[\p{M}]+)?(?:['’-][\p{L}\p{N}\p{M}]+)*/gu;

type SegmenterLike = {
  segment: (text: string) => Iterable<{ isWordLike?: boolean }>;
};

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: "word" | "grapheme" },
) => SegmenterLike;

const getSegmenter = (granularity: "word" | "grapheme"): SegmenterLike | null => {
  if (typeof Intl === "undefined") {
    return null;
  }

  const Segmenter = (Intl as { Segmenter?: SegmenterConstructor }).Segmenter;
  if (!Segmenter) {
    return null;
  }

  return new Segmenter(undefined, { granularity });
};

const getWordSegments = (
  text: string,
): Array<{ isWordLike?: boolean }> | null => {
  const segmenter = getSegmenter("word");
  if (!segmenter) {
    return null;
  }

  return Array.from(segmenter.segment(text));
};

export const countCharacters = (text: string): number => text.length;

export const countGraphemes = (text: string): number => {
  const segmenter = getSegmenter("grapheme");
  if (!segmenter) {
    return Array.from(text).length;
  }

  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _segment of segmenter.segment(text)) {
    count += 1;
  }
  return count;
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
