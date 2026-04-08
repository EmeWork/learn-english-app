export type ReviewStage = "new" | "day1" | "week1" | "month1" | "learned";

export type SessionCardSource =
  | "new"
  | "review_day"
  | "review_week"
  | "review_month"
  | "bonus";

export type BatchStatus = "active" | "completed" | "archived";

export type AttemptResult = "success" | "failure" | null;

export type ReminderPermissionState =
  | NotificationPermission
  | "prompt"
  | "prompt-with-rationale"
  | "unsupported";

export interface WordEntry {
  id: string;
  english: string;
  spanish: string;
  theme: string;
  order: number;
}

export interface UserSettings {
  preferredReminderTime: string;
  notificationsEnabled: boolean;
  locale: string;
  notificationPermission: ReminderPermissionState;
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
}

export interface LearningBatch {
  id: string;
  createdDate: string;
  wordIds: string[];
  status: BatchStatus;
}

export interface SessionCard {
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
}

export interface AppState {
  settings: UserSettings;
  batches: LearningBatch[];
  progress: Record<string, WordProgress>;
  dailySessions: Record<string, DailySession>;
  lastNotificationDate?: string;
}
