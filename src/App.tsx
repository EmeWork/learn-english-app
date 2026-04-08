import { useEffect, useRef, useState } from "react";
import { ReminderModal } from "./components/ReminderModal";
import { WordCard } from "./components/WordCard";
import { WORD_BANK } from "./data/wordBank";
import {
  addDays,
  formatDateLabel,
  formatDurationLabel,
  formatTimeLabel,
  hasTimePassed,
  toDateKey
} from "./lib/date";
import {
  beginSession,
  countLearnedWords,
  ensureSessionForDate,
  getNextDueDate,
  getSessionCompletedBreakdown,
  getSessionMetrics,
  getSessionNewWords,
  getStreakSummary,
  isSessionPending,
  previewSessionForDate,
  recordAttempt
} from "./lib/learningEngine";
import {
  getReminderPermission,
  isNativeReminderPlatform,
  requestReminderPermission,
  syncNativeReminderSchedule,
  startReminderLoop
} from "./lib/notificationService";
import { loadAppState, saveAppState } from "./lib/storage";
import { SessionCardSource, WordEntry } from "./types";

type AppView = "menu" | "session" | "summary";

const SOURCE_LABELS: Record<SessionCardSource, string> = {
  new: "Nueva",
  review_day: "Repaso del dia",
  review_week: "Repaso semanal",
  review_month: "Repaso mensual",
  bonus: "Refuerzo bonus"
};

function getWordLookup() {
  return WORD_BANK.reduce<Record<string, WordEntry>>((lookup, word) => {
    lookup[word.id] = word;
    return lookup;
  }, {});
}

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState<AppView>("menu");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const isNativeApp = isNativeReminderPlatform();
  const [appState, setAppState] = useState(() =>
    ensureSessionForDate(loadAppState(), WORD_BANK, toDateKey(new Date()))
  );

  const appStateRef = useRef(appState);
  const todayKey = toDateKey(now);
  const wordLookup = getWordLookup();
  const todaysSession = appState.dailySessions[todayKey];
  const todaysMetrics = getSessionMetrics(todaysSession);
  const todaysNewWords = getSessionNewWords(todaysSession, WORD_BANK);
  const currentCard = todaysSession?.cards.find((card) => !card.isComplete);
  const currentWord = currentCard ? wordLookup[currentCard.wordId] : undefined;
  const streak = getStreakSummary(appState.dailySessions);
  const learnedWords = countLearnedWords(appState);
  const showInlineReminder =
    todaysMetrics.pending > 0 && hasTimePassed(todayKey, appState.settings.preferredReminderTime, now);
  const tomorrowKey = addDays(todayKey, 1);
  const tomorrowPreview = previewSessionForDate(appState, WORD_BANK, tomorrowKey);
  const tomorrowMetrics = getSessionMetrics(tomorrowPreview);
  const summaryBreakdown = getSessionCompletedBreakdown(todaysSession);
  const nextDueDate = getNextDueDate(appState);

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
    if (view === "session" && todaysSession?.completedAt) {
      setView("summary");
    }
  }, [todaysSession?.completedAt, view]);

  useEffect(() => {
    setIsCardFlipped(false);
  }, [currentCard?.wordId]);

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

  const handleAnswer = (success: boolean) => {
    if (!currentCard) {
      return;
    }

    const timestamp = new Date().toISOString();
    setAppState((currentState) =>
      recordAttempt(currentState, todayKey, currentCard.wordId, success, timestamp)
    );
  };

  const handleOpenSession = () => {
    if (todaysSession?.completedAt) {
      setView("summary");
      return;
    }

    setView("session");
  };

  const handleStartSession = () => {
    setAppState((currentState) => beginSession(currentState, todayKey, new Date().toISOString()));
  };

  const handleReminderButton = () => {
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

  const activeProgressLabel = currentCard
    ? `${currentCard.hitsDoneToday}/${currentCard.hitsNeededToday} aciertos`
    : "";

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />

      <main className="app-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">Learn English</p>
            <h1>Menu diario de vocabulario</h1>
          </div>
          <button className="button button--ghost topbar__button" onClick={() => setView("menu")} type="button">
            Inicio
          </button>
        </header>

        {view === "menu" && (
          <section className="stack-lg">
            <article className="hero-card">
              <div className="hero-card__copy">
                <p className="eyebrow">Sesion de hoy</p>
                <h2>
                  {todaysMetrics.pending > 0
                    ? `Tienes ${todaysMetrics.pending} tarjetas por practicar`
                    : "Tu sesion de hoy ya esta resuelta"}
                </h2>
                <p>
                  Practica 10 palabras nuevas solo cuando cierres el lote activo y mezcla repasos
                  del dia, la semana y el mes.
                </p>
                <div className="hero-card__actions">
                  <button className="button button--primary" onClick={handleOpenSession} type="button">
                    Aprender palabras
                  </button>
                  <button className="button button--ghost" onClick={() => setView("summary")} type="button">
                    Ver resumen
                  </button>
                </div>
              </div>

              <div className="hero-card__stats">
                <div className="stat-pill stat-pill--accent">
                  <span>Progreso hoy</span>
                  <strong>
                    {todaysMetrics.completed}/{todaysMetrics.total || 0}
                  </strong>
                </div>
                <div className="stat-pill">
                  <span>Racha actual</span>
                  <strong>{streak.current} dias</strong>
                </div>
                <div className="stat-pill">
                  <span>Palabras aprendidas</span>
                  <strong>{learnedWords}</strong>
                </div>
              </div>
            </article>

            {showInlineReminder && (
              <article className="inline-banner">
                <div>
                  <p className="eyebrow">Recordatorio</p>
                  <strong>Tu practica de hoy ya deberia empezar.</strong>
                  <p>
                    Abre la sesion y avanza con tus nuevas palabras y los repasos pendientes.
                  </p>
                </div>
              </article>
            )}

            <section className="dashboard-grid">
              <article className="panel-card panel-card--menu">
                <div className="panel-card__header">
                  <div>
                    <p className="eyebrow">Vista de hoy</p>
                    <h3>Lo que te espera</h3>
                  </div>
                  <span className="badge badge--warm">{formatDateLabel(todayKey)}</span>
                </div>

                <div className="tag-row">
                  <span className="badge badge--soft">{todaysMetrics.newCount} nuevas</span>
                  <span className="badge badge--soft">{todaysMetrics.reviewCount} repasos</span>
                  <span className="badge badge--soft">{todaysMetrics.bonusCount} bonus</span>
                </div>

                {todaysNewWords.length > 0 ? (
                  <div className="word-preview-list">
                    {todaysNewWords.slice(0, 5).map((word) => (
                      <div className="word-preview" key={word.id}>
                        <strong>{word.spanish}</strong>
                        <span>{word.english}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-copy">
                    Hoy no se abre un lote nuevo hasta cerrar los repasos y el lote activo.
                  </p>
                )}
              </article>

              <article className="panel-card">
                <div className="panel-card__header">
                  <div>
                    <p className="eyebrow">Recordatorio diario</p>
                    <h3>Hora preferida</h3>
                  </div>
                  <span className="badge badge--soft">{formatTimeLabel(appState.settings.preferredReminderTime)}</span>
                </div>

                <label className="time-picker">
                  <span>Elegir hora</span>
                  <input
                    onChange={(event) => handleReminderTimeChange(event.target.value)}
                    type="time"
                    value={appState.settings.preferredReminderTime}
                  />
                </label>

                <button className="button button--secondary" onClick={handleReminderButton} type="button">
                  {appState.settings.notificationsEnabled
                    ? isNativeApp
                      ? "Desactivar aviso nativo"
                      : "Desactivar aviso web"
                    : isNativeApp
                      ? "Activar aviso nativo"
                      : "Activar aviso web"}
                </button>

                <p className="muted-copy">
                  {appState.settings.notificationPermission === "granted" &&
                    (isNativeApp
                      ? "Android mostrara una notificacion diaria aunque la app este cerrada."
                      : "El navegador intentara avisarte mientras la app este disponible.")}
                  {(appState.settings.notificationPermission === "default" ||
                    appState.settings.notificationPermission === "prompt" ||
                    appState.settings.notificationPermission === "prompt-with-rationale") &&
                    (isNativeApp
                      ? "Puedes activar permisos de Android para recibir el recordatorio diario aunque la app este cerrada."
                      : "Puedes activar permisos del navegador y mantener tambien el aviso dentro de la app.")}
                  {appState.settings.notificationPermission === "denied" &&
                    (isNativeApp
                      ? "Android no tiene permiso para notificar; la app seguira mostrando recordatorios internos."
                      : "El navegador bloqueo las notificaciones; la app seguira mostrando recordatorios internos.")}
                  {appState.settings.notificationPermission === "unsupported" &&
                    "Este navegador no expone notificaciones web; el recordatorio interno sigue activo."}
                </p>
              </article>
            </section>

            <section className="dashboard-grid">
              <article className="panel-card">
                <div className="panel-card__header">
                  <div>
                    <p className="eyebrow">Ritmo de estudio</p>
                    <h3>Tu consistencia</h3>
                  </div>
                </div>

                <div className="stats-rows">
                  <div>
                    <span>Racha actual</span>
                    <strong>{streak.current} dias</strong>
                  </div>
                  <div>
                    <span>Mejor racha</span>
                    <strong>{streak.longest} dias</strong>
                  </div>
                  <div>
                    <span>Tiempo hoy</span>
                    <strong>{formatDurationLabel(todaysSession?.elapsedMs ?? 0)}</strong>
                  </div>
                </div>
              </article>

              <article className="panel-card">
                <div className="panel-card__header">
                  <div>
                    <p className="eyebrow">Proxima senal</p>
                    <h3>Lo que sigue</h3>
                  </div>
                </div>

                <div className="stats-rows">
                  <div>
                    <span>Proximo dia fuerte</span>
                    <strong>{nextDueDate ? formatDateLabel(nextDueDate) : "Sin repaso pendiente"}</strong>
                  </div>
                  <div>
                    <span>Manana</span>
                    <strong>{tomorrowMetrics.total} tarjetas previstas</strong>
                  </div>
                  <div>
                    <span>Nuevas manana</span>
                    <strong>{tomorrowMetrics.newCount}</strong>
                  </div>
                </div>
              </article>
            </section>
          </section>
        )}

        {view === "session" && (
          <section className="stack-lg">
            {!todaysSession || todaysMetrics.total === 0 ? (
              <article className="panel-card panel-card--empty">
                <p className="eyebrow">Sesion vacia</p>
                <h2>No hay tarjetas pendientes ahora mismo</h2>
                <p>Cuando llegue el siguiente bloque o repaso, aparecera aqui automaticamente.</p>
              </article>
            ) : !todaysSession.startedAt ? (
              <article className="session-preview">
                <div className="session-preview__copy">
                  <p className="eyebrow">Antes de empezar</p>
                  <h2>Deck de {todaysMetrics.total} tarjetas para hoy</h2>
                  <p>
                    Las nuevas necesitan 3 aciertos. Las viejas necesitan 1 y si fallas una se
                    agenda un refuerzo bonus para manana.
                  </p>
                </div>

                <div className="tag-row">
                  <span className="badge badge--warm">{todaysMetrics.newCount} nuevas</span>
                  <span className="badge badge--soft">{todaysMetrics.reviewCount} repasos</span>
                  <span className="badge badge--soft">{todaysMetrics.bonusCount} bonus</span>
                </div>

                {todaysNewWords.length > 0 && (
                  <div className="word-preview-list word-preview-list--expanded">
                    {todaysNewWords.map((word) => (
                      <div className="word-preview" key={word.id}>
                        <strong>{word.spanish}</strong>
                        <span>{word.english}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="hero-card__actions">
                  <button className="button button--primary" onClick={handleStartSession} type="button">
                    Iniciar practica
                  </button>
                  <button className="button button--ghost" onClick={() => setView("menu")} type="button">
                    Volver al menu
                  </button>
                </div>
              </article>
            ) : currentCard && currentWord ? (
              <>
                <article className="session-topbar">
                  <div>
                    <p className="eyebrow">Tarjeta activa</p>
                    <h2>{SOURCE_LABELS[currentCard.source]}</h2>
                  </div>
                  <div className="session-topbar__stats">
                    <span className="badge badge--warm">
                      {todaysMetrics.completed}/{todaysMetrics.total} listas
                    </span>
                    <span className="badge badge--soft">{todaysMetrics.pending} pendientes</span>
                  </div>
                </article>

                <WordCard
                  isFlipped={isCardFlipped}
                  onFlip={() => setIsCardFlipped((current) => !current)}
                  progressLabel={activeProgressLabel}
                  sourceLabel={SOURCE_LABELS[currentCard.source]}
                  word={currentWord}
                />

                <div className="answer-bar">
                  <button
                    className="button button--danger"
                    disabled={!isCardFlipped}
                    onClick={() => handleAnswer(false)}
                    type="button"
                  >
                    Falle
                  </button>
                  <button
                    className="button button--success"
                    disabled={!isCardFlipped}
                    onClick={() => handleAnswer(true)}
                    type="button"
                  >
                    La pegue
                  </button>
                </div>

                <article className="panel-card">
                  <div className="panel-card__header">
                    <div>
                      <p className="eyebrow">Ritmo de la sesion</p>
                      <h3>Tu progreso en vivo</h3>
                    </div>
                  </div>

                  <div className="stats-rows">
                    <div>
                      <span>Intentos</span>
                      <strong>{todaysSession.totalAttempts}</strong>
                    </div>
                    <div>
                      <span>Tiempo</span>
                      <strong>{formatDurationLabel(todaysSession.elapsedMs)}</strong>
                    </div>
                    <div>
                      <span>Fallos de esta tarjeta</span>
                      <strong>{currentCard.failures}</strong>
                    </div>
                  </div>
                </article>
              </>
            ) : (
              <article className="panel-card panel-card--empty">
                <p className="eyebrow">Muy bien</p>
                <h2>Completaste todas las tarjetas de hoy</h2>
                <p>Pasa al resumen para ver lo que cerraste y lo que sigue manana.</p>
              </article>
            )}
          </section>
        )}

        {view === "summary" && (
          <section className="stack-lg">
            <article className="summary-hero">
              <div>
                <p className="eyebrow">Resumen diario</p>
                <h2>
                  {todaysSession?.completedAt
                    ? "Sesion completada"
                    : "Aun tienes tarjetas pendientes"}
                </h2>
                <p>
                  Mira tu avance del dia y vuelve al menu cuando quieras continuar con la rutina.
                </p>
              </div>

              <div className="tag-row">
                <span className="badge badge--warm">{summaryBreakdown.newCards} nuevas cerradas</span>
                <span className="badge badge--soft">{summaryBreakdown.reviewCards} repasos hechos</span>
              </div>
            </article>

            <section className="dashboard-grid">
              <article className="panel-card">
                <div className="stats-rows">
                  <div>
                    <span>Tiempo dedicado</span>
                    <strong>{formatDurationLabel(todaysSession?.elapsedMs ?? 0)}</strong>
                  </div>
                  <div>
                    <span>Intentos</span>
                    <strong>{todaysSession?.totalAttempts ?? 0}</strong>
                  </div>
                  <div>
                    <span>Racha actual</span>
                    <strong>{streak.current} dias</strong>
                  </div>
                </div>
              </article>

              <article className="panel-card">
                <div className="panel-card__header">
                  <div>
                    <p className="eyebrow">Manana</p>
                    <h3>Proxima sesion estimada</h3>
                  </div>
                </div>

                <div className="stats-rows">
                  <div>
                    <span>Fecha</span>
                    <strong>{formatDateLabel(tomorrowKey)}</strong>
                  </div>
                  <div>
                    <span>Total estimado</span>
                    <strong>{tomorrowMetrics.total} tarjetas</strong>
                  </div>
                  <div>
                    <span>Nuevas previstas</span>
                    <strong>{tomorrowMetrics.newCount}</strong>
                  </div>
                </div>
              </article>
            </section>

            <div className="hero-card__actions">
              <button className="button button--primary" onClick={() => setView("menu")} type="button">
                Volver al menu
              </button>
              {todaysSession && isSessionPending(todaysSession) && (
                <button className="button button--ghost" onClick={() => setView("session")} type="button">
                  Seguir practicando
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {showReminderModal && (
        <ReminderModal onClose={() => setShowReminderModal(false)} onConfirm={handleReminderConfirm} />
      )}
    </div>
  );
}
