interface ReminderModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function ReminderModal({ onClose, onConfirm }: ReminderModalProps) {
  return (
    <div className="modal-shell" role="presentation">
      <div aria-modal="true" className="modal-card" role="dialog">
        <p className="modal-card__eyebrow font-choice-3">Recordatorio diario</p>
        <h3 className="font-choice-1">Activa notificaciones del navegador</h3>
        <p className="font-choice-2">
          En la web funcionan como recordatorio best-effort. La app seguira mostrando avisos
          internos aunque el navegador no permita notificaciones del sistema.
        </p>
        <div className="modal-card__actions">
          <button className="button button--ghost font-choice-2" onClick={onClose} type="button">
            Ahora no
          </button>
          <button className="button button--primary font-choice-2" onClick={onConfirm} type="button">
            Activar
          </button>
        </div>
      </div>
    </div>
  );
}
