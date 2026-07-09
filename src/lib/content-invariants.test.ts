import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { getPoemBySlug, getPoemsByVolume } from "./poems";

const POEMS_DIR = path.join(process.cwd(), "content", "poems");
const ALLOWED_PUNCT = /^[\u4e00-\u9fff。、]+$/;

function readGuYiPoemFiles() {
  const slugs = getPoemsByVolume("gu-yi").map((p) => p.slug);
  return slugs.map((slug) => {
    const raw = fs.readFileSync(path.join(POEMS_DIR, `${slug}.md`), "utf-8");
    const { data, content } = matter(raw);
    return { slug, data, body: content.trim() };
  });
}

function parseChapters(body: string): string[][] {
  return body.split(/\n\n+/).map((chapter) =>
    chapter.split("\n").filter((line) => line.trim() !== ""),
  );
}

describe("gu-yi content invariants", () => {
  const poems = readGuYiPoemFiles();

  it("has exactly 103 gu-yi poems", () => {
    expect(poems).toHaveLength(103);
  });

  it("omits base from frontmatter", () => {
    for (const { slug, data } of poems) {
      expect(data.base, `${slug} should not have base field`).toBeUndefined();
    }
  });

  it("uses only period and顿号 punctuation in body lines", () => {
    for (const { slug, body } of poems) {
      for (const line of body.split("\n")) {
        if (!line.trim()) {
          continue;
        }
        expect(ALLOWED_PUNCT.test(line), `${slug}: ${line}`).toBe(true);
      }
    }
  });

  it("ends every body line with a period", () => {
    for (const { slug, body } of poems) {
      for (const line of body.split("\n")) {
        if (!line.trim()) {
          continue;
        }
        expect(line.endsWith("。"), `${slug}: ${line}`).toBe(true);
      }
    }
  });

  it("击壤歌 has five lines", () => {
    const poem = getPoemBySlug("ji-rang-ge");
    expect(poem?.body.split("\n")).toHaveLength(5);
  });

  it("卿云歌 has four lines", () => {
    const poem = getPoemBySlug("qing-yun-ge");
    expect(poem?.body.split("\n")).toHaveLength(4);
  });

  it("孔子诵 has two chapters of four lines each", () => {
    const poem = getPoemBySlug("kong-zi-song");
    expect(poem).toBeDefined();
    const chapters = parseChapters(poem!.body);
    expect(chapters).toHaveLength(2);
    expect(chapters[0]).toHaveLength(4);
    expect(chapters[1]).toHaveLength(4);
  });

  it("水仙操 has four lines and no preface pollution", () => {
    const poem = getPoemBySlug("shui-xian-cao");
    expect(poem?.body.split("\n")).toHaveLength(4);
    expect(poem?.body).not.toMatch(/琴苑要录/);
    expect(poem?.body).not.toMatch(/[，：""]/);
  });

  it("杖铭 retains internal顿号", () => {
    const poem = getPoemBySlug("zhang-ming");
    expect(poem?.body).toContain("、");
  });

  it("越人歌 retains internal顿号", () => {
    const poem = getPoemBySlug("yue-ren-ge");
    expect(poem?.body).toContain("、");
  });
});
