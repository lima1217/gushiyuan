import { describe, expect, it } from "vitest";
import {
  getAllStreamIds,
  getLineageForPoem,
  getSourcePoemSlugsWithLineage,
  getStreamContext,
} from "./lineage";

describe("getLineageForPoem", () => {
  it("returns an empty map while lineage data is offline", () => {
    expect(getLineageForPoem("ji-rang-ge").size).toBe(0);
    expect(getLineageForPoem("yi-shui-ge").size).toBe(0);
  });
});

describe("getStreamContext", () => {
  it("returns undefined while lineage data is offline", () => {
    expect(getStreamContext("chi-bi-fu-yue-ming")).toBeUndefined();
    expect(getStreamContext("not-a-stream")).toBeUndefined();
  });
});

describe("getAllStreamIds", () => {
  it("returns an empty list while lineage data is offline", () => {
    expect(getAllStreamIds()).toEqual([]);
  });
});

describe("getSourcePoemSlugsWithLineage", () => {
  it("returns an empty list while lineage data is offline", () => {
    expect(getSourcePoemSlugsWithLineage()).toEqual([]);
  });
});
