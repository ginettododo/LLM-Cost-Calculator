import { countCharacters } from "../../counters";
import type { TokenProvider } from "../types";

const ESTIMATED_NOTES = "Heuristic char/4";

export const estimatedTokenProvider: TokenProvider = {
  id: "estimated",
  label: "Estimated (char/4)",
  supportsModel: () => true,
  countTokens: async (text: string) => {
    if (!text) {
      return { tokens: 0, exactness: "estimated", notes: ESTIMATED_NOTES };
    }
    const tokens = Math.ceil(countCharacters(text) / 4);
    return { tokens, exactness: "estimated", notes: ESTIMATED_NOTES };
  },
};
