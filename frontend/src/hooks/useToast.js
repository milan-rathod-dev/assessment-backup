import { useState, useCallback, useRef } from 'react';

let toastId = 0;

/**
 * Manages a list of toast notifications.
 * Returns { toasts, showToast, removeToast }
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, body, duration = 5000 }) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, title, body }]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return { toasts, showToast, removeToast };
}
