import Image from "next/image";
import type { Character } from "@/lib/character-types";
import { GLYPH_STAGE_ORDER } from "@/lib/character-types";

type CharacterEvolutionPanelProps = {
  character: Character;
};

export function CharacterEvolutionPanel({
  character,
}: CharacterEvolutionPanelProps) {
  const stages = GLYPH_STAGE_ORDER.flatMap((stage) => {
    const data = character.stages[stage];
    return data ? [{ stage, ...data }] : [];
  });

  return (
    <div className="char-evolution">
      <p className="char-evolution__meaning">{character.meaning}</p>

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
    </div>
  );
}
