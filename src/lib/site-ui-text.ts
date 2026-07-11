import type { TextVariant } from "@/lib/script-variant";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-metadata";

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
  searchNoMatch: "未找到匹配",
  searchLoadError: "检索索引加载失败，请稍后重试",
  searchPoemsHeading: "诗",
  searchAuthorsHeading: "作者",
  breadcrumbsAria: "面包屑",
  poemNavAria: "同卷诗作",
  prevPoem: "上一首",
  nextPoem: "下一首",
  lineageAria: "查看此句的源流线索",
  lineageMark: "源",
  lineageLabel: "后世化用",
  catalogTitle: "目录",
  volumesAria: "古诗源分卷",
  organizing: "整理中",
  emptyVolume: "此卷尚无收录。",
  notFoundTitle: "未寻得此页",
  notFoundBody: "所求不在此间。",
  backToCatalog: "回目录",
  siteDescription: SITE_DESCRIPTION,
} as const;

export type SiteUiTextKey = keyof typeof SITE_UI_TEXT_SIMPLIFIED;

export type SiteUiText = Record<SiteUiTextKey, TextVariant>;
