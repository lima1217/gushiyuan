import fs from "fs";
import path from "path";
import { buildSearchIndex } from "../src/lib/search-index";

const SEARCH_OUTPUT_PATH = path.join(process.cwd(), "public/search-index.json");
const SLUGS_OUTPUT_PATH = path.join(process.cwd(), "public/poem-slugs.json");

const index = buildSearchIndex();
const slugs = index.poems.map((poem) => poem.slug);

fs.writeFileSync(SEARCH_OUTPUT_PATH, JSON.stringify(index));
fs.writeFileSync(SLUGS_OUTPUT_PATH, JSON.stringify(slugs));

const searchSizeKiB = fs.statSync(SEARCH_OUTPUT_PATH).size / 1024;
const slugsSizeKiB = fs.statSync(SLUGS_OUTPUT_PATH).size / 1024;
console.log(
  `Generated search-index.json: ${searchSizeKiB.toFixed(1)} KiB (${index.poems.length} poems, ${index.authors.length} authors)`,
);
console.log(
  `Generated poem-slugs.json: ${slugsSizeKiB.toFixed(1)} KiB (${slugs.length} slugs)`,
);
