import fs from "fs";
import path from "path";
import { buildSearchIndex } from "../src/lib/search-index";

const OUTPUT_PATH = path.join(process.cwd(), "public/search-index.json");

const index = buildSearchIndex();
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index));

const sizeKiB = fs.statSync(OUTPUT_PATH).size / 1024;
console.log(
  `Generated search-index.json: ${sizeKiB.toFixed(1)} KiB (${index.poems.length} poems, ${index.authors.length} authors)`,
);
