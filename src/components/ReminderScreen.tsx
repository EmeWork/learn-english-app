import { AnimatedShinyText } from "./ui/AnimatedShinyText";

interface ReminderScreenProps {
  reminderTime: string;
  reminderEnabled: boolean;
  reminderChannelLabel: string;
  showInlineReminder: boolean;
  onToggleReminder: () => void;
  onChangeTime: (value: string) => void;
}

export function ReminderScreen({
  reminderTime,
  reminderEnabled,
  reminderChannelLabel,
  showInlineReminder,
  onToggleReminder,
  onChangeTime
}: ReminderScreenProps) {
  return (
    <section className="stack-lg">
      <article className="reminder-altar has-effects">
        <div className="reminder-altar__copy">
          <p className="eyebrow font-choice-3">Campana ritual</p>
          <h2 className="font-choice-1">
            <AnimatedShinyText>Recordatorio diario</AnimatedShinyText>
          </h2>
          <p className="font-choice-2">
            Configura la alarma que despierta tu practica en web o Android.
          </p>
        </div>

        <div className="reminder-altar__controls">
          <button
            aria-label="Activar o desactivar recordatorio"
            className={`switch ${reminderEnabled ? "is-on" : ""}`}
            onClick={onToggleReminder}
            type="button"
          >
            <span className="switch__thumb" />
          </button>
          <strong className="font-choice-1">{reminderTime}</strong>
        </div>

        <label className="time-picker time-picker--altar">
          <span className="font-choice-2">Hora de invocacion</span>
          <input onChange={(event) => onChangeTime(event.target.value)} type="time" value={reminderTime} />
        </label>

        <div className="reminder-pill-row">
          <span className="badge badge--soft font-choice-3">{reminderChannelLabel}</span>
          <span className="badge badge--warm font-choice-3">
            {reminderEnabled ? "Activa" : "Inactiva"}
          </span>
        </div>

        {showInlineReminder && (
          <p className="status-note font-choice-2">
            La campana de hoy esta lista porque aun quedan cartas pendientes.
          </p>
        )}
      </article>
    </section>
  );
}
