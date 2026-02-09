import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { parsePricesFile } from "./pricing-schema.mjs";

const PRICES_PATH = path.resolve(process.cwd(), "src/data/prices.json");

const sortModels = (models) =>
  [...models].sort((a, b) => {
    const providerCompare = a.provider.localeCompare(b.provider);
    if (providerCompare !== 0) {
      return providerCompare;
    }

    return a.model.localeCompare(b.model);
  });

const ensureDateLike = (value, fieldName) => {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid date value in ${fieldName}: ${value}`);
  }
};

const buildCanonicalPrices = (prices) => {
  ensureDateLike(prices.retrieved_at, "retrieved_at");

  const models = sortModels(
    prices.models.map((model) => {
      ensureDateLike(model.retrieved_at, `models(${model.provider}/${model.model}).retrieved_at`);

      return {
        ...model,
        provider: model.provider.trim(),
        model: model.model.trim(),
        currency: model.currency.toUpperCase(),
      };
    }),
  );

  return {
    currency: prices.currency.toUpperCase(),
    retrieved_at: prices.retrieved_at,
    source_url: prices.source_url,
    models,
  };
};

const main = async () => {
  const raw = await fs.readFile(PRICES_PATH, "utf8");
  const parsed = parsePricesFile(JSON.parse(raw));
  const canonical = buildCanonicalPrices(parsed);

  parsePricesFile(canonical);

  const nextRaw = `${JSON.stringify(canonical, null, 2)}\n`;
  if (raw !== nextRaw) {
    await fs.writeFile(PRICES_PATH, nextRaw, "utf8");
    console.log("prices.json canonicalized.");
  } else {
    console.log("prices.json already canonical.");
  }

  const ageDays = Math.floor(
    (Date.now() - new Date(canonical.retrieved_at).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (ageDays > 45) {
    console.warn(
      `pricing data appears stale (${ageDays} days old). Manual source review is recommended.`,
    );
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
