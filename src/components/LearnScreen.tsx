import { VocabularyLevel, WordEntry } from "../types";
import { WordCard } from "./WordCard";
import { AnimatedShinyText } from "./ui/AnimatedShinyText";

interface LearnScreenProps {
  tierLabel: string;
  progressLabel: string;
  card: {
    id: string;
    hitsDoneToday: number;
    hitsNeededToday: number;
  } | null;
  word?: WordEntry;
  vocabularyLevel: VocabularyLevel;
  isCardFlipped: boolean;
  translationRevealed: boolean;
  onFlip: () => void;
  onRevealTranslation: () => void;
  onFail: () => void;
  onSuccess: () => void;
  onOpenReview: () => void;
  onBack: () => void;
}

export function LearnScreen({
  tierLabel,
  progressLabel,
  card,
  word,
  vocabularyLevel,
  isCardFlipped,
  translationRevealed,
  onFlip,
  onRevealTranslation,
  onFail,
  onSuccess,
  onOpenReview,
  onBack
}: LearnScreenProps) {
  return (
    <section className="stack-lg">
      <article className="flow-banner has-effects">
        <div>
          <p className="eyebrow font-choice-3">Runa nueva</p>
          <h2 className="font-choice-1">
            <AnimatedShinyText>Aprender palabras</AnimatedShinyText>
          </h2>
          <p className="font-choice-2">{tierLabel} - 5 palabras por jornada</p>
        </div>
        <div className="tag-row">
          <span className="badge badge--soft font-choice-3">{progressLabel}</span>
          <span className="badge badge--warm font-choice-3">+3 XP por palabra nueva</span>
        </div>
      </article>

      {card && word ? (
        <>
          <WordCard
            isFlipped={isCardFlipped}
            mode="learn"
            onFlip={onFlip}
            onRevealTranslation={onRevealTranslation}
            presentationLevel={vocabularyLevel}
            progressLabel={`${card.hitsDoneToday}/${card.hitsNeededToday} sellos`}
            sourceLabel={tierLabel}
            translationRevealed={translationRevealed}
            word={word}
          />

          <div className="answer-bar">
            <button className="button button--ghost font-choice-1" onClick={onFail} type="button">
              Otra vez
            </button>
            <button className="button button--primary font-choice-1" onClick={onSuccess} type="button">
              Sellada
            </button>
          </div>
        </>
      ) : (
        <article className="panel-card panel-card--empty">
          <p className="eyebrow font-choice-3">Runa cerrada</p>
          <h2 className="font-choice-1">Ya terminaste las palabras nuevas de hoy</h2>
          <p className="font-choice-2">
            Ahora puedes ir a repasar las palabras del dia, de ayer, de la semana o del mes.
          </p>
          <div className="hero-card__actions hero-card__actions--center">
            <button className="button button--primary font-choice-1" onClick={onOpenReview} type="button">
              Ir a repasar
            </button>
            <button className="button button--ghost font-choice-1" onClick={onBack} type="button">
              Volver al hub
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
