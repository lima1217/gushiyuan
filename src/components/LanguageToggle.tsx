"use client";

import {
  useScriptVariant,
  useUiText,
} from "@/components/ScriptVariantProvider";

export function LanguageToggle() {
  const { variant, setVariant } = useScriptVariant();
  const simplified = useUiText("languageSimplified");
  const traditional = useUiText("languageTraditional");
  const ariaLabel = useUiText(
    variant === "simplified"
      ? "languageToggleAriaSimplified"
      : "languageToggleAriaTraditional",
  );
  const label = variant === "simplified" ? simplified : traditional;

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
