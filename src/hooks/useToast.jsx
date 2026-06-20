import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const addToast = (message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((previous) => [...previous, { id, type, message }]);
    setTimeout(() => removeToast(id), 3200);
  };

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast
    }),
    [toasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
