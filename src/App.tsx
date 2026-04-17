import { useEffect, useRef, useState } from "react";
import { HomeScreen } from "./components/HomeScreen";
import { InventoryScreen } from "./components/InventoryScreen";
import { LearnScreen } from "./components/LearnScreen";
import { ProfileModal } from "./components/ProfileModal";
import { ReminderModal } from "./components/ReminderModal";
import { ReminderScreen } from "./components/ReminderScreen";
import { ReviewScreen } from "./components/ReviewScreen";
import { VocabularyHubScreen } from "./components/VocabularyHubScreen";
import { Particles } from "./components/ui/Particles";
import { WORD_BANK } from "./data/wordBank";
import { addDays, formatDateLabel, formatTimeLabel, hasTimePassed, toDateKey } from "./lib/date";
import {
  beginSession,
  clampVocabularyLevel,
  countLearnedWords,
  DEFAULT_VOCABULARY_LEVEL,
  ensureSessionForDate,
  getPendingLearnCards,
  getPendingReviewCards,
  getProfileTitleFromSkillRanks,
  getReviewCards,
  getSessionMetrics,
  getStreakSummary,
  getVocabularyMasteryTitle,
  getVocabularyModuleProgress,
  getVocabularySkillRank,
  previewSessionForDate,
  recordAttempt,
  VOCABULARY_LEVEL_META,
  VOCABULARY_LEVELS
} from "./lib/learningEngine";
import { getEquippedStats } from "./lib/rpg";
import {
  getReminderPermission,
  isNativeReminderPlatform,
  requestReminderPermission,
  syncNativeReminderSchedule,
  startReminderLoop
} from "./lib/notificationService";
import { loadAppState, saveAppState } from "./lib/storage";
import { EquipmentSlot, InventoryItem, VocabularyLevel, WordEntry } from "./types";

type AppView = "home" | "vocabulary" | "learn" | "review" | "reminder";

const REVIEW_SOURCE_LABELS = {
  review_same_day: "Repaso del dia",
  review_day: "Repaso de ayer",
  review_week: "Repaso semanal",
  review_month: "Repaso mensual",
  bonus: "Sello bonus"
} as const;

function getWordLookup() {
  return WORD_BANK.reduce<Record<string, WordEntry>>((lookup, word) => {
    lookup[word.id] = word;
    return lookup;
  }, {});
}

function getPageTitle(view: AppView) {
  switch (view) {
    case "learn":
      return "Aprender";
    case "review":
      return "Repasar";
    case "reminder":
      return "Recordatorio";
    case "vocabulary":
      return "Vocabulary";
    default:
      return "Skills";
  }
}

function getInventorySortRank(item: InventoryItem) {
  const rarityRank = { legendary: 0, epic: 1, rare: 2, common: 3 }[item.rarity];
  return `${rarityRank}-${item.slot}-${item.name}`;
}

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState<AppView>("home");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [appState, setAppState] = useState(() =>
    ensureSessionForDate(loadAppState(), WORD_BANK, toDateKey(new Date()))
  );
  const appStateRef = useRef(appState);
  const isNativeApp = isNativeReminderPlatform();

  const todayKey = toDateKey(now);
  const wordLookup = getWordLookup();
  const todaysSession = appState.dailySessions[todayKey];
  const todaysMetrics = getSessionMetrics(todaysSession);
  const tomorrowMetrics = getSessionMetrics(previewSessionForDate(appState, WORD_BANK, addDays(todayKey, 1)));
  const vocabularyLevel = clampVocabularyLevel(
    appState.settings.vocabularyLevel ?? DEFAULT_VOCABULARY_LEVEL
  );
  const vocabularyLevelMeta = VOCABULARY_LEVEL_META[vocabularyLevel];
  const vocabularySkillRank = getVocabularySkillRank(appState, WORD_BANK);
  const profileTitle = getProfileTitleFromSkillRanks([vocabularySkillRank]);
  const displayName = appState.settings.displayName.trim() || "Traveler";
  const masteryTitle = getVocabularyMasteryTitle(appState, WORD_BANK);
  const learnedWords = countLearnedWords(appState);
  const streak = getStreakSummary(appState.dailySessions);
  const pendingLearnCards = getPendingLearnCards(todaysSession);
  const reviewCards = getReviewCards(todaysSession);
  const pendingReviewCards = getPendingReviewCards(todaysSession);
  const activeLearnCard = pendingLearnCards[0];
  const activeReviewCard = pendingReviewCards[0];
  const activeLearnWord = activeLearnCard ? wordLookup[activeLearnCard.wordId] : undefined;
  const activeReviewWord = activeReviewCard ? wordLookup[activeReviewCard.wordId] : undefined;
  const equippedStats = getEquippedStats(appState);
  const inventoryItems = [...appState.inventory].sort((left, right) =>
    getInventorySortRank(left).localeCompare(getInventorySortRank(right))
  );
  const selectedItem =
    inventoryItems.find((item) => item.id === selectedItemId) ?? inventoryItems[0] ?? null;
  const todaysRewardItem = todaysSession?.rewardItemId
    ? appState.inventory.find((item) => item.id === todaysSession.rewardItemId) ?? null
    : null;
  const reviewRewardClaimedToday = appState.playerProgress.claimedReviewRewardDates.includes(todayKey);
  const showInlineReminder =
    (todaysMetrics.learnPending > 0 || todaysMetrics.reviewPending > 0) &&
    hasTimePassed(todayKey, appState.settings.preferredReminderTime, now);
  const nextLockedModule = getVocabularyModuleProgress(appState, WORD_BANK).find(
    (module) => !module.isUnlocked
  );
  const reviewCounts = {
    sameDay: reviewCards.filter((card) => card.source === "review_same_day").length,
    day: reviewCards.filter((card) => card.source === "review_day").length,
    week: reviewCards.filter((card) => card.source === "review_week").length,
    month: reviewCards.filter((card) => card.source === "review_month").length,
    bonus: reviewCards.filter((card) => card.source === "bonus").length
  };

  useEffect(() => {
    appStateRef.current = appState;
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    void (async () => {
      const permission = await getReminderPermission();
      setAppState((currentState) => {
        if (currentState.settings.notificationPermission === permission) {
          return currentState;
        }

        return {
          ...currentState,
          settings: {
            ...currentState.settings,
            notificationPermission: permission,
            notificationsEnabled:
              permission === "granted" ? currentState.settings.notificationsEnabled : false
          }
        };
      });
    })();
  }, []);

  useEffect(() => {
    if (!isNativeApp) {
      return;
    }

    void syncNativeReminderSchedule(appState);
  }, [
    appState.settings.notificationsEnabled,
    appState.settings.notificationPermission,
    appState.settings.preferredReminderTime,
    isNativeApp
  ]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setAppState((currentState) => ensureSessionForDate(currentState, WORD_BANK, todayKey));
  }, [todayKey]);

  useEffect(() => {
    return startReminderLoop({
      getSnapshot: () => appStateRef.current,
      getNow: () => new Date(),
      onNotify: (dateKey) => {
        setAppState((currentState) => {
          if (currentState.lastNotificationDate === dateKey) {
            return currentState;
          }

          return {
            ...currentState,
            lastNotificationDate: dateKey
          };
        });
      }
    });
  }, []);

  useEffect(() => {
    setIsCardFlipped(false);
    setTranslationRevealed(false);
  }, [activeLearnCard?.id, activeReviewCard?.id, view]);

  useEffect(() => {
    if (!selectedItemId && inventoryItems[0]) {
      setSelectedItemId(inventoryItems[0].id);
    }
  }, [inventoryItems, selectedItemId]);

  const pageTitle = getPageTitle(view);

  const openTimedView = (nextView: Exclude<AppView, "home" | "vocabulary">) => {
    setAppState((currentState) => beginSession(currentState, todayKey, new Date().toISOString()));
    setView(nextView);
  };

  const handleLearnAnswer = (success: boolean) => {
    if (!activeLearnCard) {
      return;
    }

    setAppState((currentState) =>
      recordAttempt(
        currentState,
        WORD_BANK,
        todayKey,
        activeLearnCard.id,
        success,
        new Date().toISOString()
      )
    );
  };

  const handleReviewAnswer = (success: boolean) => {
    if (!activeReviewCard) {
      return;
    }

    setAppState((currentState) =>
      recordAttempt(
        currentState,
        WORD_BANK,
        todayKey,
        activeReviewCard.id,
        success,
        new Date().toISOString()
      )
    );
  };

  const handleReminderConfirm = async () => {
    const permission = await requestReminderPermission();

    setAppState((currentState) => ({
      ...currentState,
      settings: {
        ...currentState.settings,
        notificationPermission: permission,
        notificationsEnabled: permission === "granted"
      }
    }));
    setShowReminderModal(false);
  };

  const handleReminderToggle = () => {
    if (appState.settings.notificationPermission === "granted") {
      setAppState((currentState) => ({
        ...currentState,
        settings: {
          ...currentState.settings,
          notificationsEnabled: !currentState.settings.notificationsEnabled
        }
      }));
      return;
    }

    setShowReminderModal(true);
  };

  const handleReminderTimeChange = (value: string) => {
    setAppState((currentState) => ({
      ...currentState,
      settings: {
        ...currentState.settings,
        preferredReminderTime: value
      }
    }));
  };

  const handleDisplayNameSave = (nextName: string) => {
    setAppState((currentState) => ({
      ...currentState,
      settings: {
        ...currentState.settings,
        displayName: nextName.trim() || "Traveler"
      }
    }));
    setShowProfileModal(false);
  };

  const handleLevelChange = (level: VocabularyLevel) => {
    setAppState((currentState) => ({
      ...currentState,
      settings: {
        ...currentState.settings,
        vocabularyLevel: level
      }
    }));
  };

  const handleEquipItem = (item: InventoryItem) => {
    setAppState((currentState) => ({
      ...currentState,
      equipment: {
        ...currentState.equipment,
        [item.slot]: item.id
      }
    }));
  };

  const handleUnequipSlot = (slot: EquipmentSlot) => {
    setAppState((currentState) => ({
      ...currentState,
      equipment: {
        ...currentState.equipment,
        [slot]: null
      }
    }));
  };

  return (
    <div className="app-shell">
      <Particles
        className="app-background-particles"
        color="rgba(89, 232, 255, 0.34)"
        quantity={96}
        seed={21}
        size={0.58}
      />
      <main className="app-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow font-choice-3">Learn English</p>
            <h1 className="font-choice-1">{pageTitle}</h1>
          </div>
          <div className="topbar__actions">
            {view !== "home" && (
              <button className="button button--ghost topbar__button font-choice-1" onClick={() => setView("home")} type="button">
                Main menu
              </button>
            )}
            <button
              className="button topbar__button topbar__button--character font-choice-1"
              onClick={() => setShowInventoryModal(true)}
              type="button"
            >
              CHARACTER
            </button>
          </div>
        </header>

        {view === "home" && (
          <HomeScreen
            displayName={displayName}
            masteryTitle={masteryTitle}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenVocabulary={() => setView("vocabulary")}
            profileTitle={profileTitle}
          />
        )}

        {view === "vocabulary" && (
          <VocabularyHubScreen
            learnTierLabel={`${vocabularyLevelMeta.cefr} Â· ${vocabularyLevelMeta.title}`}
            masteryTitle={masteryTitle}
            onOpenLearn={() => openTimedView("learn")}
            onOpenReminder={() => setView("reminder")}
            onOpenReview={() => openTimedView("review")}
            onSelectLevel={handleLevelChange}
            onToggleReminder={handleReminderToggle}
            playerLevel={appState.playerProgress.level}
            playerXp={appState.playerProgress.xp}
            reminderValue={appState.settings.preferredReminderTime}
            reminderEnabled={appState.settings.notificationsEnabled}
            reviewCounts={reviewCounts}
            selectedLevel={vocabularyLevel}
            showInlineReminder={showInlineReminder}
            tierOptions={VOCABULARY_LEVELS.map((level) => ({
              level,
              title: VOCABULARY_LEVEL_META[level].title,
              cefr: VOCABULARY_LEVEL_META[level].cefr
            }))}
            onChangeReminderTime={handleReminderTimeChange}
            xpToNextLevel={appState.playerProgress.xpToNextLevel}
          />
        )}

        {view === "learn" && (
          <LearnScreen
            card={activeLearnCard ?? null}
            isCardFlipped={isCardFlipped}
            onBack={() => setView("vocabulary")}
            onFail={() => handleLearnAnswer(false)}
            onFlip={() => setIsCardFlipped((current) => !current)}
            onOpenReview={() => setView("review")}
            onRevealTranslation={() => setTranslationRevealed(true)}
            onSuccess={() => handleLearnAnswer(true)}
            progressLabel={`${todaysMetrics.learnTotal - todaysMetrics.learnPending}/${todaysMetrics.learnTotal || 5} selladas`}
            tierLabel={`${vocabularyLevelMeta.cefr} Â· ${vocabularyLevelMeta.title}`}
            translationRevealed={translationRevealed}
            vocabularyLevel={vocabularyLevel}
            word={activeLearnWord}
          />
        )}

        {view === "review" && (
          <ReviewScreen
            activeSourceLabel={
              activeReviewCard && activeReviewCard.source !== "new"
                ? REVIEW_SOURCE_LABELS[activeReviewCard.source]
                : "Repaso"
            }
            card={activeReviewCard ?? null}
            isCardFlipped={isCardFlipped}
            onBack={() => setView("vocabulary")}
            onFail={() => handleReviewAnswer(false)}
            onFlip={() => setIsCardFlipped((current) => !current)}
            onOpenInventory={() => setShowInventoryModal(true)}
            onSuccess={() => handleReviewAnswer(true)}
            reviewCardsTotal={reviewCards.length}
            reviewCountsText={`Hoy ${reviewCounts.sameDay} del dia, ${reviewCounts.day} de ayer, ${reviewCounts.week} semanales, ${reviewCounts.month} mensuales y ${reviewCounts.bonus} bonus.`}
            reviewProgress={`${todaysMetrics.reviewTotal - todaysMetrics.reviewPending}/${todaysMetrics.reviewTotal || 0} cerradas`}
            rewardClaimed={reviewRewardClaimedToday}
            rewardItem={todaysRewardItem}
            word={activeReviewWord}
          />
        )}

        {view === "reminder" && (
          <ReminderScreen
            onChangeTime={handleReminderTimeChange}
            onToggleReminder={handleReminderToggle}
            reminderChannelLabel={isNativeApp ? "Notificacion Android" : "Notificacion web"}
            reminderEnabled={appState.settings.notificationsEnabled}
            reminderTime={appState.settings.preferredReminderTime}
            showInlineReminder={showInlineReminder}
          />
        )}

        {showReminderModal && (
          <ReminderModal onClose={() => setShowReminderModal(false)} onConfirm={handleReminderConfirm} />
        )}
        {showInventoryModal && (
          <div className="modal-shell inventory-modal-shell" onClick={() => setShowInventoryModal(false)}>
            <div
              className="inventory-modal-panel"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Character"
            >
              <div className="inventory-modal-panel__topbar">
                <p className="eyebrow font-choice-3">Character</p>
                <button
                  className="button button--ghost font-choice-1"
                  onClick={() => setShowInventoryModal(false)}
                  type="button"
                >
                  Cerrar
                </button>
              </div>
              <InventoryScreen
                displayName={displayName}
                equipment={appState.equipment}
                equippedStats={equippedStats}
                inventoryCount={appState.inventory.length}
                inventoryItems={inventoryItems}
                onEquipItem={handleEquipItem}
                onSelectItem={setSelectedItemId}
                onUnequipSlot={handleUnequipSlot}
                playerLevel={appState.playerProgress.level}
                profileTitle={profileTitle}
                selectedItem={selectedItem}
              />
            </div>
          </div>
        )}
        {showProfileModal && (
          <ProfileModal
            currentName={displayName}
            onClose={() => setShowProfileModal(false)}
            onSave={handleDisplayNameSave}
            profileTitle={profileTitle}
          />
        )}
      </main>
    </div>
  );
}
