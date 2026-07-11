import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { buildSearchIndex } from "../src/lib/search-index";
import type { SearchIndex } from "../src/lib/search-index-types";

const SEARCH_INDEX_PATH = path.join(process.cwd(), "public/search-index.json");
const POEM_SLUGS_PATH = path.join(process.cwd(), "public/poem-slugs.json");
const MAX_POEM_SLUGS_BYTES = 65536;

function readJsonArtifact(artifactPath: string): unknown {
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Missing generated artifact: ${artifactPath}`);
  }

  let raw: string;
  try {
    raw = fs.readFileSync(artifactPath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read generated artifact: ${artifactPath}`, {
      cause: error,
    });
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in generated artifact: ${artifactPath}`, {
      cause: error,
    });
  }
}

function readSearchIndexArtifact(): SearchIndex {
  return readJsonArtifact(SEARCH_INDEX_PATH) as SearchIndex;
}

function readPoemSlugsArtifact(): string[] {
  const parsed = readJsonArtifact(POEM_SLUGS_PATH);
  if (
    !Array.isArray(parsed) ||
    parsed.some((slug) => typeof slug !== "string")
  ) {
    throw new Error(`Invalid poem slugs artifact: ${POEM_SLUGS_PATH}`);
  }
  return parsed;
}

const expected = buildSearchIndex();
const expectedSlugs = expected.poems.map(({ slug }) => slug);

const searchArtifact = readSearchIndexArtifact();
try {
  assert.deepStrictEqual(searchArtifact, expected);
} catch (error) {
  throw new Error(
    `Generated search index does not match buildSearchIndex(): ${SEARCH_INDEX_PATH}`,
    { cause: error },
  );
}

const slugsArtifact = readPoemSlugsArtifact();

const uniqueSlugs = new Set(slugsArtifact);
if (uniqueSlugs.size !== slugsArtifact.length) {
  throw new Error(
    `Generated poem slugs contain duplicates: ${POEM_SLUGS_PATH}`,
  );
}

try {
  assert.deepStrictEqual(slugsArtifact, expectedSlugs);
} catch (error) {
  throw new Error(
    `Generated poem slugs do not match search-index poem order: ${POEM_SLUGS_PATH}`,
    { cause: error },
  );
}

const slugsBytes = fs.statSync(POEM_SLUGS_PATH).size;
if (slugsBytes > MAX_POEM_SLUGS_BYTES) {
  throw new Error(
    `Generated poem slugs exceed ${MAX_POEM_SLUGS_BYTES} bytes (${slugsBytes}): ${POEM_SLUGS_PATH}`,
  );
}

console.log(
  `Generated artifacts verified: ${expected.poems.length} poems, ${expected.authors.length} authors, ${slugsArtifact.length} slugs (${slugsBytes} bytes)`,
);
