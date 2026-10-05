// client/src/components/common/ToastContainer.tsx
import React from "react";
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
    borderAccent: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    borderAccent: "border-l-4 border-l-emerald-500",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    borderAccent: "border-l-4 border-l-rose-500",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    borderAccent: "border-l-4 border-l-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    borderAccent: "border-l-4 border-l-amber-500",
  },
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const config = toastConfig[t.type] || toastConfig.info;
        const IconComponent = config.icon;

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-xl shadow-slate-900/10 transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${config.borderAccent}`}
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
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
