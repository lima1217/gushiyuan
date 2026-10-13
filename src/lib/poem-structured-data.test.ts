import { describe, expect, it } from "vitest";
import { getPoemBySlug } from "@/lib/poems";
import {
  buildPoemStructuredData,
  isPersonAuthor,
  serializeStructuredData,
} from "@/lib/poem-structured-data";

describe("buildPoemStructuredData", () => {
  it("describes a poem with author, text and canonical url", () => {
    const poem = getPoemBySlug("duan-ge-xing")!;
    const data = buildPoemStructuredData(poem);

    expect(data).toMatchObject({
      "@type": "CreativeWork",
      name: poem.title,
      author: { "@type": "Person", name: poem.author },
      url: "https://gsy.aiwayfarer.net/p/duan-ge-xing",
    });
    expect(data.text).not.toContain("\n");
  });

  it("omits the author when it only repeats the title", () => {
    const poem = getPoemBySlug("gu-shi-wei-jiao-zhong-qing-qi-zuo")!;
    expect(buildPoemStructuredData(poem)).not.toHaveProperty("author");
  });
});

describe("isPersonAuthor", () => {
  it("rejects catalog groupings that are not people", () => {
    for (const author of ["尧时民歌", "古诗十九首", "乐府歌辞", "童谣", "国语", "无名氏", "佚名"]) {
      expect(isPersonAuthor({ author, title: "x" }), author).toBe(false);
    }
  });

  it("accepts named poets", () => {
    for (const author of ["曹操", "陶潜", "唐山夫人", "伊耆氏"]) {
      expect(isPersonAuthor({ author, title: "x" }), author).toBe(true);
    }
  });
});

describe("serializeStructuredData", () => {
  it("escapes < so the payload cannot close the script tag", () => {
    expect(serializeStructuredData({ text: "</script>" })).toBe(
      '{"text":"\\u003c/script>"}',
    );
  });
});
