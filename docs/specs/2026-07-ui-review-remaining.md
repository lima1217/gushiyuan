# 界面审查遗留项 · 2026-07

> **状态（2026-10-13）：** 批次 A / B / C / D 已全部完成：A 见 bd7450c、c5eb284；B 见 6e4ef70；C 见 5b0b003（#48）、c7138c7；D-2 见 75032f9。下文的待修条目只作历史记录，行号已过时。**仍有效的只有末尾三条「暂缓项」**：源流 UI 现在由 `LINEAGE_UI_ENABLED` 关着（`src/lib/lineage.ts`），打开开关前必须先修完这三条。

## 这份文档是什么

2026-07 对全站做了一轮六域界面审查（accessibility / layout / writing / typography / colors / ui），共产出约 45 条 findings。其中 HIGH 与部分 MEDIUM 共 17 条已实施并在浏览器中验收通过；本文档收录**尚未实施**的部分：**18 条待修**（批次 A/B/C/D）+ **3 条暂缓**（源流功能相关，见末尾）。

行号均已按当前代码核对。若你在动手时发现行号漂移，以选择器/标识符为准，不要盲信行号。

## 动手前必读

### 既定决策（红线，不得违反）

- 诗页正文**只有竖排**（ADR 0005）。不要提供横排切换，不要在窄屏退回横排。
- 正文显示层**不出现「。」「、」**（ADR 0005 第 5 条）。界面 chrome 文案可以正常使用标点。
- 简体 Markdown 是唯一权威内容源，繁体由构建期 OpenCC 派生（ADR 0003 / 0004）。
- 「纸墨」单色低对比是刻意的设计立场。只修可确证低于门槛的具体像素，不要提高整体视觉冲击力、不要引入强调色。

### 文案改动的连带义务

`src/lib/font-ui-literals.ts` 的 `FONT_UI_LITERALS` 由 `SITE_UI_TEXT_SIMPLIFIED` 派生，字体子集按这些字形生成。**只要改动或新增任何界面中文文案，就必须重跑 `npm run font:subset:force`**，否则新字会掉到回退字体；生成后跑 `npm run verify:generated` 确认产物一致。`font:subset` 需要 `.venv-font` 里的 python。

### 验证方式

```
npm run verify           # typecheck + lint + test + build（含 next build；见 D-2）
```

视觉验收**不要依赖 `npm run dev`**（该进程在 agent shell 里会被回收）。改用静态产物：

```
npm run build
cd out && python3 -m http.server 4173
```

关键页面：短诗 `/p/ji-rang-ge.html`、长诗 `/p/gu-shi-wei-jiao-zhong-qing-qi-zuo.html`、长题 `/p/gui-mao-sui-shi-er-yue-zhong-zuo-yu-cong-di-jing-yuan.html`、目录 `/v/gu-yi.html`、首页、404。

### 批次与文件所有权

上一轮两个 agent 并行时因为 `src/lib/site-ui-text.ts` 被客户端组件值引用，把 `fs` 拖进了客户端 bundle，全站 500。**批次之间必须串行或严格隔离文件所有权**：

| 批次 | 可写文件 | 说明 |
| --- | --- | --- |
| A | `src/app/globals.css` | 纯 CSS，10 条 |
| B | `src/components/**`、`src/lib/*.ts`、`src/app/**/page.tsx` | 组件与文案，3 条 |
| C | 跨 CSS + TSX | 4 条，**必须在 A、B 都合并后单独跑**，不可与 A/B 并行 |
| D | 工程 | 1 条，与 UI 无关，可随时并行 |

A 与 B 可以并行，但 B 若新增被客户端组件引用的运行时导出，必须确认该模块没有服务端依赖（`src/lib/site-ui-text.ts` → `site-metadata.ts` → `poems.ts` → `fs` 这条链已被 `src/lib/site-identity.ts` 与 `src/lib/format-site-ui-count.ts` 切断，不要重新接上）。

### 不要追的误报

审查提出但已在浏览器中验证**不成立**的，不要再改：

| 条目 | 实测结论 |
| --- | --- |
| 检索面板 Esc 关闭后焦点丢失（`SiteSearch.tsx` 条件渲染卸载 Dialog） | Esc 后 `document.activeElement` 正确回到「打开检索」按钮 |
| 简繁双份文本导致屏幕阅读器重复朗读或复制出两份 | `display: none` 子树不进无障碍树也不进选区 |
| 顶栏图标按钮 28×28 命中区不足 | 满足 WCAG 2.5.8 的 24×24；coarse 指针下已扩到 44px 且间距 20px 不重叠 |
| 逐字 span 导致屏幕阅读器逐字朗读 | 已修：真实无障碍树中每句是一个 `StaticText`，单字节点为 0 |

---

## 批次 A · 仅改 `src/app/globals.css`

### A-1（MEDIUM · Typography）font-smoothing 在两处被改回 subpixel

- 位置：`globals.css:799-800`、`848-849`；根节点设定在 `:133`
- 现状：根节点是 `antialiased` + `grayscale`，而 `.catalog__title` 与 `.catalog__link` 覆盖为 `-webkit-font-smoothing: subpixel-antialiased; -moz-osx-font-smoothing: auto`。
- 目标：删除这两处覆盖，全站沿用根节点设定。
- 为什么：同一屏内目录标题与条目的笔画比面包屑、卷元信息更重，中文细笔画在文楷上尤其明显，读作两种字重。font-smoothing 应当只在根节点设一次。
- 验收：目录页 `/v/gu-yi.html` 的条目字重与顶栏面包屑观感一致。

### A-2（MEDIUM · Typography）`letter-spacing` 在列尾多出一份字距

- 位置：`globals.css:602`、`682`、`689`、`718`（用 `letter-spacing: var(--vertical-char-track)`）；对照 `:698`、`706`（同一 token 用 `gap`）
- 现状：栏内回行与诗题用 `letter-spacing` 制造字距，而「一句一列」版式用逐字盒 + `gap`。
- 目标：给用 `letter-spacing` 的竖排容器补偿末字尾距（例如容器上加 `margin-block-end: calc(-1 * var(--vertical-char-track))`），或统一改用 `gap` 方案。
- 为什么：`letter-spacing` 在最后一字之后也加一份间距，竖排下它落在**列尾**，视觉上列底多出约 0.2em 空白，使各列长度与居中基线不齐；同页两套版式因此收尾不一致。
- 验收：长诗页任取相邻两列，用 `getBoundingClientRect()` 比较列底位置一致；短题诗页外观不变。

### A-3（MEDIUM · Typography）辅助文字成片落在 10–11px

- 位置：`globals.css:333`（0.625rem = 10px）、`271`、`315`、`327`、`383`、`1181`（均 0.6875rem = 11px）
- 现状：源流浮层出处 10px，关系值、元信息、上下首标签 11px。
- 目标：这些角色抬到 `0.75rem`（12px）为下限，层级差改由色阶与字重承担。
- 为什么：中文在 10–11px 上笔画粘连；这些角色已经使用了 `--color-ink-muted`（5.42:1），继续缩字号是唯一还在恶化可读性的维度。
- 注意：`:333` 属于 `.lineage-hint__source`（源流浮层）。源流功能暂不实现、浮层无触发点，这一处照改但**无法在浏览器里验收**；其余五处都在正常页面上。`:401`、`:404` 那两处会随 A-11 删除，不必单独处理。
- 验收：全站不再有小于 12px 的正文类字号（`--radius` 等非字号用途的 0.625rem 不算）。

### A-4（LOW · Typography）字号没有阶梯 token

- 位置：`globals.css:76` 起的 `@theme inline`（无字号 token）；散见 `:271`、`315`、`327`、`333`、`383`、`1181` 等十余处一次性字号
- 现状：`0.95rem`、`1.1875rem`、`0.8125rem`、`0.6875rem`、`0.625rem` 等互不成阶。
- 目标：在 `@theme` 定义一组角色化 token（如 `--text-title` / `--text-body` / `--text-meta` / `--text-caption`，各自绑定行高），各规则改引用。
- 为什么：现在新增界面无从判断该用哪一档，层级差异靠个别 0.05rem 维持，难以保持一致。
- 依赖：在 A-3 之后做，避免两次改同一批行。

### A-5（MEDIUM · Colors）`.dark` 是死代码，且全站未声明 `color-scheme`

- 位置：`globals.css:1302` 起整块 `.dark { … }`（约 33 行）；`@custom-variant dark` 在 `:6`；`:root` 在 `:26` 起
- 现状：全仓无任何位置添加 `.dark` 类，也没有 `prefers-color-scheme`。已实测：模拟系统暗色时 `matchMedia('(prefers-color-scheme: dark)')` 为 true，但 body 背景仍是 `#faf8f4`、文字仍是 ink，站点完全不响应。`.dark` 只改 shadcn 的 oklch 中性 token，而 body 前景/背景硬编码为 paper/ink，即便类被加上也不会变暗。
- 目标：删除 `.dark` 块与 `dark` variant，并在 `:root` 显式声明 `color-scheme: light`。
- 为什么：更实际的后果不是死代码本身，而是未声明 `color-scheme` 时，暗色 OS 下 UA 会把滚动条与检索输入框的原生 chrome 渲染成深色，压在纸色底上。
- 决策前提：这条按「站点不做暗色」处理。若产品上要做暗色，须为 `--color-paper` / `--color-ink` 增设暗色变体并复核每一对前景/背景——那是另一件事，不要在这条里顺手实现。

### A-6（MEDIUM · UI）目录链接 hover 方向与全站相反

- 位置：`globals.css:855-856`（`.catalog__link:hover` → `var(--color-ink-muted)`）；对照 `.breadcrumbs__link`、`.poem-nav__link`、`.site-logo`、`.site-chrome__control` 的 hover 都是由 muted 加深到 ink
- 现状：目录链接 hover 后对比度从 13.5:1 **掉到** 5.42:1（变淡），其余同类链接 hover 后从 5.42:1 **升到** 13.5:1（变深）。
- 目标：目录链接本已是 ink，hover 改为补一层极轻背景（复用 `.site-chrome__control:hover` 的 6% 值）而非降低对比。
- 为什么：用户学到的「hover = 变深」在链接密度最高的目录页失效。
- 验收：目录页 hover 后文字对比度不下降。

### A-7（MEDIUM · UI）诗页切换动效 270ms 且入场用 `ease-in`

- 位置：`globals.css:1220-1225`
- 现状：`::view-transition-old(poem-reading)` 是 `150ms ease-out`，`::view-transition-new(poem-reading)` 是 `200ms ease-in 70ms both`，总时长 150 + 70 + 200 = 270ms。
- 目标：新视图改为 `150ms ease-out both`，去掉 70ms 延迟，总时长回到约 150ms。
- 为什么：诗页切换由方向键、上/下一首、随机诗三处触发，属高频交互；`ease-in` 起步慢、观感发黏，enter/exit 应一律 `ease-out`。
- 验收：连续按方向键翻诗时不再有黏滞感；`prefers-reduced-motion` 分支（`:1282`）行为不变。

### A-8（LOW · UI）`:target` 高亮 2.4s 且无法重播

- 位置：`globals.css:435-439`（`animation: lineage-target 2.4s ease`），keyframes 在 `:442`，reduced-motion 覆盖在 `:1266`
- 现状：锚点高亮 2.4 秒；用 keyframes 实现，再次跳转同一锚点不会重播。
- 目标：压到约 800ms。重播问题可暂不解决，但若成本低（例如改用 transition + JS 触发之外的纯 CSS 手段无解，则记录为已知限制）。
- 为什么：2.4s 远超「短促精确」的动效预算。

### A-9 已暂缓

源流句 hover 过渡缺失，见末尾「暂缓项」。原 A-9 编号保留不复用。

### A-10（LOW · Layout）底栏导航是同屏第三条对齐边

- 位置：`globals.css:751-753`（`.poem-reader__vertical-foot { max-width: 36rem; margin-inline: auto; }`）
- 现状：顶栏面包屑/控件对齐 `--page-gutter`，正文列按 `clamp(1rem, 4vw, 2rem)` 内缩，底部导航又是 36rem 居中。
- 目标：去掉 `max-width` / `margin-inline: auto`，让底栏与 `.poem-reader` 的 `padding-inline` 共用同一条左右边；若需限制单条链接宽度，改在 `.poem-nav__title` 上加 `max-width`。
- 为什么：一屏三条互不相干的对齐边是可省掉的视觉噪声。
- 验收：桌面与 375px 下，底栏「上一首/下一首」左右边与顶栏控件对齐。

### A-11（LOW）`.lineage-page__*` 是死 CSS

- 位置：`globals.css` 中 14 处 `.lineage-page__*`，从 `:339` 的注释「/* 流句展示页 */」起（含 `:401` 的孤例 `transition: color 160ms ease` 与 `:404-405` 的另一处 hover 变淡）
- 现状：`src/` 下没有任何 TSX 使用这些类名，对应的 `/l/[id]` 路由也从未存在。
- 目标：删除整组规则。
- 收益：顺带消掉全站唯一的 `160ms` / 裸 `ease` 孤例，以及 A-6 之外的第二处 hover 变淡。
- **只删 `.lineage-page__*`，保留 `.lineage-hint__*`**（13 条，源流浮层样式，被 `LineageHint.tsx` 引用，功能休眠但代码在用）。这两组名字相近，别删错。
- 与源流决策无关：即便将来实现源流功能，这套是给一个从未存在过的独立页面写的，届时按新设计重写即可（git 有历史）。

---

## 批次 B · 仅改 `src/components/**`、`src/lib/*.ts`、`src/app/**/page.tsx`

### B-1 已暂缓

源流句 `aria-label` 盖掉诗句原文，见末尾「暂缓项」。原 B-1 编号保留不复用。

### B-2（MEDIUM · Writing）简繁切换按钮显示的是现状而非动作

- 位置：`src/lib/site-ui-text.ts:9-10`（`languageSimplified: "简体"`、`languageTraditional: "繁体"`）；用法在 `src/components/LanguageToggle.tsx:10-11`
- 现状：简体状态下按钮显示「简体」，`aria-label` 是「简繁切换，当前为简体」。
- 目标：按钮可见文字显示**点击后的结果**——简体时显示「繁體」，繁体时显示「简体」；`aria-label` 保留状态说明。
- 为什么：按钮标签应命名动作。现状下只有屏幕阅读器用户能从 aria 得知状态，视觉用户无法判断按下去会变成什么。
- 注意：改完须重跑字体子集（见开头「文案改动的连带义务」）。
- 验收：两种状态下按钮文字与 `aria-label` 不再表达同一件事；简繁切换后字形正确。

### B-3 已暂缓

「后世化用」与关系值「化用」撞名，见末尾「暂缓项」。原 B-3 编号保留不复用。

### B-4（LOW · Accessibility）卷页与诗人页的 `aria-label` 不随简繁切换

- 位置：`src/app/v/[volumeSlug]/page.tsx:55`（`aria-label={`${volume.name}诗人`}`）、`67`（`{poemCount} 首`）；`src/app/v/[volumeSlug]/[authorSlug]/page.tsx:60`（`aria-label={`${author.name}诗作`}`）
- 现状：页面切到繁体时，这两处地标名称仍是简体源数据，与 `<html lang="zh-Hant">` 不一致。
- 目标：改用 `SiteUiText` 里成对的简繁文案生成（参照 `volumesAria` 的做法）；量词「首」同理。
- 为什么：同页的 `VolumesNav` / `Breadcrumbs` 已做变体化，此处属遗漏，屏幕阅读器听到的字形与视觉不一致。
- 注意：改完须重跑字体子集。

### B-5（LOW · UI）顶栏图标 14px 导致描边落在非整像素

- 位置：`src/components/SiteSearch.tsx:91`、`src/components/RandomPoemButton.tsx:55`（均 `size-3.5`）
- 现状：14px；lucide 绘制在 24px 栅格、stroke-width 2，缩到 14px 后描边渲染为 2 × 14/24 ≈ 1.17px，观感发虚。同时浮层内图标经 `[&_svg:not([class*='size-'])]:size-4` 是 16px，顶栏与浮层两种尺寸并存。
- 目标：顶栏改 `size-4`（16px）。
- 验收：顶栏三个控件的图标与检索面板内图标同尺寸；28px 按钮内的视觉重量不失衡（若 16px 显得过满，宁可调按钮内边距，不要退回分数尺寸）。

---

## 批次 C · 跨 CSS 与 TSX，须在 A、B 合并后单独跑

### C-1（MEDIUM · Colors）两套颜色体系没有打通

- 位置：`globals.css:26`（`--background: oklch(1 0 0)`）、`:76` 起的 `@theme inline`（未注册 paper/ink）；消费方 `src/components/ui/dialog.tsx:56`（`bg-popover`）、`src/components/ui/popover.tsx:40`、`src/components/SiteSearchDialog.tsx:181`、`src/components/LineageHint.tsx:67`
- 现状：`--color-paper` / `--color-ink` 从未进入 `@theme inline`，于是每个消费方只能写任意值绕过；未被覆盖的 shadcn 表面会渲染纯白 `oklch(1 0 0)` 压在 `#faf8f4` 上。
- 目标：在 `@theme inline` 注册 `--color-paper` / `--color-ink` / `--color-ink-muted`，并把 shadcn 的 `--background` / `--popover` / `--border` 重映射到 paper/ink 派生值；消费方改用注册后的语义类。
- 为什么：这是「每处都写魔法值」的根因；不打通的话后续每个新浮层都要重新绕一次。
- 验收：所有浮层表面背景取自 paper 派生值，无纯白表面；不新增硬编码 `color-mix` 消费点。

### C-2（MEDIUM · Colors）遮罩色两个分支不成体系

- 位置：`src/components/ui/dialog.tsx:34`（`bg-black/10`）对照 `globals.css:1292`（`prefers-reduced-transparency` 分支用 `color-mix(in srgb, var(--color-ink) 28%, transparent)`）
- 现状：正常态是纯黑 10%，降透明度分支是墨色 28%，色相族与深度都不同，暗度差约 3 倍。
- 目标：两个分支都取自同一 ink 派生 token，深度差异只保留必要的一档。
- 依赖：在 C-1 之后做（需要 paper/ink 已注册进 `@theme`）。

### C-3（MEDIUM · UI）四套按压反馈语言

- 位置：`globals.css:1018`（`.site-chrome__control:active` → `scale(0.97)`）、`:861` 与 `:1165`（`.catalog__link` / `.poem-nav__link` → `scale(0.99)`）、`src/components/ui/button.tsx:7`（`active:not-aria-[haspopup]:translate-y-px`）；另 `.poem-reader__line--lineage:active` 只换背景
- 现状：`scale(0.99)` 在 28px 高的控件上位移约 0.14px，肉眼不可见，等于没有反馈；位移型与缩放型按压并存。
- 目标：统一为一个 `--press-scale`（建议 `0.96`），四处引用；可点击诗句补上同一反馈。
- 验收：三类控件按下时的位移量一致且可见；`prefers-reduced-motion` 下不产生位移。

### C-4（MEDIUM · UI）浮层进出场不对称、四套立体感配方

- 位置：`src/components/ui/popover.tsx:40`、`src/components/ui/dialog.tsx:56`、`src/components/LineageHint.tsx:67`、`src/components/SiteSearchDialog.tsx:181`
- 现状分两部分：
  - **进出场**：入场是「位移 + 缩放 + 淡入」三通道（`data-[side=*]:slide-in-from-*` + `zoom-in-95` + `fade-in-0`），出场只剩「缩放 + 淡出」，且两端同为 `duration-100`——浮层滑进来却原地消失。
  - **立体感**：基础 Popover 是 `shadow-md ring-1 ring-foreground/10`；「源」浮层是 `border + shadow-md ring-0`；检索框是自定义长投影 + `ring-1` 且 `border-0`；`DialogContent` 只有 ring、完全无投影。
- 目标：出场补上对应位移（`slide-out-to-*`）并把出场时长压到入场的约 2/3；抽一组 `--shadow-overlay` / `--shadow-overlay-strong`（分层透明 box-shadow）供四类浮层共用，去掉纯为造深度的 border。
- 为什么：「源」浮层是本站唯一行内注解形态、开合频繁，不对称每次都会重现；同层级浮层的视觉高度互相打架。
- 依赖：在 C-1 之后做。

---

## 批次 D · 工程

### D-1 已决策：源流功能暂不实现

`content/lineage/clues.json` 是空数组（`clues` 条数为 0），`src/components/LineageHint.tsx:36` 生成的 `/l/${stream.id}` 链接在 `src/app/` 下也没有对应路由。`CONTEXT.md` 把「源流」定为站点核心价值之一，但**已决定当前不实现**。

处置方式：**代码保持休眠，不下架、不补数据**。`LineageHint` / `AnnotationPopover` / 「源」标记这套组件与 `.lineage-hint__*` 样式原样保留，因为数据为空所以线上不产生任何触发点，读者不会碰到。

由此产生三条暂缓项（A-9、B-1、B-3，见末尾），以及一条**不受影响**的清理项（A-11 的 `.lineage-page__*` 死 CSS，那是给一个从未存在的独立页面写的，与浮层无关，照删）。

### D-2（工程）`npm run verify` 不含 `next build` — 已完成

- 已把 `npm run build`（含 `next build`）纳入 `verify`；AGENTS.md / README / CI 同步要求提交前跑。
- 注意：`build` 会产出 `out/`（已在 `.gitignore` 中），别把它提交进来。

---

## 暂缓项 · 恢复源流功能时必须先修

以下 3 条全部位于源流功能的代码路径上。因为 `clues.json` 为空、线上无触发点，读者当前碰不到，所以本轮不修。**一旦要实现源流功能，这 3 条必须在功能上线前修完**——尤其第一条是 HIGH。

### 暂缓-1（HIGH · Accessibility）源流句的 `aria-label` 盖掉了整句诗

- 位置：`src/components/AnnotationPopover.tsx:47`（`aria-label={ariaLabel}`）；值来自 `src/components/LineageHint.tsx:46`（`useUiText("lineageAria")` = 「查看此句的源流线索」）；触发器包裹诗句在 `LineageHint.tsx:54`
- 问题：`aria-label` 优先级高于子节点文本，带「源」标记的诗句在屏幕阅读器里**完全读不到原文**，只会听到一句通用提示。内容被隐藏（WCAG 4.1.2），且违反 2.5.3 Label in Name——语音控制用户无法用可见文字激活。
- 修法：去掉触发器上的 `aria-label`，让可见诗句文本成为可访问名；动作说明改为触发器内的 `<span className="sr-only">` 或 `aria-describedby` 指向一段稳定的 sr-only 说明。
- 注意：诗句已有一层 `sr-only` 整句文本（`PoemSentence.tsx` 的既有修复），改动时确认不会变成朗读两遍。
- 验收：需先注入至少一条 clue；`Accessibility.getFullAXTree` 中该触发器的 name 是诗句原文，描述里包含动作说明，单字节点仍为 0。

### 暂缓-2（MEDIUM · Writing）「后世化用」与关系值「化用」撞名

- 位置：`src/lib/site-ui-text.ts:30`（`lineageLabel: "后世化用"`）；浮层标题用法在 `src/components/LineageHint.tsx:70`
- 问题：浮层标题叫「后世化用」，而它列出的关系值有「化用 / 脱胎 / 意象承接」三类，其中一类也叫「化用」，读者会误以为浮层只列化用关系。
- 修法：标题改为不与任何关系值撞名的词（如「后世承袭」）。改完须重跑字体子集；术语改动同步到 `CONTEXT.md` 的「源流」一节。

### 暂缓-3（LOW · UI）源流句 hover 在两套版式下一个硬切一个渐变

- 位置：`.poem-reader__sentence--lineage`（`globals.css:177-186`，**无** transition）对照 `.poem-reader__line--lineage`（`:211` 起，有 100ms 渐变）
- 问题：同一个「源」句在「栏内回行」版式下 hover 是硬切、在「一句一列」版式下是渐变。
- 修法：给 `.poem-reader__sentence--lineage` 补上一致的 100ms 过渡。

## 附：本轮已实施的 17 条（不要重复修）

CSS 层：focus ring 对比度（→ ink 60%，3.90:1）、二级文字对比度（→ `--color-ink-muted`，5.42:1）、栏内回行栏高（→ `min(34em, 可用高度)`）、长题高度上限、横向滚动可发现性（常显细滚动条 + 不对称内边距）、移动端版心收缩（`--page-gutter` 单一来源）、coarse 指针命中区间距、目录长题回行、中文回退字体链、skip-link `:focus` 与 safe-area、`:has()` 对齐耦合收敛。

组件层：方向键让位于滚动（含 `VERTICAL_READING_EDGE_EPSILON_PX = 36` 的边缘容差）、阅读区可聚焦（`tabIndex` / `role="region"` / `aria-label`）、检索选中态（ink 13% + 左侧墨条）、逐字 `aria-hidden` + 整句 `sr-only`、`main` 的 `tabIndex={-1}`、检索 live region（「找到 N 项」）、截断诗题补 `title`、空状态与错误文案改写。
