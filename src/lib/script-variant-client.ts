import {
  DEFAULT_SCRIPT_VARIANT,
  SCRIPT_VARIANT_STORAGE_KEY,
  type ScriptVariant,
  persistScriptVariantEverywhere,
  readPersistedScriptVariant,
} from "@/lib/script-variant";
import { applyScriptVariantToDocument } from "@/lib/script-variant-bootstrap";

const variantListeners = new Set<() => void>();

export function subscribeScriptVariant(listener: () => void): () => void {
  variantListeners.add(listener);

  function onStorage(event: StorageEvent) {
    if (event.key === SCRIPT_VARIANT_STORAGE_KEY) {
      listener();
    }
  }

  window.addEventListener("storage", onStorage);
  return () => {
    variantListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getScriptVariantSnapshot(): ScriptVariant {
  return readPersistedScriptVariant(localStorage);
}

export function getScriptVariantServerSnapshot(): ScriptVariant {
  return DEFAULT_SCRIPT_VARIANT;
}

export function setScriptVariant(variant: ScriptVariant): void {
  persistScriptVariantEverywhere(localStorage, variant);
  applyScriptVariantToDocument(variant);
  variantListeners.forEach((listener) => listener());
}
