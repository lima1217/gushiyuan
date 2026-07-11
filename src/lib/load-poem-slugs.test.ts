import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loadPoemSlugs", () => {
  it("loads slugs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ["ji-rang-ge"],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadPoemSlugs } = await import("./load-poem-slugs");
    await expect(loadPoemSlugs()).resolves.toEqual(["ji-rang-ge"]);
  });

  it("shares one fetch across repeated calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ["ji-rang-ge", "guan-ju"],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadPoemSlugs } = await import("./load-poem-slugs");
    const [first, second] = await Promise.all([
      loadPoemSlugs(),
      loadPoemSlugs(),
    ]);

    expect(first).toEqual(["ji-rang-ge", "guan-ju"]);
    expect(second).toEqual(["ji-rang-ge", "guan-ju"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects on non-2xx responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadPoemSlugs } = await import("./load-poem-slugs");
    await expect(loadPoemSlugs()).rejects.toThrow(
      /Failed to load poem slugs \(404\)/,
    );
  });

  it("rejects malformed or non-string JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ["ji-rang-ge", 42],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadPoemSlugs } = await import("./load-poem-slugs");
    await expect(loadPoemSlugs()).rejects.toThrow(/Invalid poem slugs artifact/);
  });

  it("clears the cache after failure so a later request can succeed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ["ji-rang-ge"],
      });
    vi.stubGlobal("fetch", fetchMock);

    const { loadPoemSlugs } = await import("./load-poem-slugs");
    await expect(loadPoemSlugs()).rejects.toThrow(
      /Failed to load poem slugs \(500\)/,
    );
    await expect(loadPoemSlugs()).resolves.toEqual(["ji-rang-ge"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
