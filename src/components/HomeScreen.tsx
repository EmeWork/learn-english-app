import { AnimatedShinyText } from "./ui/AnimatedShinyText";

interface HomeScreenProps {
  profileTitle: string;
  displayName: string;
  masteryTitle: string;
  onOpenProfile: () => void;
  onOpenVocabulary: () => void;
}

export function HomeScreen({
  profileTitle,
  displayName,
  masteryTitle,
  onOpenProfile,
  onOpenVocabulary
}: HomeScreenProps) {
  return (
    <section className="stack-lg">
      <article className="welcome-panel has-effects">
        <div className="welcome-panel__topbar">
          <button
            aria-label="Editar perfil"
            className="icon-button"
            onClick={onOpenProfile}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.23 7.23 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.12.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.49 7.49 0 0 0-.05.94c0 .32.02.63.05.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.84a.5.5 0 0 0 .49-.42l.36-2.54c.58-.22 1.12-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <p className="welcome-panel__letter font-choice-3">To: {profileTitle} Lord {displayName}</p>
        <h2 className="font-choice-1">
          <AnimatedShinyText>Welcome, My Lord!</AnimatedShinyText>
        </h2>
        <p className="welcome-panel__description font-choice-2">
          Elige tu camino y regresa a las salas donde las palabras se convierten en maestria.
        </p>
      </article>

      <section className="menu-grid">
        <button
          className="menu-tile menu-tile--active has-effects"
          onClick={onOpenVocabulary}
          type="button"
        >
          <div className="menu-tile__topbar">
            <span className="menu-tile__icon">Aa</span>
            <span className="menu-tile__rank font-choice-3">{masteryTitle}</span>
          </div>
          <strong className="font-choice-1">
            <AnimatedShinyText>Vocabulary</AnimatedShinyText>
          </strong>
          <span className="font-choice-2">Aprender palabras nuevas, repasar y subir de rango.</span>
        </button>
      </section>
    </section>
  );
}
