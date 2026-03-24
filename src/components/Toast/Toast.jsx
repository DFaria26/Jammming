import { useEffect, useState, useCallback } from "react";
import styles from "./Toast.module.css";

const ICONS = {
  success: "\u2713",
  error: "\u2715",
  info: "\u2139",
};

export default function Toast({ message, type = "info", onClose, visible, action }) {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300); // matches slideOut duration
  }, [onClose]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!visible) return;
    setExiting(false);
    const timer = setTimeout(handleClose, 4000);
    return () => clearTimeout(timer);
  }, [visible, handleClose]);

  if (!visible && !exiting) return null;

  const toastClass = [
    styles.toast,
    styles[type],
    exiting ? styles.exiting : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={toastClass} role="alert">
      <span className={styles.icon}>{ICONS[type]}</span>
      <span className={styles.message}>{message}</span>
      {action && (
        <button className={styles.actionButton} onClick={action.onClick}>
          {action.label}
        </button>
      )}
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
}
