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

function BreadcrumbListItem({
  item,
  index,
  separator,
}: {
  item: BreadcrumbItem;
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
      {item.href ? (
        <Link href={item.href} className="breadcrumbs__link">
          {label}
        </Link>
      ) : (
        <span className="breadcrumbs__current" aria-current="page">
          {label}
        </span>
      )}
    </li>
  );
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const ariaLabel = useUiText("breadcrumbsAria");

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className="breadcrumbs">
      <ol className="breadcrumbs__list">
        {items.map((item, index) => (
          <BreadcrumbListItem
            key={`${index}-${item.href ?? ""}`}
            item={item}
            index={index}
            separator="›"
          />
        ))}
      </ol>
    </nav>
  );
}
