import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-identity";
import { SITE_UI_TEXT_SIMPLIFIED } from "@/lib/site-ui-text";

/**
 * 字体子集须覆盖的站点 UI 字。
 * 可见中文 UI 以 SITE_UI_TEXT_SIMPLIFIED 为准；此处只追加内容域额外字。
 */
export const FONT_UI_LITERALS =
  SITE_NAME +
  SITE_DESCRIPTION +
  Object.values(SITE_UI_TEXT_SIMPLIFIED).join("") +
  "化用脱胎意象承接" +
  "·";
