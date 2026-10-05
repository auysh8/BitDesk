// client/src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { ToastContainer } from "../components/common/ToastContainer";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (item: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type,
      message,
      title,
      duration = 4000,
    }: Omit<ToastItem, "id">): string => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast],
  );

  const toast = {
    success: useCallback(
      (message: string, title?: string) =>
        addToast({ type: "success", message, title }),
      [addToast],
    ),
    error: useCallback(
      (message: string, title?: string) =>
        addToast({ type: "error", message, title }),
      [addToast],
    ),
    info: useCallback(
      (message: string, title?: string) =>
        addToast({ type: "info", message, title }),
      [addToast],
    ),
    warning: useCallback(
      (message: string, title?: string) =>
        addToast({ type: "warning", message, title }),
      [addToast],
    ),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
