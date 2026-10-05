import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import type { ToastItem, ToastType } from "../../context/ToastContext";

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toastConfig: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const config = toastConfig[t.type] || toastConfig.info;
          const IconComponent = config.icon;

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: 28,
                scale: 0.92,
                transition: { duration: 0.16, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-xl shadow-slate-900/10"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${config.iconBg} ${config.iconColor}`}
              >
                <IconComponent className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                {t.title && (
                  <p className="text-xs font-semibold text-slate-900 leading-tight">
                    {t.title}
                  </p>
                )}
                <p className="text-xs font-medium text-slate-600 leading-relaxed break-words">
                  {t.message}
                </p>
              </div>

              <button
                onClick={() => onDismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
