interface ReminderModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function ReminderModal({ onClose, onConfirm }: ReminderModalProps) {
  return (
    <div className="modal-shell" role="presentation">
      <div aria-modal="true" className="modal-card" role="dialog">
        <p className="modal-card__eyebrow">Recordatorio diario</p>
        <h3>Activa notificaciones del navegador</h3>
        <p>
          En la web funcionan como recordatorio best-effort. La app seguira mostrando avisos
          internos aunque el navegador no permita notificaciones del sistema.
        </p>
        <div className="modal-card__actions">
          <button className="button button--ghost" onClick={onClose} type="button">
            Ahora no
          </button>
          <button className="button button--primary" onClick={onConfirm} type="button">
            Activar
          </button>
        </div>
      </div>
    </div>
  );
}
