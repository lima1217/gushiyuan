import type { ScriptVariant, TextVariant } from "@/lib/script-variant";

/** 简繁按钮可见文案：命名点击后的目标字形，而非当前状态。 */
export function languageToggleActionLabel(
  variant: ScriptVariant,
  labels: {
    languageSimplified: TextVariant;
    languageTraditional: TextVariant;
  },
): string {
  return variant === "simplified"
    ? labels.languageTraditional.traditional
    : labels.languageSimplified.simplified;
}
