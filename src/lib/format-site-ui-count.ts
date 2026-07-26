/** 将 UI 文案模板中的 `%n` 换成计数。 */
export function formatSiteUiCount(template: string, count: number): string {
  return template.replaceAll("%n", String(count));
}
