import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-metadata";
import { SITE_UI_TEXT_SIMPLIFIED } from "@/lib/site-ui-text";

/** 站点 UI 固定文案。新增可见中文 UI 时同步更新。 */
export const FONT_UI_LITERALS =
  SITE_NAME +
  SITE_DESCRIPTION +
  Object.values(SITE_UI_TEXT_SIMPLIFIED).join("") +
  "化用脱胎意象承接" +
  "跳到正文" +
  "同卷诗作上一首下一首" +
  "查看此句的源流线索源后世化用" +
  "面包屑" +
  "此卷尚无收录。" +
  "目录古诗源分卷整理中" +
  "未寻得此页所求不在此间。回目录" +
  "后世名句源头" +
  "打开检索检索站内检索" +
  "按诗题或作者检索" +
  "诗题、作者…" +
  "未找到匹配输入诗题或作者" +
  "诗作者" +
  "·";
