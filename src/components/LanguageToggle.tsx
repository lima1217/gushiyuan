"use client";

import {
  useScriptVariant,
  useUiText,
} from "@/components/ScriptVariantProvider";
import { languageToggleActionLabel } from "@/lib/language-toggle-label";

export function LanguageToggle() {
  const { variant, setVariant, uiText } = useScriptVariant();
  const ariaLabel = useUiText(
    variant === "simplified"
      ? "languageToggleAriaSimplified"
      : "languageToggleAriaTraditional",
  );
  const label = languageToggleActionLabel(variant, uiText);

  return (
    <button
      type="button"
      className="site-chrome__control site-chrome__control--text"
      aria-label={ariaLabel}
      onClick={() =>
        setVariant(variant === "simplified" ? "traditional" : "simplified")
      }
    >
      {label}
    </button>
  );
}
