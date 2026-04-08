import {
  AppState,
  DailySession,
  LearningBatch,
  SessionCard,
  SessionCardSource,
  WordEntry,
  WordProgress
} from "../types";
import { addDays, compareDateKeys, diffInDays } from "./date";

export const NEW_BATCH_SIZE = 10;
export const INITIAL_HITS_REQUIRED = 3;
export const REVIEW_HITS_REQUIRED = 1;

export function createInitialAppState(): AppState {
  return {
    settings: {
      preferredReminderTime: "19:30",
      notificationsEnabled: false,
      locale: "es-CR",
      notificationPermission: "default"
    },
    batches: [],
    progress: {},
    dailySessions: {}
  };
}

export function ensureSessionForDate(
  state: AppState,
  words: WordEntry[],
  dateKey: string
): AppState {
  if (state.dailySessions[dateKey]) {
    return state;
  }

  const nextState = structuredClone(state);

  if (!findActiveBatch(nextState) && !nextState.batches.some((batch) => batch.createdDate === dateKey)) {
    createNextBatch(nextState, words, dateKey);
  }

  nextState.dailySessions[dateKey] = {
    date: dateKey,
    elapsedMs: 0,
    totalAttempts: 0,
    cards: buildCardsForDate(nextState, dateKey)
  };

  return nextState;
}

export function previewSessionForDate(
  state: AppState,
  words: WordEntry[],
  dateKey: string
): DailySession {
  const previewState = ensureSessionForDate(state, words, dateKey);
  return previewState.dailySessions[dateKey];
}

export function beginSession(state: AppState, dateKey: string, nowIso: string): AppState {
  const session = state.dailySessions[dateKey];
  if (!session || session.startedAt) {
    return state;
  }

  const nextState = structuredClone(state);
  nextState.dailySessions[dateKey].startedAt = nowIso;
  nextState.dailySessions[dateKey].lastInteractionAt = nowIso;
  return nextState;
}

export function recordAttempt(
  state: AppState,
  dateKey: string,
  wordId: string,
  success: boolean,
  nowIso: string
): AppState {
  const session = state.dailySessions[dateKey];
  if (!session) {
    return state;
  }

  const activeCardIndex = session.cards.findIndex((card) => card.wordId === wordId && !card.isComplete);
  if (activeCardIndex === -1) {
    return state;
  }

  const nextState = structuredClone(state);
  const nextSession = nextState.dailySessions[dateKey];
  const nextCard = nextSession.cards[activeCardIndex];
  const nextProgress = nextState.progress[wordId];
  const batchCreatedDate = nextState.batches.find((batch) => batch.id === nextProgress.batchId)?.createdDate;

  touchSessionClock(nextSession, nowIso);
  nextSession.totalAttempts += 1;
  nextProgress.lastResult = success ? "success" : "failure";

  if (success) {
    applySuccess(nextCard, nextProgress, batchCreatedDate ?? dateKey, dateKey);
  } else {
    applyFailure(nextCard, nextProgress, dateKey);
  }

  if (!nextCard.isComplete) {
    const [cardToMove] = nextSession.cards.splice(activeCardIndex, 1);
    nextSession.cards.push(cardToMove);
  }

  refreshBatchStatuses(nextState);

  if (nextSession.cards.length > 0 && nextSession.cards.every((card) => card.isComplete)) {
    nextSession.completedAt = nowIso;
    nextSession.lastInteractionAt = nowIso;
  }

  return nextState;
}

export function getSessionMetrics(session?: DailySession) {
  if (!session) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      newCount: 0,
      reviewCount: 0,
      bonusCount: 0
    };
  }

  const completed = session.cards.filter((card) => card.isComplete).length;
  const newCount = session.cards.filter((card) => card.source === "new").length;
  const bonusCount = session.cards.filter((card) => card.source === "bonus").length;

  return {
    total: session.cards.length,
    completed,
    pending: session.cards.length - completed,
    newCount,
    reviewCount: session.cards.length - newCount,
    bonusCount
  };
}

export function getStreakSummary(dailySessions: Record<string, DailySession>) {
  const completedDates = Object.values(dailySessions)
    .filter((session) => session.completedAt)
    .map((session) => session.date)
    .sort((left, right) => compareDateKeys(left, right));

  if (completedDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 1;
  let activeRun = 1;

  for (let index = 1; index < completedDates.length; index += 1) {
    if (diffInDays(completedDates[index - 1], completedDates[index]) === 1) {
      activeRun += 1;
    } else {
      activeRun = 1;
    }

    if (activeRun > longest) {
      longest = activeRun;
    }
  }

  let current = 1;
  for (let index = completedDates.length - 1; index > 0; index -= 1) {
    if (diffInDays(completedDates[index - 1], completedDates[index]) === 1) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

export function countLearnedWords(state: AppState): number {
  return Object.values(state.progress).filter((progress) => progress.stage === "learned").length;
}

export function isSessionPending(session?: DailySession): boolean {
  return Boolean(session?.cards.some((card) => !card.isComplete));
}

export function getSessionNewWords(
  session: DailySession | undefined,
  words: WordEntry[]
): WordEntry[] {
  if (!session) {
    return [];
  }

  const wordLookup = createWordLookup(words);

  return session.cards
    .filter((card) => card.source === "new")
    .map((card) => wordLookup[card.wordId])
    .filter((word): word is WordEntry => Boolean(word));
}

export function getNextDueDate(state: AppState): string | null {
  const pendingDates = Object.values(state.progress)
    .flatMap((progress) => [progress.nextDueDate, progress.bonusDueDate])
    .filter((date): date is string => Boolean(date))
    .sort((left, right) => compareDateKeys(left, right));

  return pendingDates[0] ?? null;
}

export function getSessionCompletedBreakdown(session?: DailySession) {
  if (!session) {
    return {
      newCards: 0,
      reviewCards: 0
    };
  }

  const completedCards = session.cards.filter((card) => card.isComplete);
  return {
    newCards: completedCards.filter((card) => card.source === "new").length,
    reviewCards: completedCards.filter((card) => card.source !== "new").length
  };
}

function createWordLookup(words: WordEntry[]) {
  return words.reduce<Record<string, WordEntry>>((lookup, word) => {
    lookup[word.id] = word;
    return lookup;
  }, {});
}

function createNextBatch(state: AppState, words: WordEntry[], dateKey: string) {
  const usedWordIds = new Set(state.batches.flatMap((batch) => batch.wordIds));
  const nextWords = words.filter((word) => !usedWordIds.has(word.id)).slice(0, NEW_BATCH_SIZE);

  if (nextWords.length === 0) {
    return;
  }

  const batchId = `batch-${dateKey}`;
  const nextBatch: LearningBatch = {
    id: batchId,
    createdDate: dateKey,
    wordIds: nextWords.map((word) => word.id),
    status: "active"
  };

  state.batches.push(nextBatch);

  nextWords.forEach((word) => {
    state.progress[word.id] = {
      wordId: word.id,
      batchId,
      stage: "new",
      requiredHits: INITIAL_HITS_REQUIRED,
      currentHits: 0,
      lastResult: null,
      nextDueDate: null,
      bonusDueDate: null
    };
  });
}

function buildCardsForDate(state: AppState, dateKey: string): SessionCard[] {
  const cardsByWordId = new Map<string, SessionCard>();

  state.batches
    .slice()
    .sort((left, right) => compareDateKeys(left.createdDate, right.createdDate))
    .forEach((batch) => {
      batch.wordIds.forEach((wordId) => {
        const progress = state.progress[wordId];
        if (!progress || progress.stage === "learned" || cardsByWordId.has(wordId)) {
          return;
        }

        if (progress.stage === "new") {
          cardsByWordId.set(wordId, {
            wordId,
            source: "new",
            hitsNeededToday: progress.requiredHits,
            hitsDoneToday: progress.currentHits,
            isComplete: false,
            failures: 0
          });
          return;
        }

        const dueSource = getDueSource(progress, dateKey);
        if (dueSource) {
          cardsByWordId.set(wordId, {
            wordId,
            source: dueSource,
            hitsNeededToday: REVIEW_HITS_REQUIRED,
            hitsDoneToday: 0,
            isComplete: false,
            failures: 0
          });
          return;
        }

        if (progress.bonusDueDate && compareDateKeys(progress.bonusDueDate, dateKey) <= 0) {
          cardsByWordId.set(wordId, {
            wordId,
            source: "bonus",
            hitsNeededToday: REVIEW_HITS_REQUIRED,
            hitsDoneToday: 0,
            isComplete: false,
            failures: 0
          });
        }
      });
    });

  return Array.from(cardsByWordId.values());
}

function getDueSource(progress: WordProgress, dateKey: string): SessionCardSource | null {
  if (!progress.nextDueDate || compareDateKeys(progress.nextDueDate, dateKey) > 0) {
    return null;
  }

  switch (progress.stage) {
    case "day1":
      return "review_day";
    case "week1":
      return "review_week";
    case "month1":
      return "review_month";
    default:
      return null;
  }
}

function findActiveBatch(state: AppState) {
  return state.batches.find((batch) => batch.status === "active");
}

function touchSessionClock(session: DailySession, nowIso: string) {
  if (!session.startedAt) {
    session.startedAt = nowIso;
    session.lastInteractionAt = nowIso;
    return;
  }

  if (!session.lastInteractionAt) {
    session.lastInteractionAt = nowIso;
    return;
  }

  const delta = Date.parse(nowIso) - Date.parse(session.lastInteractionAt);
  if (delta > 0) {
    session.elapsedMs += delta;
  }

  session.lastInteractionAt = nowIso;
}

function applySuccess(
  card: SessionCard,
  progress: WordProgress,
  batchCreatedDate: string,
  currentDateKey: string
) {
  if (card.source === "new") {
    progress.currentHits = Math.min(progress.requiredHits, progress.currentHits + 1);
    card.hitsDoneToday = progress.currentHits;

    if (progress.currentHits >= progress.requiredHits) {
      card.isComplete = true;
      promoteFromNew(progress, batchCreatedDate);
    }

    return;
  }

  card.hitsDoneToday = REVIEW_HITS_REQUIRED;
  card.isComplete = true;

  if (card.source === "bonus") {
    progress.bonusDueDate = null;
    return;
  }

  if (progress.bonusDueDate && compareDateKeys(progress.bonusDueDate, currentDateKey) <= 0) {
    progress.bonusDueDate = null;
  }

  promoteReview(progress, card.source, batchCreatedDate);
}

function applyFailure(card: SessionCard, progress: WordProgress, dateKey: string) {
  card.failures += 1;

  if (card.source !== "new") {
    progress.bonusDueDate = addDays(dateKey, 1);
  }
}

function promoteFromNew(progress: WordProgress, batchCreatedDate: string) {
  progress.stage = "day1";
  progress.requiredHits = REVIEW_HITS_REQUIRED;
  progress.currentHits = 0;
  progress.nextDueDate = addDays(batchCreatedDate, 1);
}

function promoteReview(
  progress: WordProgress,
  source: Exclude<SessionCardSource, "new" | "bonus">,
  batchCreatedDate: string
) {
  progress.requiredHits = REVIEW_HITS_REQUIRED;
  progress.currentHits = 0;

  if (source === "review_day") {
    progress.stage = "week1";
    progress.nextDueDate = addDays(batchCreatedDate, 7);
    return;
  }

  if (source === "review_week") {
    progress.stage = "month1";
    progress.nextDueDate = addDays(batchCreatedDate, 30);
    return;
  }

  progress.stage = "learned";
  progress.nextDueDate = null;
}

function refreshBatchStatuses(state: AppState) {
  state.batches.forEach((batch) => {
    const batchProgress = batch.wordIds.map((wordId) => state.progress[wordId]).filter(Boolean);
    if (batchProgress.length === 0) {
      return;
    }

    if (batchProgress.every((progress) => progress.stage === "learned")) {
      batch.status = "archived";
      return;
    }

    if (batchProgress.every((progress) => progress.stage !== "new")) {
      batch.status = "completed";
      return;
    }

    batch.status = "active";
  });
}
