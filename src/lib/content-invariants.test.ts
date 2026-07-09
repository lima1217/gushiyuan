import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { getAllVolumes, getPoemBySlug, getPoemsByVolume } from "./poems";

const POEMS_DIR = path.join(process.cwd(), "content", "poems");
const MANIFEST_DIR = path.join(process.cwd(), "content", "volumes");
const ALLOWED_PUNCT = /^[\u4e00-\u9fff。、]+$/;

function getVolumeManifests(): { volumeSlug: string; slugs: string[] }[] {
  const volumes = getAllVolumes();
  return volumes
    .map((volume) => {
      const manifestPath = path.join(
        MANIFEST_DIR,
        `${volume.slug}-manifest.json`,
      );
      if (!fs.existsSync(manifestPath)) {
        return null;
      }
      const slugs = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as string[];
      return { volumeSlug: volume.slug, slugs };
    })
    .filter((entry): entry is { volumeSlug: string; slugs: string[] } =>
      Boolean(entry),
    );
}

function readVolumePoemFiles(volumeSlug: string) {
  const slugs = getPoemsByVolume(volumeSlug).map((p) => p.slug);
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

describe("imported volume content invariants", () => {
  const manifests = getVolumeManifests();

  it("has at least one imported volume manifest", () => {
    expect(manifests.length).toBeGreaterThanOrEqual(1);
  });

  for (const { volumeSlug, slugs } of manifests) {
    describe(`${volumeSlug} volume`, () => {
      const poems = readVolumePoemFiles(volumeSlug);

      it(`has ${slugs.length} poems matching manifest`, () => {
        expect(poems).toHaveLength(slugs.length);
        expect(poems.map((p) => p.slug)).toEqual(slugs);
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
    });
  }
});

describe("gu-yi spot checks", () => {
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

describe("han volume spot checks", () => {
  it("大风歌 has three lines in one chapter", () => {
    const poem = getPoemBySlug("da-feng-ge");
    expect(poem).toBeDefined();
    expect(poem?.volume).toBe("han");
    const chapters = parseChapters(poem!.body);
    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toHaveLength(3);
  });

  it("安世房中歌 has sixteen chapters", () => {
    const poem = getPoemBySlug("an-shi-fang-zhong-ge");
    expect(poem).toBeDefined();
    expect(parseChapters(poem!.body)).toHaveLength(16);
  });

  it("行行重行行 has sixteen lines and restored slug", () => {
    const poem = getPoemBySlug("xing-xing-chong-xing-xing");
    expect(poem).toBeDefined();
    expect(poem?.title).toBe("行行重行行");
    expect(poem?.author).toBe("古诗十九首");
    expect(poem?.body.split("\n")).toHaveLength(16);
  });

  it("reuses pre-#29 slugs for restored Han poems", () => {
    for (const slug of [
      "chang-ge-xing",
      "mo-shang-sang",
      "shang-xie",
      "qing-qing-he-pan-cao",
      "she-jiang-cai-fu-rong",
      "xi-bei-you-gao-lou",
    ]) {
      expect(getPoemBySlug(slug)?.volume).toBe("han");
    }
  });
});

describe("jin volume spot checks", () => {
  it("左思咏史八首 has eight chapters", () => {
    const poem = getPoemBySlug("yong-shi-ba-shou");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("左思");
    expect(poem?.volume).toBe("jin");
    expect(parseChapters(poem!.body)).toHaveLength(8);
  });

  it("陶潜饮酒 has ten chapters without preface pollution", () => {
    const poem = getPoemBySlug("yin-jiu");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("陶潜");
    expect(parseChapters(poem!.body)).toHaveLength(10);
    expect(poem?.body).not.toMatch(/余闲居寡欢/);
  });

  it("刘琨答卢谌 has eight chapters without letter preface", () => {
    const poem = getPoemBySlug("da-lu-chen");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("刘琨");
    expect(parseChapters(poem!.body)).toHaveLength(8);
    expect(poem?.body).not.toMatch(/琨顿首/);
  });

  it("uses disambiguated slugs for cross-volume title collisions", () => {
    expect(getPoemBySlug("fu-xuan-duan-ge-xing")?.volume).toBe("jin");
    expect(getPoemBySlug("duan-ge-xing")?.volume).toBe("wei");
    expect(getPoemBySlug("zhang-hua-za-shi")?.volume).toBe("jin");
    expect(getPoemBySlug("za-shi")?.volume).toBe("han");
  });
});

describe("wei volume spot checks", () => {
  it("短歌行 has restored slug and belongs to 武帝", () => {
    const poem = getPoemBySlug("duan-ge-xing");
    expect(poem).toBeDefined();
    expect(poem?.title).toBe("短歌行");
    expect(poem?.author).toBe("武帝");
    expect(poem?.volume).toBe("wei");
    expect(poem?.body.split("\n").length).toBeGreaterThan(20);
  });

  it("王粲七哀诗 has three chapters", () => {
    const poem = getPoemBySlug("wang-can-qi-ai-shi");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("王粲");
    expect(parseChapters(poem!.body)).toHaveLength(3);
  });

  it("阮籍咏怀 has twenty chapters", () => {
    const poem = getPoemBySlug("yong-huai");
    expect(poem).toBeDefined();
    expect(parseChapters(poem!.body)).toHaveLength(20);
  });

  it("reuses pre-#29 slugs for restored Wei poems", () => {
    for (const slug of [
      "duan-ge-xing",
      "guan-cang-hai",
      "gui-sui-shou",
      "hao-li-xing",
    ]) {
      expect(getPoemBySlug(slug)?.volume).toBe("wei");
    }
  });
});

describe("song volume spot checks", () => {
  it("鲍照拟行路难 has six chapters", () => {
    const poem = getPoemBySlug("ni-xing-lu-nan");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("鲍照");
    expect(poem?.volume).toBe("song");
    expect(parseChapters(poem!.body)).toHaveLength(6);
  });

  it("颜延之秋胡诗九首 has nine chapters", () => {
    const poem = getPoemBySlug("qiu-hu-shi-jiu-shou");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("颜延之");
    expect(parseChapters(poem!.body)).toHaveLength(9);
  });

  it("鲍照代白纻舞歌辞四首 has four chapters", () => {
    const poem = getPoemBySlug("dai-bai-zhu-wu-ge-ci-si-shou");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("鲍照");
    expect(parseChapters(poem!.body)).toHaveLength(4);
  });

  it("uses disambiguated slugs for cross-volume title collisions", () => {
    expect(getPoemBySlug("bao-zhao-ni-gu")?.volume).toBe("song");
    expect(getPoemBySlug("ni-gu")?.volume).toBe("jin");
    expect(getPoemBySlug("wang-hui-za-shi")?.volume).toBe("song");
    expect(getPoemBySlug("za-shi")?.volume).toBe("han");
  });

  it("lists 渔父 as a catalog node with four folk songs", () => {
    const poems = getPoemsByVolume("song").filter((p) => p.author === "渔父");
    expect(poems).toHaveLength(4);
    expect(poems.map((p) => p.slug)).toEqual([
      "da-sun-mian-ge",
      "song-ren-ge",
      "shi-cheng-yao",
      "qing-xi-xiao-gu-ge",
    ]);
  });
});

describe("qi volume spot checks", () => {
  it("谢朓玉阶怨 has four lines in one chapter", () => {
    const poem = getPoemBySlug("yu-jie-yuan");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("谢朓");
    expect(poem?.volume).toBe("qi");
    expect(parseChapters(poem!.body)).toEqual([
      [
        "夕殿下珠帘。",
        "流萤飞复息。",
        "长夜缝罗衣。",
        "思君此何极。",
      ],
    ]);
  });

  it("王融和王友德元古意二首 has two chapters", () => {
    const poem = getPoemBySlug("he-wang-you-de-yuan-gu-yi-er-shou");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("王融");
    expect(parseChapters(poem!.body)).toHaveLength(2);
  });

  it("uses disambiguated slugs for cross-volume title collisions", () => {
    expect(getPoemBySlug("xie-tiao-qiu-ye")?.volume).toBe("qi");
    expect(getPoemBySlug("qiu-ye")?.volume).toBe("song");
    expect(getPoemBySlug("zhang-rong-bie-shi")?.volume).toBe("qi");
    expect(getPoemBySlug("bie-shi")?.volume).toBe("wei");
    expect(getPoemBySlug("liu-hui-you-suo-si")?.volume).toBe("qi");
    expect(getPoemBySlug("you-suo-si")?.volume).toBe("han");
  });
});

describe("liang volume spot checks", () => {
  it("何逊相送 has four lines in one chapter", () => {
    const poem = getPoemBySlug("xiang-song");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("何逊");
    expect(poem?.volume).toBe("liang");
    expect(parseChapters(poem!.body)).toEqual([
      [
        "客心已百念。",
        "孤游重千里。",
        "江暗雨欲来。",
        "浪白风初起。",
      ],
    ]);
  });

  it("柳恽捣衣诗 has four chapters", () => {
    const poem = getPoemBySlug("dao-yi-shi");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("柳恽");
    expect(parseChapters(poem!.body)).toHaveLength(4);
  });

  it("江淹效阮公诗 has five chapters", () => {
    const poem = getPoemBySlug("xiao-ruan-gong-shi");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("江淹");
    expect(parseChapters(poem!.body)).toHaveLength(5);
  });

  it("uses disambiguated slugs for cross-volume title collisions", () => {
    expect(getPoemBySlug("fan-yun-bie-shi")?.volume).toBe("liang");
    expect(getPoemBySlug("bie-shi")?.volume).toBe("wei");
    expect(getPoemBySlug("fan-yun-you-suo-si")?.volume).toBe("liang");
    expect(getPoemBySlug("you-suo-si")?.volume).toBe("han");
    expect(getPoemBySlug("jian-wen-di-lin-gao-tai")?.volume).toBe("liang");
    expect(getPoemBySlug("lin-gao-tai")?.volume).toBe("han");
    expect(getPoemBySlug("jian-wen-di-zhe-yang-liu")?.volume).toBe("liang");
    expect(getPoemBySlug("yuan-di-zhe-yang-liu")?.volume).toBe("liang");
  });

  it("lists 乐府歌辞 as a catalog node with eight folk songs", () => {
    const poems = getPoemsByVolume("liang").filter((p) => p.author === "乐府歌辞");
    expect(poems).toHaveLength(8);
    expect(poems.map((p) => p.slug)).toEqual([
      "qi-yu-ge",
      "you-zhou-ma-ke-yin-ge-ci",
      "lang-ya-wang-ge-ci",
      "ju-lu-gong-zhu-ge-ci",
      "long-tou-ge-ci",
      "zhe-yang-liu-ge-ci",
      "mu-lan-shi",
      "zhuo-nuo-ge",
    ]);
  });
});

describe("chen volume spot checks", () => {
  it("江总于长安归还扬州九月九日行薇山亭赋韵 has four lines in one chapter", () => {
    const poem = getPoemBySlug(
      "yu-chang-an-gui-huan-yang-zhou-jiu-yue-jiu-ri-xing-wei-shan-ting-fu-yun",
    );
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("江总");
    expect(poem?.volume).toBe("chen");
    expect(parseChapters(poem!.body)).toEqual([
      [
        "心逐南云逝。",
        "形随北雁来。",
        "故乡篱下菊。",
        "今日几花开。",
      ],
    ]);
  });

  it("阴铿渡青草湖 has twelve lines in one chapter", () => {
    const poem = getPoemBySlug("du-qing-cao-hu");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("阴铿");
    expect(parseChapters(poem!.body)).toEqual([
      [
        "洞庭春溜满。",
        "平湖锦帆张。",
        "沅水桃花色。",
        "湘流杜若香。",
        "穴去茅山近。",
        "江连巫峡长。",
        "带天澄迥碧。",
        "映日动浮光。",
        "行舟逗远树。",
        "度鸟息危樯。",
        "滔滔不可测。",
        "一苇讵能航。",
      ],
    ]);
  });

  it("uses disambiguated slugs for duplicate 关山月 titles", () => {
    expect(getPoemBySlug("xu-ling-guan-shan-yue")?.author).toBe("徐陵");
    expect(getPoemBySlug("zhang-zheng-jian-guan-shan-yue")?.author).toBe(
      "张正见",
    );
  });
});

describe("bei-chao volume spot checks", () => {
  it("敕勒歌 has seven lines and dynasty 北齐", () => {
    const poem = getPoemBySlug("chi-le-ge");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("斛律金");
    expect(poem?.dynasty).toBe("北齐");
    expect(poem?.volume).toBe("bei-chao");
    expect(poem?.body.split("\n")).toHaveLength(7);
  });

  it("庾信拟咏怀 has eight chapters with dynasty 北周", () => {
    const poem = getPoemBySlug("ni-yong-huai");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("庾信");
    expect(poem?.dynasty).toBe("北周");
    expect(parseChapters(poem!.body)).toHaveLength(8);
  });

  it("uses per-dynasty frontmatter across 北魏/北齐/北周 sections", () => {
    expect(getPoemBySlug("duan-ju")?.dynasty).toBe("北魏");
    expect(getPoemBySlug("chi-le-ge")?.dynasty).toBe("北齐");
    expect(getPoemBySlug("du-he-bei")?.dynasty).toBe("北周");
  });

  it("uses disambiguated slugs for cross-volume title collisions", () => {
    expect(getPoemBySlug("zu-ting-wan-ge")?.volume).toBe("bei-chao");
    expect(getPoemBySlug("wan-ge")?.volume).toBe("wei");
    expect(getPoemBySlug("yan-zhi-tui-gu-yi")?.volume).toBe("bei-chao");
    expect(getPoemBySlug("gu-yi")?.volume).toBe("liang");
    expect(getPoemBySlug("chang-jing-wang-bao")?.author).toBe("常景");
    expect(getPoemBySlug("du-he-bei")?.author).toBe("王褒");
  });

  it("lists 杂歌谣辞 as a catalog node with three folk songs", () => {
    const poems = getPoemsByVolume("bei-chao").filter(
      (p) => p.author === "杂歌谣辞",
    );
    expect(poems).toHaveLength(3);
    expect(poems.map((p) => p.slug)).toEqual([
      "xian-yang-wang-ge",
      "li-bo-xiao-mei-ge",
      "tong-yao",
    ]);
  });
});

describe("sui volume spot checks", () => {
  it("薛道衡昔昔盐 has twenty lines in one chapter", () => {
    const poem = getPoemBySlug("xi-xi-yan");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("薛道衡");
    expect(poem?.volume).toBe("sui");
    expect(parseChapters(poem!.body)).toEqual([
      [
        "垂柳覆金堤。",
        "蘼芜叶复齐。",
        "水溢芙蓉沼。",
        "花飞桃李蹊。",
        "采桑秦氏女。",
        "织锦窦家妻。",
        "关山别荡子。",
        "风月守空闺。",
        "恒敛千金笑。",
        "长垂双玉啼。",
        "盘龙随镜隐。",
        "彩凤逐帷低。",
        "飞魂同夜鹊。",
        "倦寝忆晨鸡。",
        "暗牖悬蛛网。",
        "空梁落燕泥。",
        "前年过代北。",
        "今岁往辽西。",
        "一去无消息。",
        "那能惜马蹄。",
      ],
    ]);
  });

  it("杨素赠薛播州 has nine chapters", () => {
    const poem = getPoemBySlug("zeng-xue-bo-zhou");
    expect(poem).toBeDefined();
    expect(poem?.author).toBe("杨素");
    expect(poem?.volume).toBe("sui");
    expect(parseChapters(poem!.body)).toHaveLength(9);
  });

  it("uses disambiguated slug for 炀帝白马篇", () => {
    expect(getPoemBySlug("yang-di-bai-ma-pian")?.author).toBe("炀帝");
    expect(getPoemBySlug("yang-di-bai-ma-pian")?.volume).toBe("sui");
    expect(getPoemBySlug("bai-ma-pian")?.volume).toBe("wei");
  });

  it("lists 无名氏 as a catalog node with two folk songs", () => {
    const poems = getPoemsByVolume("sui").filter(
      (p) => p.author === "无名氏",
    );
    expect(poems).toHaveLength(2);
    expect(poems.map((p) => p.slug)).toEqual(["song-bie-shi", "ji-ming-ge"]);
  });
});
