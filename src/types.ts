export type ReviewStage = "new" | "day1" | "week1" | "month1" | "learned";

export type SessionCardSource =
  | "new"
  | "review_same_day"
  | "review_day"
  | "review_week"
  | "review_month"
  | "bonus";

export type BatchStatus = "active" | "completed" | "archived";

export type AttemptResult = "success" | "failure" | null;

export type VocabularyLevel = "elementary" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export type ReminderPermissionState =
  | NotificationPermission
  | "prompt"
  | "prompt-with-rationale"
  | "unsupported";

export type EquipmentSlot =
  | "weapon"
  | "offhand"
  | "helmet"
  | "armor"
  | "accessory"
  | "relic";

export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export interface WordEntry {
  id: string;
  english: string;
  spanish: string;
  theme: string;
  order: number;
  level: VocabularyLevel;
  exampleSentence: string;
  englishExplanation: string;
}

export interface UserSettings {
  displayName: string;
  preferredReminderTime: string;
  notificationsEnabled: boolean;
  locale: string;
  notificationPermission: ReminderPermissionState;
  dailyNewWordsCount: number;
  vocabularyLevel: VocabularyLevel;
}

export interface WordProgress {
  wordId: string;
  batchId: string;
  stage: ReviewStage;
  requiredHits: number;
  currentHits: number;
  lastResult: AttemptResult;
  nextDueDate: string | null;
  bonusDueDate: string | null;
  sameDayReviewDueDate: string | null;
  learnXpAwarded: boolean;
}

export interface LearningBatch {
  id: string;
  createdDate: string;
  wordIds: string[];
  status: BatchStatus;
}

export interface SessionCard {
  id: string;
  wordId: string;
  source: SessionCardSource;
  hitsNeededToday: number;
  hitsDoneToday: number;
  isComplete: boolean;
  failures: number;
}

export interface DailySession {
  date: string;
  startedAt?: string;
  lastInteractionAt?: string;
  completedAt?: string;
  elapsedMs: number;
  totalAttempts: number;
  cards: SessionCard[];
  rewardItemId?: string;
}

export interface PlayerProgress {
  xp: number;
  level: number;
  xpToNextLevel: number;
  claimedReviewRewardDates: string[];
}

export interface ItemStats {
  wisdom: number;
  luck: number;
  glory: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  tier: VocabularyLevel;
  rarity: ItemRarity;
  icon: string;
  stats: ItemStats;
}

export type EquippedLoadout = Record<EquipmentSlot, string | null>;

export interface AppState {
  settings: UserSettings;
  batches: LearningBatch[];
  progress: Record<string, WordProgress>;
  dailySessions: Record<string, DailySession>;
  playerProgress: PlayerProgress;
  inventory: InventoryItem[];
  equipment: EquippedLoadout;
  lastNotificationDate?: string;
}
