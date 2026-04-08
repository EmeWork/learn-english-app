import { AppState } from "../types";
import { createInitialAppState } from "./learningEngine";

const STORAGE_KEY = "learn-english::app-state";

export function loadAppState(): AppState {
  const baseState = createInitialAppState();

  if (typeof window === "undefined") {
    return baseState;
  }

  try {
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
        ...parsedState.settings
      },
      batches: Array.isArray(parsedState.batches) ? parsedState.batches : [],
      progress: parsedState.progress ?? {},
      dailySessions: parsedState.dailySessions ?? {}
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
