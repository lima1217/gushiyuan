import {
  SCRIPT_VARIANT_STORAGE_KEY,
  langForScriptVariant,
  type ScriptVariant,
} from "@/lib/script-variant";

export function applyScriptVariantToDocument(variant: ScriptVariant): void {
  document.documentElement.dataset.scriptVariant = variant;
  document.documentElement.lang = langForScriptVariant(variant);
}

export const SCRIPT_VARIANT_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(
  SCRIPT_VARIANT_STORAGE_KEY,
)};var v=localStorage.getItem(k);if(!v){var p=k+"=";var c=document.cookie.split("; ");for(var i=0;i<c.length;i++){if(c[i].indexOf(p)===0){v=decodeURIComponent(c[i].slice(p.length));break;}}}var t=v==="traditional"?"traditional":"simplified";var e=document.documentElement;e.dataset.scriptVariant=t;e.lang=t==="traditional"?"zh-Hant":"zh-CN";}catch(_){}})();`;
