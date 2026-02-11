import type { PricingRow } from "./types/pricing";

const selectFractionDigits = (value: number): number => {
  const absValue = Math.abs(value);
  if (absValue === 0) return 2;
  if (absValue >= 1) return 2;
  if (absValue >= 0.01) return 4;
  if (absValue >= 0.0001) return 6;
  return 8;
};

export const formatUSD = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const fractionDigits = selectFractionDigits(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

export type SortKey = keyof PricingRow;

export const sortModels = (
  prices: PricingRow[],
  sortKey: SortKey,
): PricingRow[] => {
  return prices
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const valueA = a.item[sortKey];
      const valueB = b.item[sortKey];

      if (valueA === valueB) {
        return a.index - b.index;
      }

      if (valueA === undefined) {
        return 1;
      }
      if (valueB === undefined) {
        return -1;
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return valueA - valueB;
      }

      return String(valueA).localeCompare(String(valueB));
    })
    .map(({ item }) => item);
};
