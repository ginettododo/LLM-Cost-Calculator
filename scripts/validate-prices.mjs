import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { parsePricesFile } from "./pricing-schema.mjs";

const PRICES_PATH = path.resolve(process.cwd(), "src/data/prices.json");

const main = async () => {
  const raw = await fs.readFile(PRICES_PATH, "utf8");
  const json = JSON.parse(raw);
  const parsed = parsePricesFile(json);

  const providers = new Set(parsed.models.map((model) => model.provider));
  console.log(
    `prices.json valid: ${parsed.models.length} models across ${providers.size} providers.`,
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
