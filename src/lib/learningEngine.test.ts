import { describe, expect, it } from "vitest";
import { WORD_BANK } from "../data/wordBank";
import { addDays } from "./date";
import {
  beginSession,
  createInitialAppState,
  ensureSessionForDate,
  getSessionMetrics,
  recordAttempt
} from "./learningEngine";

function completeSessionDay(state: ReturnType<typeof createInitialAppState>, dateKey: string) {
  let nextState = ensureSessionForDate(state, WORD_BANK, dateKey);
  nextState = beginSession(nextState, dateKey, `${dateKey}T08:00:00`);

  while (true) {
    const session = nextState.dailySessions[dateKey];
    const nextCard = session.cards.find((card) => !card.isComplete);

    if (!nextCard) {
      return nextState;
    }

    nextState = recordAttempt(nextState, dateKey, nextCard.wordId, true, `${dateKey}T08:01:00`);
  }
}

describe("learningEngine", () => {
  it("creates a first daily batch with exactly ten new cards", () => {
    const state = ensureSessionForDate(createInitialAppState(), WORD_BANK, "2026-04-08");
    const metrics = getSessionMetrics(state.dailySessions["2026-04-08"]);

    expect(metrics.total).toBe(10);
    expect(metrics.newCount).toBe(10);
    expect(state.dailySessions["2026-04-08"].cards.every((card) => card.hitsNeededToday === 3)).toBe(
      true
    );
  });

  it("adds new words and previous-day reviews on the next day after a completed batch", () => {
    const dayOneDone = completeSessionDay(createInitialAppState(), "2026-04-08");
    const dayTwo = ensureSessionForDate(dayOneDone, WORD_BANK, "2026-04-09");
    const metrics = getSessionMetrics(dayTwo.dailySessions["2026-04-09"]);

    expect(metrics.total).toBe(20);
    expect(metrics.newCount).toBe(10);
    expect(metrics.reviewCount).toBe(10);
  });

  it("schedules a bonus reminder after failing an old review while preserving the next stage", () => {
    let state = completeSessionDay(createInitialAppState(), "2026-04-08");
    state = ensureSessionForDate(state, WORD_BANK, "2026-04-09");
    state = beginSession(state, "2026-04-09", "2026-04-09T07:00:00");

    const reviewCard = state.dailySessions["2026-04-09"].cards.find((card) => card.source === "review_day");
    expect(reviewCard).toBeTruthy();

    state = recordAttempt(state, "2026-04-09", reviewCard!.wordId, false, "2026-04-09T07:01:00");
    state = recordAttempt(state, "2026-04-09", reviewCard!.wordId, true, "2026-04-09T07:02:00");

    const progress = state.progress[reviewCard!.wordId];
    expect(progress.stage).toBe("week1");
    expect(progress.nextDueDate).toBe("2026-04-15");
    expect(progress.bonusDueDate).toBe("2026-04-10");
  });

  it("shows day review, weekly review, and new batch together after one week of continuous study", () => {
    let state = createInitialAppState();
    let currentDay = "2026-04-08";

    for (let index = 0; index < 7; index += 1) {
      state = completeSessionDay(state, currentDay);
      currentDay = addDays(currentDay, 1);
    }

    const dayEight = ensureSessionForDate(state, WORD_BANK, currentDay);
    const session = dayEight.dailySessions[currentDay];

    expect(session.cards.filter((card) => card.source === "new")).toHaveLength(10);
    expect(session.cards.filter((card) => card.source === "review_day")).toHaveLength(10);
    expect(session.cards.filter((card) => card.source === "review_week")).toHaveLength(10);
  });

  it("marks a word as learned after the monthly review succeeds", () => {
    let state = createInitialAppState();

    state = completeSessionDay(state, "2026-04-08");
    state = completeSessionDay(state, "2026-04-09");
    state = ensureSessionForDate(state, WORD_BANK, "2026-04-16");
    state = beginSession(state, "2026-04-16", "2026-04-16T09:00:00");

    const weeklyReviewWordId = state.dailySessions["2026-04-16"].cards.find(
      (card) => card.source === "review_week"
    )!.wordId;

    state = recordAttempt(state, "2026-04-16", weeklyReviewWordId, true, "2026-04-16T09:01:00");
    state = ensureSessionForDate(state, WORD_BANK, "2026-05-08");
    state = beginSession(state, "2026-05-08", "2026-05-08T09:00:00");
    state = recordAttempt(state, "2026-05-08", weeklyReviewWordId, true, "2026-05-08T09:01:00");

    expect(state.progress[weeklyReviewWordId].stage).toBe("learned");
    expect(state.progress[weeklyReviewWordId].nextDueDate).toBeNull();
  });
});
