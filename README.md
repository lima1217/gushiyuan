# 古诗源

回到原点的古诗阅读站。一屏一首诗，安静、克制。线上站：[https://gsy.aiwayfarer.net](https://gsy.aiwayfarer.net)

选本为清·沈德潜选评《古诗源》（十四卷），底本采用中华书局点校本（中华国学文库版 epub，简体）；站点简体优先，按原书分卷。

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

```bash
npm run build   # 静态站输出到 out/
npm test
npm run typecheck
```

## 浏览结构

按《古诗源》原书分卷：**卷 → 诗人 → 诗 → 阅读页**。

| 路径 | 说明 |
|------|------|
| `/` | 卷目录 |
| `/v/[volumeSlug]` | 该卷诗人 |
| `/v/[volumeSlug]/[authorSlug]` | 诗作列表 |
| `/p/[slug]` | 阅读页 |

## 添加诗作

每首诗一个 Markdown 文件，放在 `content/poems/`。文件名即 URL slug。

必填 frontmatter：`title`、`author`、`authorSlug`、`dynasty`、`volume`（卷 slug 见 `content/volumes.json`）。正文一行一句。

详见 `content/poems/duan-ge-xing.md`。新建 `.md` 后执行 `npm run build`。新卷在 `content/volumes.json` 追加条目。

## 技术栈

Next.js（SSG）、Tailwind CSS、LXGW WenKai 字体。
