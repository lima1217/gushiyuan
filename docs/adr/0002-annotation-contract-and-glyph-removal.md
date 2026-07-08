# ADR 0002：行内注解交互契约与字形演变移除

- 状态：已采纳（Accepted）
- 日期：2026-07-08
- 关联 issue：#18、#15

## 背景

站点原有两类行内注解：

1. **源流线索**（lineage）：带线索的诗句走 hover Tooltip，触发标记「源」是约 0.625rem 的上标小字。鼠标移向浮层掠过空白即关闭，触屏完全失效，键盘不可达。
2. **字形演变**（glyph evolution）：关键字渲染为可点击按钮，点击打开 Popover 展示甲骨文/金文/小篆/楷书 SVG。交互成熟可用，但字形数据不可靠（同字多阶段指向内容相同的 SVG，如「草」小篆与楷书同一文件、「另」字甲骨文与金文相同），看不出演变，且不再作为核心价值。

两类注解各自一套交互，源流体验差、字形价值低且维护成本高。

## 决策

1. **源流改点击 Popover。** 触发器改为可聚焦 `<button>`，标记放大到与正文接近（约 0.85em）、加可点区域内边距、`cursor: pointer`；浮层点击打开、点击外部或 Esc 关闭，键盘与触屏均可用。源流数据（关系 `化用`/`脱胎`/`意象承接`、后世化用列表、源流跳转链接）不动。

2. **抽通用组件 `AnnotationPopover`。** 把字形演变那套成熟的点击 Popover 模式抽为通用组件（`src/components/AnnotationPopover.tsx`），浮层方向随阅读方向（横排在下、竖排在左，复用 `overlaySideForReadingDirection`）。现供「源」注解使用，后续行内注解亦可复用。

3. **整体移除字形演变。** 诗句按纯文本渲染（不再有关键字高亮与字形浮层触发）；移除字形详情路由 `/c/[char]`、`CharacterEvolutionPopover`/`CharacterEvolutionPanel` 组件、`src/lib/characters.ts`/`character-types.ts`、字形数据 `content/characters/*.json`、字形 SVG `public/characters/*`；从检索索引、检索面板、sitemap、字体 UI 文案中清除字形相关入口与码点。

4. **源流为唯一行内注解形态。** 移除字形后，「源」是诗句中唯一的行内注解。

## 后果

- 正面：源流桌面点击稳定、移动可展开、键盘可聚焦；字形演变在全站无残留入口与资源，复杂度与维护成本下降；行内注解交互统一为一套点击 Popover。
- 负面：失去字形演变这一「看字如何演变」的入口（其数据本不可靠，移除为净收益）；`ui/tooltip.tsx` 原语保留备用，但站点当前无 hover Tooltip 用例（`TooltipProvider` 已从 layout 移除）。
- 字体子集：移除字形标签（甲骨文/金文/小篆/楷书）与「字形演变」「含此字的诗」「资料来源：」等 UI 文案后，`FONT_UI_LITERALS` 收敛；检索面板文案同步改为「按诗题或作者检索」（不再含「字」）。

## 词汇

见 `CONTEXT.md` 的「源流」「字形演变（已移除）」条目。
