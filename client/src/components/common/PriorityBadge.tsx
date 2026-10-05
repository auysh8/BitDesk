// client/src/components/common/PriorityBadge.tsx
import React from "react";
import { ArrowDown, Minus, ArrowUp, Flame } from "lucide-react";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
  showIcon?: boolean;
}

interface PriorityConfig {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}

const priorityConfigs: Record<string, PriorityConfig> = {
  low: {
    label: "Low",
    className: "bg-slate-100 text-slate-600 ring-1 ring-slate-300/40",
    icon: ArrowDown,
  },
  medium: {
    label: "Medium",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    icon: Minus,
  },
  high: {
    label: "High",
    className: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
    icon: ArrowUp,
  },
  urgent: {
    label: "Urgent",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 font-bold",
    icon: Flame,
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className = "",
  showIcon = true,
}) => {
  const normalizedKey = priority?.toLowerCase().trim() || "medium";
  const config = priorityConfigs[normalizedKey] || {
    label: priority || "Normal",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-300/40",
    icon: Minus,
  };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${config.className} ${className}`}
    >
      {showIcon && <IconComponent className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;
