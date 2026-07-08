"use client";

import Image from "next/image";
import { useReadingDirection } from "@/components/ReadingDirectionProvider";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Character } from "@/lib/character-types";
import { GLYPH_STAGE_ORDER } from "@/lib/character-types";
import { overlaySideForReadingDirection } from "@/lib/reading-direction";

const STAGE_ORDER = GLYPH_STAGE_ORDER;

type CharacterEvolutionPopoverProps = {
  character: Character;
};

export function CharacterEvolutionPopover({
  character,
}: CharacterEvolutionPopoverProps) {
  const direction = useReadingDirection();
  const side = overlaySideForReadingDirection(direction, "popover");

  const stages = STAGE_ORDER.flatMap((stage) => {
    const data = character.stages[stage];
    return data ? [{ stage, ...data }] : [];
  });

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="poem-reader__char poem-reader__char--key"
        aria-label={`查看「${character.char}」的字形演变`}
      >
        {character.char}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        sideOffset={8}
        className="char-evolution w-[min(20rem,calc(100vw-2rem))] border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] bg-[var(--color-paper)] p-4 text-[var(--color-ink)] shadow-lg ring-0"
      >
        <PopoverHeader className="gap-1">
          <PopoverTitle className="text-base font-normal tracking-[0.12em]">
            {character.char}
          </PopoverTitle>
          <PopoverDescription className="text-[var(--color-ink-muted)] leading-relaxed">
            {character.meaning}
          </PopoverDescription>
        </PopoverHeader>

        {stages.length > 0 ? (
          <ol className="char-evolution__stages">
            {stages.map(({ stage, label, image }) => (
              <li key={stage} className="char-evolution__stage">
                <span className="char-evolution__stage-label">{label}</span>
                <Image
                  src={image}
                  alt={`${character.char} ${label}`}
                  width={64}
                  height={64}
                  className="char-evolution__glyph"
                />
              </li>
            ))}
          </ol>
        ) : null}

        <p className="char-evolution__source">资料来源：{character.source}</p>
      </PopoverContent>
    </Popover>
  );
}
