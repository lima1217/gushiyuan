export type ScriptVariant = "simplified" | "traditional";

export type TextVariant = {
  simplified: string;
  traditional: string;
};

export type VariantableText = string | TextVariant;

export const SCRIPT_VARIANT_STORAGE_KEY = "gushiyuan-script-variant";
export const DEFAULT_SCRIPT_VARIANT: ScriptVariant = "simplified";

export function isTextVariant(text: VariantableText): text is TextVariant {
  return typeof text !== "string";
}

export function textForScriptVariant(
  text: VariantableText,
  variant: ScriptVariant,
): string {
  if (typeof text === "string") {
    return text;
  }
  return variant === "traditional" ? text.traditional : text.simplified;
}

export function parseScriptVariant(value: string | null): ScriptVariant {
  if (value === "traditional") {
    return "traditional";
  }
  return DEFAULT_SCRIPT_VARIANT;
}

export function readStoredScriptVariant(
  storage: Pick<Storage, "getItem">,
): ScriptVariant {
  return parseScriptVariant(storage.getItem(SCRIPT_VARIANT_STORAGE_KEY));
}

export function persistScriptVariant(
  storage: Pick<Storage, "setItem">,
  variant: ScriptVariant,
): void {
  storage.setItem(SCRIPT_VARIANT_STORAGE_KEY, variant);
}

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function readScriptVariantFromCookies(
  cookieStore: CookieReader,
): ScriptVariant {
  return parseScriptVariant(
    cookieStore.get(SCRIPT_VARIANT_STORAGE_KEY)?.value ?? null,
  );
}

export function readScriptVariantFromDocumentCookie(): ScriptVariant {
  if (typeof document === "undefined") {
    return DEFAULT_SCRIPT_VARIANT;
  }

  const prefix = `${SCRIPT_VARIANT_STORAGE_KEY}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      return parseScriptVariant(decodeURIComponent(part.slice(prefix.length)));
    }
  }

  return DEFAULT_SCRIPT_VARIANT;
}

export function readPersistedScriptVariant(
  storage: Pick<Storage, "getItem">,
): ScriptVariant {
  const fromStorage = storage.getItem(SCRIPT_VARIANT_STORAGE_KEY);
  if (fromStorage !== null) {
    return parseScriptVariant(fromStorage);
  }
  return readScriptVariantFromDocumentCookie();
}

export function persistScriptVariantCookie(variant: ScriptVariant): void {
  document.cookie = `${SCRIPT_VARIANT_STORAGE_KEY}=${variant};path=/;max-age=31536000;SameSite=Lax`;
}

export function persistScriptVariantEverywhere(
  storage: Pick<Storage, "setItem">,
  variant: ScriptVariant,
): void {
  persistScriptVariant(storage, variant);
  persistScriptVariantCookie(variant);
}

export function langForScriptVariant(variant: ScriptVariant): "zh-CN" | "zh-Hant" {
  return variant === "traditional" ? "zh-Hant" : "zh-CN";
}
