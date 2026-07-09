import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { VariantText } from "@/components/VariantText";
import type { VariantableText } from "@/lib/script-variant";

type CatalogLayoutProps = {
  title: VariantableText;
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
};

export function CatalogLayout({ title, breadcrumbs, children }: CatalogLayoutProps) {
  return (
    <div className="catalog-layout flex min-h-dvh flex-col">
      <div className="site-breadcrumbs-bar">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <div className="catalog-layout__body flex flex-1 flex-col py-16 md:py-24">
        <header className="catalog__header mb-16 text-center md:mb-20">
          <h1 className="catalog__title">
            <VariantText text={title} />
          </h1>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-md flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
