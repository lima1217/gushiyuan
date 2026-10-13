import { describe, expect, it } from "vitest";
import { layoutPoemOgColumns, splitIntoColumns } from "@/lib/poem-og";

const options = {
  titleCharsPerColumn: 4,
  maxTitleColumns: 2,
  bodyCharsPerColumn: 5,
  maxBodyColumns: 3,
};

describe("splitIntoColumns", () => {
  it("chunks characters by column height", () => {
    expect(splitIntoColumns("日出而作日入", 4)).toEqual(["日出而作", "日入"]);
  });
});

describe("layoutPoemOgColumns", () => {
  it("starts each sentence on a new column and strips display punctuation", () => {
    const layout = layoutPoemOgColumns(
      { title: "击壤歌", body: "日出而作。\n日入而息。\n" },
      options,
    );
    expect(layout).toEqual({ title: ["击壤歌"], body: ["日出而作", "日入而息"] });
  });

  it("wraps long sentences and stops at the column budget", () => {
    const layout = layoutPoemOgColumns(
      { title: "击壤歌", body: "帝力于我何有哉。\n凿井而饮。\n耕田而食。" },
      options,
    );
    expect(layout.body).toEqual(["帝力于我何", "有哉", "凿井而饮"]);
  });

  it("truncates overly long titles with an ellipsis", () => {
    const layout = layoutPoemOgColumns(
      { title: "癸卯岁十二月中作与从弟敬远", body: "" },
      options,
    );
    expect(layout.title).toEqual(["癸卯岁十", "二月中…"]);
  });
});
