import {
  AppState,
  EquipmentSlot,
  EquippedLoadout,
  InventoryItem,
  ItemRarity,
  ItemStats,
  PlayerProgress,
  VocabularyLevel
} from "../types";

export const XP_PER_LEVEL = 300;

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  "weapon",
  "offhand",
  "helmet",
  "armor",
  "accessory",
  "relic"
];

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: "Arma",
  offhand: "Offhand",
  helmet: "Yelmo",
  armor: "Armadura",
  accessory: "Accesorio",
  relic: "Reliquia"
};

export const RARITY_LABELS: Record<ItemRarity, string> = {
  common: "Comun",
  rare: "Raro",
  epic: "Epico",
  legendary: "Legendario"
};

const SLOT_BASE_NAMES: Record<EquipmentSlot, string[]> = {
  weapon: ["Blade", "Spear", "Saber", "Cipher", "Halberd", "Spire"],
  offhand: ["Aegis", "Mirror", "Sigil", "Ward", "Bulwark", "Lantern"],
  helmet: ["Crown", "Visor", "Helm", "Circlet", "Mask", "Diadem"],
  armor: ["Plate", "Mantle", "Vestment", "Mail", "Coat", "Harness"],
  accessory: ["Ring", "Seal", "Charm", "Chain", "Band", "Loop"],
  relic: ["Core", "Relic", "Shard", "Idol", "Prism", "Anchor"]
};

const SLOT_ICON_KEYS: Record<EquipmentSlot, string[]> = {
  weapon: ["blade", "spear", "flare"],
  offhand: ["shield", "orb", "lantern"],
  helmet: ["helm", "crown", "visor"],
  armor: ["armor", "plate", "mantle"],
  accessory: ["ring", "seal", "band"],
  relic: ["relic", "prism", "idol"]
};

const TIER_PREFIXES: Record<VocabularyLevel, string[]> = {
  elementary: ["Kindled", "Novice", "Humble", "Ashen", "Lantern", "Mossborn"],
  a1: ["Bronze", "Wayfarer", "Runed", "Bright", "Dawnlit", "Cipher"],
  a2: ["Sable", "Storm", "Warden", "Gilded", "Moonlit", "Aether"],
  b1: ["Mythic", "Vigil", "Forged", "Iron", "Runebound", "Cathedral"],
  b2: ["Royal", "Arcwire", "Guardian", "Obsidian", "Tempest", "Ivory"],
  c1: ["Astral", "Sovereign", "Voidforged", "Luminous", "Ancient", "Throne"],
  c2: ["Eternal", "Crownfire", "Starforged", "Apex", "Sacred", "Oracle"]
};

const RARITY_WEIGHT_TABLE: Record<ItemRarity, number> = {
  common: 60,
  rare: 26,
  epic: 10,
  legendary: 4
};

const RARITY_STAT_BUDGET: Record<ItemRarity, number> = {
  common: 2,
  rare: 4,
  epic: 6,
  legendary: 9
};

export function createEmptyEquipment(): EquippedLoadout {
  return {
    weapon: null,
    offhand: null,
    helmet: null,
    armor: null,
    accessory: null,
    relic: null
  };
}

export function getEquippedItems(state: Pick<AppState, "inventory" | "equipment">): InventoryItem[] {
  return EQUIPMENT_SLOTS.map((slot) => state.equipment[slot])
    .map((itemId) => state.inventory.find((item) => item.id === itemId) ?? null)
    .filter((item): item is InventoryItem => Boolean(item));
}

export function getEquippedStats(state: Pick<AppState, "inventory" | "equipment">): ItemStats {
  return getEquippedItems(state).reduce<ItemStats>(
    (totals, item) => ({
      wisdom: totals.wisdom + item.stats.wisdom,
      luck: totals.luck + item.stats.luck,
      glory: totals.glory + item.stats.glory
    }),
    { wisdom: 0, luck: 0, glory: 0 }
  );
}

export function getXpAward(baseXp: number, wisdom: number) {
  return Math.max(1, Math.round(baseXp * (1 + wisdom * 0.05)));
}

export function gainXp(progress: PlayerProgress, amount: number) {
  progress.xp += amount;

  while (progress.xp >= progress.xpToNextLevel) {
    progress.xp -= progress.xpToNextLevel;
    progress.level += 1;
  }
}

export function rollRewardItem(
  tier: VocabularyLevel,
  glory: number,
  luck: number
): InventoryItem {
  const slot = pickRandom(EQUIPMENT_SLOTS);
  const rarity = rollRarity(glory);
  const prefix = pickRandom(TIER_PREFIXES[tier]);
  const baseName = pickRandom(SLOT_BASE_NAMES[slot]);
  const icon = pickRandom(SLOT_ICON_KEYS[slot]);
  const statBudget = RARITY_STAT_BUDGET[rarity] + Math.min(3, Math.floor(luck / 2));

  return {
    id: `loot-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: `${prefix} ${baseName}`,
    slot,
    tier,
    rarity,
    icon,
    stats: distributeStats(statBudget, slot, luck)
  };
}

function rollRarity(glory: number): ItemRarity {
  const weights: Record<ItemRarity, number> = {
    common: Math.max(18, RARITY_WEIGHT_TABLE.common - glory * 2),
    rare: RARITY_WEIGHT_TABLE.rare + glory,
    epic: RARITY_WEIGHT_TABLE.epic + Math.floor(glory * 0.7),
    legendary: RARITY_WEIGHT_TABLE.legendary + Math.floor(glory * 0.35)
  };

  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  let roll = Math.random() * total;

  for (const rarity of ["common", "rare", "epic", "legendary"] as ItemRarity[]) {
    roll -= weights[rarity];
    if (roll <= 0) {
      return rarity;
    }
  }

  return "common";
}

function distributeStats(budget: number, slot: EquipmentSlot, luck: number): ItemStats {
  const slotBias: Record<EquipmentSlot, keyof ItemStats> = {
    weapon: "wisdom",
    offhand: "luck",
    helmet: "glory",
    armor: "wisdom",
    accessory: "luck",
    relic: "glory"
  };

  const stats: ItemStats = { wisdom: 0, luck: 0, glory: 0 };
  const favoredStat = slotBias[slot];
  stats[favoredStat] += 1;

  for (let index = 0; index < budget - 1; index += 1) {
    const statOrder: (keyof ItemStats)[] = ["wisdom", "luck", "glory"];
    const picked = statOrder[Math.floor(Math.random() * statOrder.length)];
    stats[picked] += 1;
  }

  if (luck >= 4) {
    stats.luck += 1;
  }

  return stats;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
