import { useEffect } from "react";

export default function Modal({ title, children, onClose, center = false, actions }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal${center ? " modal-center" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function AlertModal({ title, text, buttonLabel, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      center
      actions={
        <button className="btn btn-primary" onClick={onClose} autoFocus>
          {buttonLabel}
        </button>
      }
    >
      <p>{text}</p>
    </Modal>
  );
}
