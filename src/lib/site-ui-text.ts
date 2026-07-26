import type { TextVariant } from "@/lib/script-variant";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-identity";

export const SITE_UI_TEXT_SIMPLIFIED = {
  siteName: SITE_NAME,
  skipLink: "跳到正文",
  languageToggleAriaSimplified: "简繁切换，当前为简体",
  languageToggleAriaTraditional: "简繁切换，当前为繁体",
  languageSimplified: "简体",
  languageTraditional: "繁体",
  randomPoem: "随机读一首",
  searchOpen: "打开检索",
  searchTitle: "站内检索",
  searchDescription: "按诗题或作者检索",
  searchPlaceholder: "诗题、作者…",
  searchNoMatch: "没有匹配的诗题或作者。换一个字词，或从目录里翻。",
  searchLoadError: "检索暂时不可用。请检查网络后重试。",
  searchMatchCount: "找到 %n 项",
  searchPoemsHeading: "诗",
  searchAuthorsHeading: "作者",
  breadcrumbsAria: "面包屑",
  poemNavAria: "相邻诗作",
  poemBodyAria: "诗作正文",
  prevPoem: "上一首",
  nextPoem: "下一首",
  prevVolume: "上一卷",
  nextVolume: "下一卷",
  lineageAria: "查看此句的源流线索",
  lineageMark: "源",
  lineageLabel: "后世化用",
  catalogTitle: "目录",
  volumesAria: "古诗源分卷",
  volumeAuthorsAria: "诗人",
  authorPoemsAria: "诗作",
  poemCountLabel: "%n 首",
  organizing: "尚未录入",
  emptyVolume: "此卷尚未录入。可先读已录入的各卷。",
  notFoundTitle: "未寻得此页",
  notFoundBody: "所求不在此间。",
  backToCatalog: "回目录",
  siteDescription: SITE_DESCRIPTION,
} as const;

export type SiteUiTextKey = keyof typeof SITE_UI_TEXT_SIMPLIFIED;

export type SiteUiText = Record<SiteUiTextKey, TextVariant>;
