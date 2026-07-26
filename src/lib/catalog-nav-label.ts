import {
  textForScriptVariant,
  type ScriptVariant,
  type TextVariant,
} from "@/lib/script-variant";

/** 目录地标名：主体名 + 角色后缀，随简繁变体切换。 */
export function catalogNavAriaLabel(
  name: TextVariant,
  roleSuffix: TextVariant,
  variant: ScriptVariant,
): string {
  return `${textForScriptVariant(name, variant)}${textForScriptVariant(roleSuffix, variant)}`;
}
