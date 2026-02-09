const FNV_OFFSET_BASIS_32 = 0x811c9dc5;
const FNV_PRIME_32 = 0x01000193;

export const hashText = (text: string): string => {
  let hash = FNV_OFFSET_BASIS_32;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME_32);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const stableTextKey = (text: string): string => `${text.length}:${hashText(text)}`;
