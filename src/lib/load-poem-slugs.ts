export const POEM_SLUGS_URL = "/poem-slugs.json";

let poemSlugsPromise: Promise<readonly string[]> | null = null;

function parsePoemSlugs(payload: unknown): readonly string[] {
  if (
    !Array.isArray(payload) ||
    payload.some((slug) => typeof slug !== "string")
  ) {
    throw new Error("Invalid poem slugs artifact");
  }
  return payload;
}

export function loadPoemSlugs(): Promise<readonly string[]> {
  if (poemSlugsPromise) {
    return poemSlugsPromise;
  }

  poemSlugsPromise = fetch(POEM_SLUGS_URL)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load poem slugs (${response.status})`);
      }
      return parsePoemSlugs(await response.json());
    })
    .catch((error) => {
      poemSlugsPromise = null;
      throw error;
    });

  return poemSlugsPromise;
}
