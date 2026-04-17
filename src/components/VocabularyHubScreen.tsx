import { VocabularyLevel } from "../types";
import { AnimatedShinyText } from "./ui/AnimatedShinyText";

interface TierOption {
  level: VocabularyLevel;
  title: string;
  cefr: string;
}

interface VocabularyHubScreenProps {
  masteryTitle: string;
  playerLevel: number;
  playerXp: number;
  xpToNextLevel: number;
  tierOptions: TierOption[];
  selectedLevel: VocabularyLevel;
  learnTierLabel: string;
  reviewCounts: {
    sameDay: number;
    day: number;
    week: number;
    month: number;
    bonus: number;
  };
  reminderValue: string;
  reminderEnabled: boolean;
  showInlineReminder: boolean;
  onSelectLevel: (level: VocabularyLevel) => void;
  onOpenLearn: () => void;
  onOpenReview: () => void;
  onOpenReminder: () => void;
  onChangeReminderTime: (value: string) => void;
  onToggleReminder: () => void;
}

export function VocabularyHubScreen({
  masteryTitle,
  playerLevel,
  playerXp,
  xpToNextLevel,
  tierOptions,
  selectedLevel,
  learnTierLabel,
  reviewCounts,
  reminderValue,
  reminderEnabled,
  showInlineReminder,
  onSelectLevel,
  onOpenLearn,
  onOpenReview,
  onOpenReminder,
  onChangeReminderTime,
  onToggleReminder
}: VocabularyHubScreenProps) {
  return (
    <section className="stack-lg">
      <article className="hub-altar has-effects">
        <div className="hub-altar__copy">
          <p className="eyebrow font-choice-3">Rango de vocabulary</p>
          <h2 className="font-choice-1">
            <AnimatedShinyText>{masteryTitle}</AnimatedShinyText>
          </h2>
          <p className="font-choice-2">
            Nivel {playerLevel} - {masteryTitle} - {playerXp}/{xpToNextLevel} XP
          </p>
        </div>

        <div className="hub-altar__xpbar">
          <span
            className="hub-altar__xpfill"
            style={{ width: `${(playerXp / xpToNextLevel) * 100}%` }}
          />
        </div>

        <div className="tier-chip-row">
          {tierOptions.map((tier) => (
            <button
              className={`tier-chip ${tier.level === selectedLevel ? "is-selected" : ""}`}
              key={tier.level}
              onClick={() => onSelectLevel(tier.level)}
              type="button"
            >
              <span className="font-choice-3">{tier.cefr}</span>
              <strong className="font-choice-1">{tier.title}</strong>
            </button>
          ))}
        </div>
      </article>

      <section className="hub-grid">
        <article className="action-card action-card--learn has-effects">
          <div className="action-card__top">
            <div>
              <p className="eyebrow font-choice-3">Senda nueva</p>
              <h3 className="font-choice-1">
                <AnimatedShinyText>Aprender palabras</AnimatedShinyText>
              </h3>
            </div>
          </div>

          <p className="action-card__tier action-card__tier--learn font-choice-3">{learnTierLabel}</p>
          <p className="action-card__xp font-choice-3">+ 3 XP</p>
          <button className="button button--primary font-choice-1" onClick={onOpenLearn} type="button">
            Iniciar
          </button>
        </article>

        <article className="action-card action-card--review has-effects">
          <div className="action-card__top">
            <div>
              <p className="eyebrow font-choice-3">Sala de repaso</p>
              <h3 className="font-choice-1">
                <AnimatedShinyText>Repasar</AnimatedShinyText>
              </h3>
            </div>
          </div>

          <div className="review-breakdown">
            <span className="review-breakdown__label font-choice-3">Hoy</span>
            <span className="review-breakdown__label font-choice-3">Next</span>
            <span className="review-breakdown__label font-choice-3">Week</span>
            <span className="review-breakdown__label font-choice-3">Mes</span>
            <span className="review-breakdown__label font-choice-3">Plus</span>

            <strong className="review-breakdown__value font-choice-1">{reviewCounts.sameDay}</strong>
            <strong className="review-breakdown__value font-choice-1">{reviewCounts.day}</strong>
            <strong className="review-breakdown__value font-choice-1">{reviewCounts.week}</strong>
            <strong className="review-breakdown__value font-choice-1">{reviewCounts.month}</strong>
            <strong className="review-breakdown__value font-choice-1">{reviewCounts.bonus}</strong>
          </div>
          <p className="action-card__xp font-choice-3">+ 7 XP</p>
          <button className="button button--secondary font-choice-1" onClick={onOpenReview} type="button">
            Entrar
          </button>
        </article>

        <article className="action-card action-card--reminder has-effects">
          <div className="action-card__top">
            <div>
              <p className="eyebrow font-choice-3">Campana ritual</p>
              <h3 className="font-choice-1">
                <AnimatedShinyText>Recordatorio</AnimatedShinyText>
              </h3>
            </div>
            <button
              aria-label="Activar o desactivar recordatorio"
              className={`switch ${reminderEnabled ? "is-on" : ""}`}
              onClick={onToggleReminder}
              type="button"
            >
              <span className="switch__thumb" />
            </button>
          </div>
          <label className="time-picker time-picker--inline-card">
            <span className="font-choice-3">Hora</span>
            <input
              onChange={(event) => onChangeReminderTime(event.target.value)}
              type="time"
              value={reminderValue}
            />
          </label>
          {showInlineReminder && (
            <p className="action-card__reward font-choice-3">Tu senal de hoy ya esta despierta.</p>
          )}
          <button className="button button--ghost font-choice-1" onClick={onOpenReminder} type="button">
            Ajustes
          </button>
        </article>
      </section>

    </section>
  );
}
