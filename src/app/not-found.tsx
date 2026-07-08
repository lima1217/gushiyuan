import Link from "next/link";
import { SITE_NAME } from "@/lib/site-metadata";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 py-16 md:px-12 md:py-24">
      <Link href="/" className="catalog__site-title">
        {SITE_NAME}
      </Link>
      <h1 className="catalog__title mt-6">未寻得此页</h1>
      <p className="catalog__empty mt-4">所求不在此间。</p>
      <Link href="/" className="catalog__link mt-10">
        回目录
      </Link>
    </div>
  );
}
