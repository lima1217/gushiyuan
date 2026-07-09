import Link from "next/link";
import { VariantText } from "@/components/VariantText";
import { makeTextVariant } from "@/lib/script-conversion";
import { SITE_NAME } from "@/lib/site-metadata";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-8 py-16 md:px-12 md:py-24"
    >
      <Link href="/" className="catalog__site-title">
        <VariantText text={makeTextVariant(SITE_NAME)} />
      </Link>
      <h1 className="catalog__title mt-6">
        <VariantText text={makeTextVariant("未寻得此页")} />
      </h1>
      <p className="catalog__empty mt-4">
        <VariantText text={makeTextVariant("所求不在此间。")} />
      </p>
      <Link href="/" className="catalog__link mt-10">
        <VariantText text={makeTextVariant("回目录")} />
      </Link>
    </main>
  );
}
