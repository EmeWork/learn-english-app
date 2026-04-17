import { useState } from "react";

interface ProfileModalProps {
  currentName: string;
  profileTitle: string;
  onClose: () => void;
  onSave: (nextName: string) => void;
}

export function ProfileModal({
  currentName,
  profileTitle,
  onClose,
  onSave
}: ProfileModalProps) {
  const [draftName, setDraftName] = useState(currentName);

  return (
    <div className="modal-shell" role="presentation">
      <div aria-modal="true" className="modal-card" role="dialog">
        <p className="modal-card__eyebrow font-choice-3">Perfil</p>
        <h3 className="font-choice-1">Identity card</h3>
        <p className="font-choice-2">
          Tu titulo actual es {profileTitle}. Puedes cambiar el nombre que aparece en la ficha.
        </p>

        <label className="text-field profile-name-field">
          <span className="font-choice-2">Nombre visible</span>
          <input
            maxLength={40}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Escribe tu nombre"
            type="text"
            value={draftName}
          />
        </label>

        <div className="modal-card__actions">
          <button className="button button--ghost font-choice-2" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="button button--primary font-choice-2"
            onClick={() => onSave(draftName.trim() || currentName)}
            type="button"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
