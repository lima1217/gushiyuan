# 古诗源

回到原点的古诗阅读站。一屏一首诗，安静、克制。线上站：[https://gsy.aiwayfarer.net](https://gsy.aiwayfarer.net)

选本为清·沈德潜选评《古诗源》（十四卷），底本采用中华书局点校本（中华国学文库版 epub，简体）；站点简体优先，按原书分卷。

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

字体子集生成要用 Python 的 fontTools 来校验 cmap：优先找 `.venv-font/bin/python3`，找不到再用系统 `python3`。依赖装法：`pip install -r requirements.txt`。

```bash
npm run build   # 静态站输出到 out/
npm run lint
npm test
npm run typecheck
npm run verify  # 提交前本地门禁：typecheck + lint + test + build（含 next build）
npm run verify:generated  # 核对已提交的生成产物（字体切片等）与源码一致
```

CI（`.github/workflows/`）在每次 push / PR 上跑 `verify` 和 `verify:generated`。

改界面文案（`src/lib/site-ui-text.ts`、`src/lib/font-ui-literals.ts` 等字体子集输入）时，WenKai 切片的指纹会变。生成的 `src/fonts/wenkai.css`、`src/lib/wenkai-subset-path.generated.ts`、`public/fonts/wenkai/*` 要和源码一起提交，旧指纹的 woff2 一并删掉，详见 `AGENTS.md`。

字体子集、图标字体、检索索引与诗页分享图（`public/og/p/*.png`，不入库）的生成缓存写入本地 `scripts/.cache/`。输入未变时 `predev` / `build` 会跳过生成并打印 cache hit；改内容、转换规则、生成脚本、lockfile 或源字体后自动失效。CI 干净 checkout 仍是冷生成。强制重跑：

```bash
npm run generate:force
# 或 GENERATE_FORCE=1 npm run predev
# 或删除 scripts/.cache 后再 npm run predev
```

## 卷目录配置生成

九个朝代分卷的 `scripts/*-config.mjs` 由统一引擎从 EPUB 生成。需要本机可读的源 EPUB，通过参数或环境变量 `GUSHIYUAN_EPUB` 传入；不要把 EPUB 或机器路径写进仓库。

生成顺序：`han → wei → jin → song → qi → liang → chen → bei-chao → sui`（后卷会预留前卷与古逸的 slug）。

先写到临时目录、语义核对通过后再覆盖已提交配置：

```bash
npm run config:generate -- "$GUSHIYUAN_EPUB" --output-dir /tmp/gushiyuan-configs
npm run config:verify -- /tmp/gushiyuan-configs
```

`config:verify` 必须带候选目录；核对的是 slug、题名、作者、authorSlug、dynasty、mode 与顺序，注释差异可忽略。生成数据、公开 URL 与条目顺序不应在无意中改动。

## 浏览结构

按《古诗源》原书分卷：**卷 → 诗人 → 诗 → 阅读页**。

| 路径 | 说明 |
|------|------|
| `/` | 卷目录 |
| `/v/[volumeSlug]` | 该卷诗人 |
| `/v/[volumeSlug]/[authorSlug]` | 诗作列表 |
| `/p/[slug]` | 阅读页（`#line-N` 定位到第 N 句并短暂高亮） |

只有一首诗的诗人（或分组），卷页直接链到那首诗，显示诗题，不显示「1 首」。诗人分组名与诗题相同时（如《左传》《古诗为焦仲卿妻作》），面包屑省掉诗人这一级。

### 阅读页交互

- 正文竖排，列自右向左。上一首 / 下一首跟着阅读方向走：`←` 或右滑是下一首，`→` 或左滑是上一首；底栏「下一首」放在左边。滑动只在列已经滚到那一侧尽头时才切诗。
- 顶栏有检索（诗题、诗人、诗句；命中诗句时打开 `/p/[slug]#line-N`）、随机一首和简繁切换。
- 触屏设备上，诗超出一屏时列下方显示一条阅读进度细线（纯 CSS，scroll-driven animation）。

## 添加诗作

每首诗一个 Markdown 文件，放在 `content/poems/`。文件名即 URL slug。

必填 frontmatter：`title`、`author`、`authorSlug`、`dynasty`、`volume`（卷 slug 见 `content/volumes.json`）。正文一行一句。

详见 `content/poems/duan-ge-xing.md`。新建 `.md` 后执行 `npm run build`。新卷在 `content/volumes.json` 追加条目。

## 站点图标

朱砂方印「源」，由 `scripts/generate-app-icons.tsx` 生成，不属于构建步骤，产物直接入库。见 `assets/brand/README.md`。

## 部署

静态产物 `out/` 部署到 Cloudflare Pages（`wrangler.toml`）。缓存策略写在 `public/_headers`：带指纹的 chunk 和字体按 immutable 缓存；首页、`/v/*`、`/p/*` 的 HTML 和 RSC payload 缓存 1 小时，并带 stale-while-revalidate。

## 技术栈

Next.js（SSG，`output: export`）、Tailwind CSS、shadcn / Base UI、OpenCC（简繁）、LXGW WenKai 字体（按字频切片子集）。
