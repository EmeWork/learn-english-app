import { InventoryItem, WordEntry } from "../types";
import { EQUIPMENT_SLOT_LABELS, RARITY_LABELS } from "../lib/rpg";
import { ItemIcon } from "./ItemIcon";
import { WordCard } from "./WordCard";
import { AnimatedShinyText } from "./ui/AnimatedShinyText";

interface ReviewScreenProps {
  reviewProgress: string;
  reviewCountsText: string;
  activeSourceLabel: string;
  card: {
    id: string;
  } | null;
  word?: WordEntry;
  reviewCardsTotal: number;
  rewardClaimed: boolean;
  rewardItem: InventoryItem | null;
  isCardFlipped: boolean;
  onFlip: () => void;
  onFail: () => void;
  onSuccess: () => void;
  onOpenInventory: () => void;
  onBack: () => void;
}

export function ReviewScreen({
  reviewProgress,
  reviewCountsText,
  activeSourceLabel,
  card,
  word,
  reviewCardsTotal,
  rewardClaimed,
  rewardItem,
  isCardFlipped,
  onFlip,
  onFail,
  onSuccess,
  onOpenInventory,
  onBack
}: ReviewScreenProps) {
  return (
    <section className="stack-lg">
      <article className="flow-banner flow-banner--review has-effects">
        <div>
          <p className="eyebrow font-choice-3">Sala de repaso</p>
          <h2 className="font-choice-1">
            <AnimatedShinyText>Repasar</AnimatedShinyText>
          </h2>
          <p className="font-choice-2">{reviewCountsText}</p>
        </div>
        <div className="tag-row">
          <span className="badge badge--soft font-choice-3">{reviewProgress}</span>
          <span className="badge badge--warm font-choice-3">
            {rewardClaimed ? "Premio diario cobrado" : "7 XP + reliquia"}
          </span>
        </div>
      </article>

      {card && word ? (
        <>
          <WordCard
            isFlipped={isCardFlipped}
            mode="review"
            onFlip={onFlip}
            progressLabel={reviewProgress}
            sourceLabel={activeSourceLabel}
            word={word}
          />

          <div className="answer-bar">
            <button
              className="button button--danger font-choice-1"
              disabled={!isCardFlipped}
              onClick={onFail}
              type="button"
            >
              Falle
            </button>
            <button
              className="button button--success font-choice-1"
              disabled={!isCardFlipped}
              onClick={onSuccess}
              type="button"
            >
              La pegue
            </button>
          </div>
        </>
      ) : reviewCardsTotal > 0 ? (
        <article className="panel-card panel-card--empty">
          <p className="eyebrow font-choice-3">Repaso completo</p>
          <h2 className="font-choice-1">La sala quedo limpia por hoy</h2>
          <p className="font-choice-2">
            {rewardClaimed
              ? "Tu recompensa diaria ya fue reclamada y las cartas quedaron selladas."
              : "No habia recompensa pendiente, pero el repaso quedo en orden."}
          </p>
          {rewardItem && (
            <div className="loot-banner">
              <div className="loot-banner__icon">
                <ItemIcon icon={rewardItem.icon} />
              </div>
              <div>
                <strong className="font-choice-1">{rewardItem.name}</strong>
                <p className="font-choice-2">
                  {RARITY_LABELS[rewardItem.rarity]} - {EQUIPMENT_SLOT_LABELS[rewardItem.slot]}
                </p>
              </div>
            </div>
          )}
          <div className="hero-card__actions hero-card__actions--center">
            <button className="button button--primary font-choice-1" onClick={onOpenInventory} type="button">
              Abrir cofre
            </button>
            <button className="button button--ghost font-choice-1" onClick={onBack} type="button">
              Volver al hub
            </button>
          </div>
        </article>
      ) : (
        <article className="panel-card panel-card--empty">
          <p className="eyebrow font-choice-3">Sala vacia</p>
          <h2 className="font-choice-1">Aun no hay repaso pendiente</h2>
          <p className="font-choice-2">
            Aprende palabras nuevas para desbloquear el repaso del dia o espera la proxima senal.
          </p>
        </article>
      )}
    </section>
  );
}
