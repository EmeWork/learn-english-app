import { EquipmentSlot, InventoryItem } from "../types";
import { EQUIPMENT_SLOT_LABELS, EQUIPMENT_SLOTS, RARITY_LABELS } from "../lib/rpg";
import { ItemIcon } from "./ItemIcon";
import { AnimatedShinyText } from "./ui/AnimatedShinyText";

interface InventoryScreenProps {
  profileTitle: string;
  displayName: string;
  playerLevel: number;
  inventoryCount: number;
  equippedStats: {
    wisdom: number;
    luck: number;
    glory: number;
  };
  inventoryItems: InventoryItem[];
  selectedItem: InventoryItem | null;
  equipment: Record<EquipmentSlot, string | null>;
  onSelectItem: (itemId: string) => void;
  onEquipItem: (item: InventoryItem) => void;
  onUnequipSlot: (slot: EquipmentSlot) => void;
}

export function InventoryScreen({
  profileTitle,
  displayName,
  playerLevel,
  inventoryCount,
  equippedStats,
  inventoryItems,
  selectedItem,
  equipment,
  onSelectItem,
  onEquipItem,
  onUnequipSlot
}: InventoryScreenProps) {
  return (
    <section className="stack-lg">
      <article className="inventory-hero has-effects">
        <div>
          <p className="eyebrow font-choice-3">Arcane Chest</p>
          <h2 className="font-choice-1">
            <AnimatedShinyText>Inventario del Lord</AnimatedShinyText>
          </h2>
          <p className="font-choice-2">
            Tus reliquias mejoran el ritmo del progreso, los drops y la rareza del botin.
          </p>
        </div>
        <div className="tag-row">
          <span className="badge badge--soft font-choice-3">Nivel {playerLevel}</span>
          <span className="badge badge--warm font-choice-3">{inventoryCount} reliquias</span>
        </div>
      </article>

      <section className="inventory-layout">
        <article className="panel-card character-card">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow font-choice-3">Character panel</p>
              <h3 className="font-choice-1">
                {profileTitle} Lord {displayName}
              </h3>
            </div>
          </div>

          <div className="stats-rows">
            <div>
              <span className="font-choice-2">Wisdom</span>
              <strong className="font-choice-1">+{equippedStats.wisdom}</strong>
            </div>
            <div>
              <span className="font-choice-2">Luck</span>
              <strong className="font-choice-1">+{equippedStats.luck}</strong>
            </div>
            <div>
              <span className="font-choice-2">Glory</span>
              <strong className="font-choice-1">+{equippedStats.glory}</strong>
            </div>
          </div>

          <div className="equipment-grid">
            {EQUIPMENT_SLOTS.map((slot) => {
              const equippedItem = inventoryItems.find((item) => item.id === equipment[slot]) ?? null;

              return (
                <button
                  className={`equipment-slot ${equippedItem ? "is-filled" : ""}`}
                  key={slot}
                  onClick={() => {
                    if (equippedItem) {
                      onSelectItem(equippedItem.id);
                    }
                  }}
                  type="button"
                >
                  <span className="equipment-slot__label font-choice-3">
                    {EQUIPMENT_SLOT_LABELS[slot]}
                  </span>
                  {equippedItem ? (
                    <>
                      <div className="equipment-slot__icon">
                        <ItemIcon icon={equippedItem.icon} />
                      </div>
                      <strong className="font-choice-1">{equippedItem.name}</strong>
                      <span className="font-choice-2">{RARITY_LABELS[equippedItem.rarity]}</span>
                      <span
                        className="equipment-slot__clear font-choice-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          onUnequipSlot(slot);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        Desmontar
                      </span>
                    </>
                  ) : (
                    <span className="font-choice-2">Vacante</span>
                  )}
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel-card inventory-panel">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow font-choice-3">Cofre</p>
              <h3 className="font-choice-1">Reliquias guardadas</h3>
            </div>
          </div>

          {inventoryItems.length > 0 ? (
            <div className="inventory-grid">
              {inventoryItems.map((item) => (
                <button
                  className={`inventory-item ${selectedItem?.id === item.id ? "is-selected" : ""}`}
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  type="button"
                >
                  <div className="inventory-item__icon">
                    <ItemIcon icon={item.icon} />
                  </div>
                  <strong className="font-choice-1">{item.name}</strong>
                  <span className="font-choice-2">
                    {RARITY_LABELS[item.rarity]} - {EQUIPMENT_SLOT_LABELS[item.slot]}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="font-choice-2">
              Tu cofre aun esta vacio. Completa un repaso diario para reclamar la primera reliquia.
            </p>
          )}
        </article>

        <article className="panel-card detail-panel">
          <div className="panel-card__header">
            <div>
              <p className="eyebrow font-choice-3">Detalle</p>
              <h3 className="font-choice-1">Reliquia seleccionada</h3>
            </div>
          </div>

          {selectedItem ? (
            <div className="detail-panel__content">
              <div className="detail-panel__icon">
                <ItemIcon icon={selectedItem.icon} />
              </div>
              <strong className="font-choice-1">{selectedItem.name}</strong>
              <p className="font-choice-2">
                {RARITY_LABELS[selectedItem.rarity]} - {EQUIPMENT_SLOT_LABELS[selectedItem.slot]}
              </p>
              <div className="stats-rows">
                <div>
                  <span className="font-choice-2">Wisdom</span>
                  <strong className="font-choice-1">+{selectedItem.stats.wisdom}</strong>
                </div>
                <div>
                  <span className="font-choice-2">Luck</span>
                  <strong className="font-choice-1">+{selectedItem.stats.luck}</strong>
                </div>
                <div>
                  <span className="font-choice-2">Glory</span>
                  <strong className="font-choice-1">+{selectedItem.stats.glory}</strong>
                </div>
              </div>
              <button className="button button--primary font-choice-1" onClick={() => onEquipItem(selectedItem)} type="button">
                Equipar
              </button>
            </div>
          ) : (
            <p className="font-choice-2">
              Elige una reliquia del cofre para ver su detalle y equiparla.
            </p>
          )}
        </article>
      </section>
    </section>
  );
}
