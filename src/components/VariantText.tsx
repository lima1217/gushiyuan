import type { VariantableText } from "@/lib/script-variant";
import { isTextVariant } from "@/lib/script-variant";

type VariantTextProps = {
  text: VariantableText;
};

export function VariantText({ text }: VariantTextProps) {
  if (!isTextVariant(text)) {
    return <>{text}</>;
  }

  return (
    <span className="variant-text">
      <span className="variant-text__simplified">{text.simplified}</span>
      <span className="variant-text__traditional">{text.traditional}</span>
    </span>
  );
}
