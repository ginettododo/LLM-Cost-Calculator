export type NormalizeOptions = {
  removeInvisible?: boolean;
};

const INVISIBLE_REGEX =
  // eslint-disable-next-line no-misleading-character-class
  /[\u00AD\u034F\u180E\u200B-\u200D\u2060\uFEFF]/g;

export const normalizeText = (
  text: string,
  options: NormalizeOptions = {},
): string => {
  const { removeInvisible = false } = options;

  let result = text.replace(/\r\n?/g, "\n");

  if (removeInvisible) {
    result = result.replace(INVISIBLE_REGEX, "");
  }

  result = result.replace(/[ \t]+/g, " ");

  return result.trim();
};
