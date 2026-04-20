import {
  AppState,
  DailySession,
  LearningBatch,
  SessionCard,
  SessionCardSource,
  VocabularyLevel,
  WordEntry,
  WordProgress
} from "../types";
import { addDays, compareDateKeys, diffInDays } from "./date";
import { createEmptyEquipment, gainXp, getEquippedStats, getXpAward, rollRewardItem, XP_PER_LEVEL } from "./rpg";

export const DEFAULT_NEW_BATCH_SIZE = 5;
export const MIN_NEW_BATCH_SIZE = 5;
export const MAX_NEW_BATCH_SIZE = 5;
export const INITIAL_HITS_REQUIRED = 3;
export const REVIEW_HITS_REQUIRED = 1;
export const LEARN_XP_REWARD = 3;
export const DAILY_REVIEW_XP_REWARD = 7;
export const DEFAULT_VOCABULARY_LEVEL: VocabularyLevel = "elementary";
export const VOCABULARY_LEVELS: VocabularyLevel[] = ["elementary", "a1", "a2", "b1", "b2", "c1", "c2"];

export const VOCABULARY_LEVEL_META: Record<
  VocabularyLevel,
  { title: string; cefr: string; contentLabel: string }
> = {
  elementary: { title: "Aspirante", cefr: "A0", contentLabel: "Word + traduccion" },
  a1: { title: "Aprendiz", cefr: "A1", contentLabel: "Traduccion + example" },
  a2: { title: "Adepto", cefr: "A2", contentLabel: "Traduccion + example + explain" },
  b1: { title: "Guardia", cefr: "B1", contentLabel: "Example + explain + traduccion oculta" },
  b2: { title: "Maestro", cefr: "B2", contentLabel: "Example + explain + traduccion oculta" },
  c1: { title: "Gran Maestro", cefr: "C1", contentLabel: "Example + explain + traduccion oculta" },
  c2: { title: "Sabio", cefr: "C2", contentLabel: "Example + explain + traduccion oculta" }
};

export const PROFILE_TITLES = [
  "Aspirante",
  "Aprendiz",
  "Iniciado",
  "Adepto",
  "Guardia",
  "Maestro",
  "Gran Maestro",
  "Sabio"
] as const;

const CARD_SOURCE_PRIORITY: Record<SessionCardSource, number> = {
  new: 0,
  review_same_day: 1,
  review_day: 2,
  review_week: 3,
  review_month: 4,
  bonus: 5
};

export function clampDailyNewWordsCount() {
  return DEFAULT_NEW_BATCH_SIZE;
}

export function clampVocabularyLevel(level: string | undefined): VocabularyLevel {
  if (level && VOCABULARY_LEVELS.includes(level as VocabularyLevel)) {
    return level as VocabularyLevel;
  }

  return DEFAULT_VOCABULARY_LEVEL;
}

export function isWordAllowedForLevel(wordLevel: VocabularyLevel, selectedLevel: VocabularyLevel) {
  return VOCABULARY_LEVELS.indexOf(wordLevel) <= VOCABULARY_LEVELS.indexOf(selectedLevel);
}

export function getVocabularyModuleProgress(state: AppState, words: WordEntry[]) {
  return VOCABULARY_LEVELS.map((level, index) => {
    const moduleWords = words.filter((word) => word.level === level);
    const learnedCount = moduleWords.filter((word) => state.progress[word.id]?.stage === "learned").length;
    const completionRatio = moduleWords.length > 0 ? learnedCount / moduleWords.length : 0;

    return {
      level,
      learnedCount,
      totalCount: moduleWords.length,
      completionRatio,
      isUnlocked: completionRatio >= 0.7,
      rank: index + 1,
      title: VOCABULARY_LEVEL_META[level].title
    };
  });
}

export function getVocabularySkillRank(state: AppState, words: WordEntry[]) {
  return getVocabularyModuleProgress(state, words).reduce((highestRank, moduleProgress) => {
    return moduleProgress.isUnlocked ? Math.max(highestRank, moduleProgress.rank) : highestRank;
  }, 0);
}

export function getProfileTitleFromSkillRanks(skillRanks: number[]) {
  if (skillRanks.length === 0) {
    return PROFILE_TITLES[0];
  }

  const averageRank = skillRanks.reduce((sum, rank) => sum + rank, 0) / skillRanks.length;
  const roundedRank = Math.min(PROFILE_TITLES.length - 1, Math.max(0, Math.round(averageRank)));
  return PROFILE_TITLES[roundedRank];
}

export function getVocabularyMasteryTitle(state: AppState, words: WordEntry[]) {
  return PROFILE_TITLES[getVocabularySkillRank(state, words)];
}

export function getHighestUnlockedLevel(state: AppState, words: WordEntry[]): VocabularyLevel {
  const unlockedModule = [...getVocabularyModuleProgress(state, words)]
    .reverse()
    .find((module) => module.isUnlocked);

  return unlockedModule?.level ?? DEFAULT_VOCABULARY_LEVEL;
}

export function createInitialAppState(): AppState {
  return {
    settings: {
      displayName: "Traveler",
      preferredReminderTime: "19:30",
      notificationsEnabled: false,
      locale: "es-CR",
      notificationPermission: "default",
      dailyNewWordsCount: DEFAULT_NEW_BATCH_SIZE,
      vocabularyLevel: DEFAULT_VOCABULARY_LEVEL
    },
    batches: [],
    progress: {},
    dailySessions: {},
    playerProgress: {
      xp: 0,
      level: 1,
      xpToNextLevel: XP_PER_LEVEL,
      claimedReviewRewardDates: []
    },
    inventory: [],
    equipment: createEmptyEquipment()
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
  return ensureSessionForDate(state, words, dateKey).dailySessions[dateKey];
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
  words: WordEntry[],
  dateKey: string,
  cardId: string,
  success: boolean,
  nowIso: string
): AppState {
  const session = state.dailySessions[dateKey];
  if (!session) {
    return state;
  }

  const activeCardIndex = session.cards.findIndex((card) => card.id === cardId && !card.isComplete);
  if (activeCardIndex === -1) {
    return state;
  }

  const nextState = structuredClone(state);
  const nextSession = nextState.dailySessions[dateKey];
  const nextCard = nextSession.cards[activeCardIndex];
  const nextProgress = nextState.progress[nextCard.wordId];
  const batchCreatedDate = nextState.batches.find((batch) => batch.id === nextProgress.batchId)?.createdDate;

  touchSessionClock(nextSession, nowIso);
  nextSession.totalAttempts += 1;
  nextProgress.lastResult = success ? "success" : "failure";

  if (success) {
    applySuccess(nextState, nextSession, nextCard, nextProgress, batchCreatedDate ?? dateKey, dateKey, words);
  } else {
    applyFailure(nextCard, nextProgress, dateKey);
  }

  if (!nextCard.isComplete) {
    const [cardToMove] = nextSession.cards.splice(activeCardIndex, 1);
    nextSession.cards.push(cardToMove);
  }

  refreshBatchStatuses(nextState);
  maybeGrantDailyReviewReward(nextState, words, dateKey);

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
      learnTotal: 0,
      learnPending: 0,
      reviewTotal: 0,
      reviewPending: 0,
      sameDayCount: 0,
      reviewCount: 0,
      bonusCount: 0
    };
  }

  const learnCards = getLearnCards(session);
  const reviewCards = getReviewCards(session);
  const completed = session.cards.filter((card) => card.isComplete).length;

  return {
    total: session.cards.length,
    completed,
    pending: session.cards.length - completed,
    learnTotal: learnCards.length,
    learnPending: learnCards.filter((card) => !card.isComplete).length,
    reviewTotal: reviewCards.length,
    reviewPending: reviewCards.filter((card) => !card.isComplete).length,
    sameDayCount: reviewCards.filter((card) => card.source === "review_same_day").length,
    reviewCount: reviewCards.filter((card) => card.source !== "bonus").length,
    bonusCount: reviewCards.filter((card) => card.source === "bonus").length
  };
}

export function getLearnCards(session?: DailySession) {
  if (!session) {
    return [];
  }

  return session.cards.filter((card) => card.source === "new");
}

export function getReviewCards(session?: DailySession) {
  if (!session) {
    return [];
  }

  return session.cards.filter((card) => card.source !== "new");
}

export function getPendingLearnCards(session?: DailySession) {
  return getLearnCards(session).filter((card) => !card.isComplete);
}

export function getPendingReviewCards(session?: DailySession) {
  return getReviewCards(session).filter((card) => !card.isComplete);
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

export function getSessionNewWords(session: DailySession | undefined, words: WordEntry[]): WordEntry[] {
  if (!session) {
    return [];
  }

  const wordLookup = createWordLookup(words);

  return getLearnCards(session)
    .map((card) => wordLookup[card.wordId])
    .filter((word): word is WordEntry => Boolean(word));
}

export function getNextDueDate(state: AppState): string | null {
  const pendingDates = Object.values(state.progress)
    .flatMap((progress) => [progress.nextDueDate, progress.bonusDueDate, progress.sameDayReviewDueDate])
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
  const batchSize = clampDailyNewWordsCount();
  const selectedLevel = clampVocabularyLevel(state.settings.vocabularyLevel);
  const nextWords = words
    .filter((word) => !usedWordIds.has(word.id) && isWordAllowedForLevel(word.level, selectedLevel))
    .slice(0, batchSize);

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
      bonusDueDate: null,
      sameDayReviewDueDate: null,
      learnXpAwarded: false
    };
  });
}

function buildCardsForDate(state: AppState, dateKey: string): SessionCard[] {
  const cards: SessionCard[] = [];

  state.batches
    .slice()
    .sort((left, right) => compareDateKeys(left.createdDate, right.createdDate))
    .forEach((batch) => {
      batch.wordIds.forEach((wordId) => {
        const progress = state.progress[wordId];
        if (!progress || progress.stage === "learned") {
          return;
        }

        if (progress.stage === "new") {
          cards.push(createCard(dateKey, wordId, "new", progress.requiredHits, progress.currentHits));
          return;
        }

        if (progress.sameDayReviewDueDate && compareDateKeys(progress.sameDayReviewDueDate, dateKey) <= 0) {
          cards.push(createCard(dateKey, wordId, "review_same_day", REVIEW_HITS_REQUIRED, 0));
        }

        const dueSource = getDueSource(progress, dateKey);
        if (dueSource) {
          cards.push(createCard(dateKey, wordId, dueSource, REVIEW_HITS_REQUIRED, 0));
        }

        if (progress.bonusDueDate && compareDateKeys(progress.bonusDueDate, dateKey) <= 0) {
          cards.push(createCard(dateKey, wordId, "bonus", REVIEW_HITS_REQUIRED, 0));
        }
      });
    });

  return cards.sort((left, right) => {
    const sourceDelta = CARD_SOURCE_PRIORITY[left.source] - CARD_SOURCE_PRIORITY[right.source];
    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return left.wordId.localeCompare(right.wordId);
  });
}

function createCard(
  dateKey: string,
  wordId: string,
  source: SessionCardSource,
  hitsNeededToday: number,
  hitsDoneToday: number
): SessionCard {
  return {
    id: `${dateKey}:${source}:${wordId}`,
    wordId,
    source,
    hitsNeededToday,
    hitsDoneToday,
    isComplete: hitsDoneToday >= hitsNeededToday,
    failures: 0
  };
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
  state: AppState,
  session: DailySession,
  card: SessionCard,
  progress: WordProgress,
  batchCreatedDate: string,
  currentDateKey: string,
  words: WordEntry[]
) {
  if (card.source === "new") {
    progress.currentHits = Math.min(progress.requiredHits, progress.currentHits + 1);
    card.hitsDoneToday = progress.currentHits;

    if (progress.currentHits >= progress.requiredHits) {
      card.isComplete = true;

      if (!progress.learnXpAwarded) {
        progress.learnXpAwarded = true;
        awardXp(state, LEARN_XP_REWARD);
      }

      promoteFromNew(progress, batchCreatedDate, currentDateKey);
      addSameDayReviewCard(session, currentDateKey, card.wordId);
    }

    return;
  }

  card.hitsDoneToday = REVIEW_HITS_REQUIRED;
  card.isComplete = true;

  if (card.source === "bonus") {
    progress.bonusDueDate = null;
    return;
  }

  if (card.source === "review_same_day") {
    progress.sameDayReviewDueDate = null;
    return;
  }

  promoteReview(progress, card.source, batchCreatedDate);

  if (progress.stage === "learned") {
    const masteryLevel = getHighestUnlockedLevel(state, words);
    if (masteryLevel === "c2") {
      progress.bonusDueDate = null;
    }
  }
}

function applyFailure(card: SessionCard, progress: WordProgress, dateKey: string) {
  card.failures += 1;

  if (card.source !== "new") {
    progress.bonusDueDate = addDays(dateKey, 1);
  }
}

function promoteFromNew(progress: WordProgress, batchCreatedDate: string, currentDateKey: string) {
  progress.stage = "day1";
  progress.requiredHits = REVIEW_HITS_REQUIRED;
  progress.currentHits = 0;
  progress.nextDueDate = addDays(batchCreatedDate, 1);
  progress.sameDayReviewDueDate = currentDateKey;
}

function promoteReview(
  progress: WordProgress,
  source: Exclude<SessionCardSource, "new" | "bonus" | "review_same_day">,
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

function addSameDayReviewCard(session: DailySession, dateKey: string, wordId: string) {
  const sameDayCardId = `${dateKey}:review_same_day:${wordId}`;
  if (session.cards.some((card) => card.id === sameDayCardId)) {
    return;
  }

  session.cards.push(createCard(dateKey, wordId, "review_same_day", REVIEW_HITS_REQUIRED, 0));
}

function maybeGrantDailyReviewReward(state: AppState, words: WordEntry[], dateKey: string) {
  const reviewCards = getReviewCards(state.dailySessions[dateKey]);
  if (reviewCards.length === 0 || reviewCards.some((card) => !card.isComplete)) {
    return;
  }

  if (state.playerProgress.claimedReviewRewardDates.includes(dateKey)) {
    return;
  }

  const equippedStats = getEquippedStats(state);
  awardXp(state, DAILY_REVIEW_XP_REWARD);

  const rewardTier = getHighestUnlockedLevel(state, words);
  const rewardItem = rollRewardItem(rewardTier, equippedStats.glory, equippedStats.luck);

  state.inventory.unshift(rewardItem);
  state.playerProgress.claimedReviewRewardDates.push(dateKey);
  state.dailySessions[dateKey].rewardItemId = rewardItem.id;
}

function awardXp(state: AppState, baseAmount: number) {
  const equippedStats = getEquippedStats(state);
  gainXp(state.playerProgress, getXpAward(baseAmount, equippedStats.wisdom));
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
