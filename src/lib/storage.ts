import { AppState } from "../types";
import { clampDailyNewWordsCount, clampVocabularyLevel, createInitialAppState } from "./learningEngine";
import { createEmptyEquipment } from "./rpg";

const STORAGE_KEY = "learn-english::app-state::v3";
const LEGACY_STORAGE_KEYS = [
  "learn-english::app-state",
  "learn-english::app-state::v1",
  "learn-english::app-state::v2"
];

export function loadAppState(): AppState {
  const baseState = createInitialAppState();

  if (typeof window === "undefined") {
    return baseState;
  }

  try {
    LEGACY_STORAGE_KEYS.forEach((legacyKey) => {
      window.localStorage.removeItem(legacyKey);
    });

    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return baseState;
    }

    const parsedState = JSON.parse(rawState) as Partial<AppState>;

    return {
      ...baseState,
      ...parsedState,
      settings: {
        ...baseState.settings,
        ...parsedState.settings,
        dailyNewWordsCount: clampDailyNewWordsCount(),
        vocabularyLevel: clampVocabularyLevel(
          parsedState.settings?.vocabularyLevel ?? baseState.settings.vocabularyLevel
        )
      },
      batches: Array.isArray(parsedState.batches) ? parsedState.batches : [],
      progress: parsedState.progress ?? {},
      dailySessions: parsedState.dailySessions ?? {},
      playerProgress: {
        ...baseState.playerProgress,
        ...parsedState.playerProgress,
        xpToNextLevel: baseState.playerProgress.xpToNextLevel,
        claimedReviewRewardDates: Array.isArray(parsedState.playerProgress?.claimedReviewRewardDates)
          ? parsedState.playerProgress!.claimedReviewRewardDates
          : []
      },
      inventory: Array.isArray(parsedState.inventory) ? parsedState.inventory : [],
      equipment: {
        ...createEmptyEquipment(),
        ...parsedState.equipment
      }
    };
  } catch {
    return baseState;
  }
}

export function saveAppState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
