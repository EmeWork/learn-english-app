import { WordEntry } from "../types";

interface WordCardProps {
  word: WordEntry;
  sourceLabel: string;
  progressLabel: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export function WordCard({
  word,
  sourceLabel,
  progressLabel,
  isFlipped,
  onFlip
}: WordCardProps) {
  return (
    <button className={`word-card ${isFlipped ? "is-flipped" : ""}`} onClick={onFlip} type="button">
      <div className="word-card__inner">
        <div className="word-card__face word-card__face--front">
          <span className="word-card__eyebrow">{sourceLabel}</span>
          <h2>{word.spanish}</h2>
          <p>Piensala en ingles, luego toca la tarjeta para revisarte.</p>
          <span className="word-card__progress">{progressLabel}</span>
        </div>
        <div className="word-card__face word-card__face--back">
          <span className="word-card__eyebrow">Respuesta</span>
          <h2>{word.english}</h2>
          <p>Di la palabra en voz alta y marca si la pegaste o no.</p>
          <span className="word-card__progress">{progressLabel}</span>
        </div>
      </div>
    </button>
  );
}
