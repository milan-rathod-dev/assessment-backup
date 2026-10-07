import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
};

function Toast({ toast, onClose }) {
  const Icon = ICONS[toast.type] || Info;
  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && <div className="toast-title">{toast.title}</div>}
        {toast.body  && <div className="toast-body">{toast.body}</div>}
      </div>
      <button
        className="toast-close"
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}
