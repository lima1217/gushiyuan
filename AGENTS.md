## Agent skills

### Issue tracker

GitHub Issues（`gh` CLI）；外部 PR 不作为 triage 入口。见 `docs/agents/issue-tracker.md`。

### Triage labels

五个标准 triage 标签，名称与角色一致（`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`）。见 `docs/agents/triage-labels.md`。

### Domain docs

Single-context：根目录 `CONTEXT.md` + `docs/adr/`。见 `docs/agents/domain.md`。

### Verify before commit

提交前跑 `npm run verify`（`typecheck` + `lint` + `test` + `build`）。`build` 含 `next build`，能抓住客户端误引服务端模块（如 `fs`）这类 `tsc`/`vitest` 过不了的问题。产物在 `out/`，勿提交。

改 `src/lib/font-ui-literals.ts` / `site-ui-text.ts` 等子集输入（文件内容含注释也进 fingerprint）时，verify 会重生 WenKai 切片；须把 `src/fonts/wenkai.css`、`src/lib/wenkai-subset-path.generated.ts`、`public/fonts/wenkai/*` 与源码同提交（旧指纹 woff2 一并删），否则线上字体 404。同步说明写在本文件，勿堆进 `font-ui-literals.ts` 以免无谓换指纹。
