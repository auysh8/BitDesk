// client/src/components/common/Skeleton.tsx
import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div
      className={`rounded-xl bg-slate-200/70 animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
};

// KPI Stat Card Skeleton
export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-2xs">
      <div className="space-y-2.5 flex-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-7 w-14" />
      </div>
      <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
    </div>
  );
};

// Table Row Skeleton
export const SkeletonTableRow: React.FC<{ columns?: number }> = ({
  columns = 7,
}) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-6 py-4">
          <Skeleton
            className={`h-4 ${
              idx === 0
                ? "w-28"
                : idx === 1 || idx === 2
                  ? "w-16"
                  : idx === 4
                    ? "w-32"
                    : "w-20"
            }`}
          />
        </td>
      ))}
    </tr>
  );
};

// Activity Timeline Item Skeleton
export const SkeletonActivityItem: React.FC = () => {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
};

// Message Bubble Skeleton
export const SkeletonMessageBubble: React.FC<{ isOwn?: boolean }> = ({
  isOwn = false,
}) => {
  return (
    <div
      className={`flex items-start gap-3 my-4 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
      <div
        className={`space-y-2 max-w-md w-full rounded-2xl p-4 bg-white shadow-2xs ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-14" />
        </div>
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </div>
  );
};

export default Skeleton;
