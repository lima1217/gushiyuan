/** 诗页分享卡片（OG image）：构建期由 scripts/generate-og-images.tsx 生成到 public/og/p。 */
export const POEM_OG_IMAGE_WIDTH = 1200;
export const POEM_OG_IMAGE_HEIGHT = 630;

export function poemOgImagePath(slug: string): string {
  return `/og/p/${slug}.png`;
}

export type PoemOgColumns = {
  title: string[];
  body: string[];
};

export type PoemOgLayoutOptions = {
  titleCharsPerColumn: number;
  maxTitleColumns: number;
  bodyCharsPerColumn: number;
  maxBodyColumns: number;
};

/** 按固定列高切竖排列；与正文显示层一致，去掉「。」「、」。 */
export function splitIntoColumns(text: string, charsPerColumn: number): string[] {
  const chars = [...text];
  const columns: string[] = [];
  for (let i = 0; i < chars.length; i += charsPerColumn) {
    columns.push(chars.slice(i, i + charsPerColumn).join(""));
  }
  return columns;
}

function stripDisplayPunctuation(text: string): string {
  return text.replace(/[。、]/g, "");
}

/**
 * 题名最多 maxTitleColumns 列（超出以「…」收尾）；正文一句起一列、长句回行，
 * 取到 maxBodyColumns 列为止，作为卡片上的节选。
 */
export function layoutPoemOgColumns(
  poem: { title: string; body: string },
  options: PoemOgLayoutOptions,
): PoemOgColumns {
  let title = splitIntoColumns(poem.title, options.titleCharsPerColumn);
  if (title.length > options.maxTitleColumns) {
    title = title.slice(0, options.maxTitleColumns);
    const last = [...title[title.length - 1]!];
    last[last.length - 1] = "…";
    title[title.length - 1] = last.join("");
  }

  const body: string[] = [];
  for (const line of poem.body.split("\n")) {
    const sentence = stripDisplayPunctuation(line.trim());
    if (!sentence) {
      continue;
    }
    for (const column of splitIntoColumns(sentence, options.bodyCharsPerColumn)) {
      if (body.length >= options.maxBodyColumns) {
        return { title, body };
      }
      body.push(column);
    }
  }

  return { title, body };
}
