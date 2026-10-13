# Brand assets

站点图标：纸色（`#faf8f4`）满底 + 朱砂方印（`#b23a2a`），印内白文「源」，字体为霞鹜文楷。

- 由 `scripts/generate-app-icons.tsx` 生成，输出 `src/app/icon.png`、`src/app/apple-icon.png`、`public/icon-512.png`、`public/icon-maskable-512.png`。
- 非构建步骤：改设计后运行 `npx tsx scripts/generate-app-icons.tsx`（需先 `npm run font:subset` 下载源字体）并提交产物。
- 图标为不透明满底方图，交给 iOS / Android 自行加遮罩，不留白圈；maskable 版方印缩小到安全区内。
