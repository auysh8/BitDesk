// client/src/components/common/StatusBadge.tsx
import React from "react";
import {
  CircleDot,
  Clock,
  Hourglass,
  CheckCircle2,
  Archive,
  RotateCcw,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusConfigs: Record<string, StatusConfig> = {
  open: {
    label: "Open",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    icon: CircleDot,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    icon: Clock,
  },
  pending: {
    label: "Pending",
    className: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
    icon: Hourglass,
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-400/20",
    icon: Archive,
  },
  reopened: {
    label: "Reopened",
    className: "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20",
    icon: RotateCcw,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
  showIcon = true,
}) => {
  const normalizedKey = status?.toLowerCase().replace(/[\s-]/g, "_") || "open";
  const config = statusConfigs[normalizedKey] || {
    label: status ? status.replace(/_/g, " ") : "Unknown",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-400/20",
    icon: CircleDot,
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

export default StatusBadge;
