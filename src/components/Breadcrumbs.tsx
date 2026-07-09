"use client";

import Link from "next/link";
import {
  useUiText,
  useVariantText,
} from "@/components/ScriptVariantProvider";
import type { VariantableText } from "@/lib/script-variant";

export type BreadcrumbItem = {
  label: VariantableText;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

type BreadcrumbLinkItem = BreadcrumbItem & { href: string };

function BreadcrumbListItem({
  item,
  index,
  separator,
}: {
  item: BreadcrumbLinkItem;
  index: number;
  separator: string;
}) {
  const label = useVariantText(item.label);

  return (
    <li className="breadcrumbs__item">
      {index > 0 ? (
        <span className="breadcrumbs__sep" aria-hidden="true">
          {separator}
        </span>
      ) : null}
      <Link href={item.href} className="breadcrumbs__link">
        {label}
      </Link>
    </li>
  );
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const ariaLabel = useUiText("breadcrumbsAria");
  const links = items.filter(
    (item): item is BreadcrumbLinkItem => Boolean(item.href),
  );

  if (links.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className="breadcrumbs">
      <ol className="breadcrumbs__list">
        {links.map((item, index) => (
          <BreadcrumbListItem
            key={`${item.href}-${index}`}
            item={item}
            index={index}
            separator="›"
          />
        ))}
      </ol>
    </nav>
  );
}
