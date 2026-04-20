import { describe, expect, it } from "vitest";
import { WORD_BANK } from "../data/wordBank";
import { addDays } from "./date";
import {
  beginSession,
  clampDailyNewWordsCount,
  clampVocabularyLevel,
  createInitialAppState,
  ensureSessionForDate,
  getProfileTitleFromSkillRanks,
  getSessionMetrics,
  getVocabularySkillRank,
  isWordAllowedForLevel,
  recordAttempt
} from "./learningEngine";

function completeFullDay(state: ReturnType<typeof createInitialAppState>, dateKey: string) {
  let nextState = ensureSessionForDate(state, WORD_BANK, dateKey);
  nextState = beginSession(nextState, dateKey, `${dateKey}T08:00:00`);

  while (true) {
    const session = nextState.dailySessions[dateKey];
    const nextCard = session.cards.find((card) => !card.isComplete);

    if (!nextCard) {
      return nextState;
    }

    nextState = recordAttempt(
      nextState,
      WORD_BANK,
      dateKey,
      nextCard.id,
      true,
      `${dateKey}T08:01:00`
    );
  }
}

describe("learningEngine", () => {
  it("creates a first daily batch with exactly five learn cards", () => {
    const state = ensureSessionForDate(createInitialAppState(), WORD_BANK, "2026-04-08");
    const metrics = getSessionMetrics(state.dailySessions["2026-04-08"]);

    expect(metrics.total).toBe(5);
    expect(metrics.learnTotal).toBe(5);
    expect(metrics.reviewTotal).toBe(0);
    expect(state.dailySessions["2026-04-08"].cards.every((card) => card.hitsNeededToday === 3)).toBe(
      true
    );
  });

  it("keeps learn sessions fixed at five words", () => {
    expect(clampDailyNewWordsCount()).toBe(5);
  });

  it("creates new batches using words allowed by the selected vocabulary level", () => {
    const initialState = createInitialAppState();
    initialState.settings.vocabularyLevel = "a1";

    const state = ensureSessionForDate(initialState, WORD_BANK, "2026-04-08");
    const sessionWords = state.dailySessions["2026-04-08"].cards.map(
      (card) => WORD_BANK.find((word) => word.id === card.wordId)!
    );

    expect(sessionWords).toHaveLength(5);
    expect(sessionWords.every((word) => isWordAllowedForLevel(word.level, "a1"))).toBe(true);
  });

  it("falls back to the default vocabulary level when an invalid value is provided", () => {
    expect(clampVocabularyLevel("x1")).toBe("elementary");
  });

  it("spawns same-day review cards and learn XP after sealing a new word", () => {
    let state = ensureSessionForDate(createInitialAppState(), WORD_BANK, "2026-04-08");
    state = beginSession(state, "2026-04-08", "2026-04-08T09:00:00");

    const learnCard = state.dailySessions["2026-04-08"].cards[0];

    state = recordAttempt(state, WORD_BANK, "2026-04-08", learnCard.id, true, "2026-04-08T09:01:00");
    state = recordAttempt(state, WORD_BANK, "2026-04-08", learnCard.id, true, "2026-04-08T09:02:00");
    state = recordAttempt(state, WORD_BANK, "2026-04-08", learnCard.id, true, "2026-04-08T09:03:00");

    const session = state.dailySessions["2026-04-08"];
    const sameDayCard = session.cards.find(
      (card) => card.wordId === learnCard.wordId && card.source === "review_same_day"
    );

    expect(sameDayCard).toBeTruthy();
    expect(state.progress[learnCard.wordId].sameDayReviewDueDate).toBe("2026-04-08");
    expect(state.playerProgress.xp).toBe(3);
  });

  it("starts as Aspirante and upgrades the skill title after clearing 70 percent of a module", () => {
    const state = createInitialAppState();
    const elementaryWords = WORD_BANK.filter((word) => word.level === "elementary").slice(0, 210);

    elementaryWords.forEach((word, index) => {
      state.progress[word.id] = {
        wordId: word.id,
        batchId: `elementary-${index + 1}`,
        stage: "learned",
        requiredHits: 1,
        currentHits: 0,
        lastResult: "success",
        nextDueDate: null,
        bonusDueDate: null,
        sameDayReviewDueDate: null,
        learnXpAwarded: true
      };
    });

    expect(getProfileTitleFromSkillRanks([0])).toBe("Aspirante");
    expect(getProfileTitleFromSkillRanks([getVocabularySkillRank(state, WORD_BANK)])).toBe("Aprendiz");
  });

  it("adds five new words and five previous-day reviews on the next day after a completed batch", () => {
    const dayOneDone = completeFullDay(createInitialAppState(), "2026-04-08");
    const dayTwo = ensureSessionForDate(dayOneDone, WORD_BANK, "2026-04-09");
    const metrics = getSessionMetrics(dayTwo.dailySessions["2026-04-09"]);

    expect(metrics.total).toBe(10);
    expect(metrics.learnTotal).toBe(5);
    expect(metrics.reviewTotal).toBe(5);
  });

  it("grants XP and an item only on the first fully completed review of the day", () => {
    const state = completeFullDay(createInitialAppState(), "2026-04-08");

    expect(state.playerProgress.xp).toBe(22);
    expect(state.playerProgress.claimedReviewRewardDates).toEqual(["2026-04-08"]);
    expect(state.inventory).toHaveLength(1);
    expect(state.dailySessions["2026-04-08"].rewardItemId).toBeTruthy();
  });

  it("schedules a bonus reminder after failing an old review while preserving the next stage", () => {
    let state = completeFullDay(createInitialAppState(), "2026-04-08");
    state = ensureSessionForDate(state, WORD_BANK, "2026-04-09");
    state = beginSession(state, "2026-04-09", "2026-04-09T07:00:00");

    const reviewCard = state.dailySessions["2026-04-09"].cards.find((card) => card.source === "review_day");
    expect(reviewCard).toBeTruthy();

    state = recordAttempt(state, WORD_BANK, "2026-04-09", reviewCard!.id, false, "2026-04-09T07:01:00");
    state = recordAttempt(state, WORD_BANK, "2026-04-09", reviewCard!.id, true, "2026-04-09T07:02:00");

    const progress = state.progress[reviewCard!.wordId];
    expect(progress.stage).toBe("week1");
    expect(progress.nextDueDate).toBe("2026-04-15");
    expect(progress.bonusDueDate).toBe("2026-04-10");
  });

  it("shows day review, weekly review, and new batch together after one week of continuous study", () => {
    let state = createInitialAppState();
    let currentDay = "2026-04-08";

    for (let index = 0; index < 7; index += 1) {
      state = completeFullDay(state, currentDay);
      currentDay = addDays(currentDay, 1);
    }

    const dayEight = ensureSessionForDate(state, WORD_BANK, currentDay);
    const session = dayEight.dailySessions[currentDay];

    expect(session.cards.filter((card) => card.source === "new")).toHaveLength(5);
    expect(session.cards.filter((card) => card.source === "review_day")).toHaveLength(5);
    expect(session.cards.filter((card) => card.source === "review_week")).toHaveLength(5);
  });

  it("marks a word as learned after the monthly review succeeds", () => {
    let state = createInitialAppState();

    state = completeFullDay(state, "2026-04-08");
    state = completeFullDay(state, "2026-04-09");
    state = ensureSessionForDate(state, WORD_BANK, "2026-04-15");
    state = beginSession(state, "2026-04-15", "2026-04-15T09:00:00");

    const weeklyReviewCard = state.dailySessions["2026-04-15"].cards.find(
      (card) => card.source === "review_week"
    )!;

    state = recordAttempt(state, WORD_BANK, "2026-04-15", weeklyReviewCard.id, true, "2026-04-15T09:01:00");
    state = ensureSessionForDate(state, WORD_BANK, "2026-05-08");
    state = beginSession(state, "2026-05-08", "2026-05-08T09:00:00");

    const monthlyReviewCard = state.dailySessions["2026-05-08"].cards.find(
      (card) => card.wordId === weeklyReviewCard.wordId && card.source === "review_month"
    )!;

    state = recordAttempt(state, WORD_BANK, "2026-05-08", monthlyReviewCard.id, true, "2026-05-08T09:01:00");

    expect(state.progress[weeklyReviewCard.wordId].stage).toBe("learned");
    expect(state.progress[weeklyReviewCard.wordId].nextDueDate).toBeNull();
  });
});
