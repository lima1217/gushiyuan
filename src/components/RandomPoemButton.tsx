"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dices } from "lucide-react";
import { useUiText } from "@/components/ScriptVariantProvider";
import { loadPoemSlugs } from "@/lib/load-poem-slugs";
import {
  pickRandomPoemSlug,
  poemSlugFromPathname,
} from "@/lib/random-poem";

export function RandomPoemButton() {
  const randomPoem = useUiText("randomPoem");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) {
      return;
    }

    setPending(true);
    try {
      const slugs = await loadPoemSlugs();
      const slug = pickRandomPoemSlug(
        slugs,
        poemSlugFromPathname(pathname),
      );
      if (!slug) {
        return;
      }
      router.push(`/p/${slug}`);
    } catch {
      // Keep silent: no toast surface in chrome; match search failure tone.
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className="site-chrome__control site-chrome__control--icon"
      onClick={() => {
        void handleClick();
      }}
      aria-label={randomPoem}
      disabled={pending}
    >
      <Dices aria-hidden="true" className="size-3.5" />
    </button>
  );
}
