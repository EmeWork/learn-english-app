import { VocabularyLevel, WordEntry } from "../types";

interface WordCardProps {
  word: WordEntry;
  sourceLabel: string;
  progressLabel: string;
  isFlipped: boolean;
  mode: "learn" | "review";
  presentationLevel?: VocabularyLevel;
  translationRevealed?: boolean;
  onFlip: () => void;
  onRevealTranslation?: () => void;
}

export function WordCard({
  word,
  sourceLabel,
  progressLabel,
  isFlipped,
  mode,
  presentationLevel = "elementary",
  translationRevealed = false,
  onFlip,
  onRevealTranslation
}: WordCardProps) {
  const showTranslationInline = shouldShowTranslationInline(presentationLevel);
  const showExampleInline = shouldShowExampleInline(presentationLevel);
  const showExplanationInline = shouldShowExplanationInline(presentationLevel);
  const canRevealTranslation = isHiddenTranslationTier(presentationLevel);
  const shouldShowTranslation = showTranslationInline || translationRevealed;

  return (
    <button className={`word-card ${isFlipped ? "is-flipped" : ""}`} onClick={onFlip} type="button">
      <div className="word-card__inner">
        <div className="word-card__face word-card__face--front">
          <span className="word-card__eyebrow font-choice-3">{sourceLabel}</span>
          <h2 className="font-choice-1">{mode === "learn" ? word.english : word.spanish}</h2>

          {mode === "learn" ? (
            <>
              {shouldShowTranslation && (
                <p className="word-card__support font-choice-2">Traduccion: {word.spanish}</p>
              )}
              {!shouldShowTranslation && canRevealTranslation && (
                <button
                  className="word-card__reveal font-choice-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRevealTranslation?.();
                  }}
                  type="button"
                >
                  Mostrar traduccion
                </button>
              )}
              {showExampleInline && (
                <p className="word-card__support font-choice-2">Example: {word.exampleSentence}</p>
              )}
              {showExplanationInline && (
                <p className="word-card__support font-choice-2">{word.englishExplanation}</p>
              )}
            </>
          ) : (
            <p className="font-choice-2">Piensala en ingles, luego gira la carta para revisarte.</p>
          )}

          <span className="word-card__progress font-choice-3">{progressLabel}</span>
        </div>

        <div className="word-card__face word-card__face--back">
          <span className="word-card__eyebrow font-choice-3">
            {mode === "learn" ? "Lore" : "Respuesta"}
          </span>
          <h2 className="font-choice-1">{word.english}</h2>
          <p className="word-card__support font-choice-2">
            {mode === "learn"
              ? word.englishExplanation
              : `Example: ${word.exampleSentence}`}
          </p>
          <p className="word-card__support font-choice-2">
            {mode === "learn"
              ? `Example: ${word.exampleSentence}`
              : `Translation: ${word.spanish}`}
          </p>
          <span className="word-card__progress font-choice-3">{progressLabel}</span>
        </div>
      </div>
    </button>
  );
}

function shouldShowTranslationInline(level: VocabularyLevel) {
  return level === "elementary" || level === "a1" || level === "a2";
}

function shouldShowExampleInline(level: VocabularyLevel) {
  return level !== "elementary";
}

function shouldShowExplanationInline(level: VocabularyLevel) {
  return level !== "elementary" && level !== "a1";
}

function isHiddenTranslationTier(level: VocabularyLevel) {
  return level === "b1" || level === "b2" || level === "c1" || level === "c2";
}
