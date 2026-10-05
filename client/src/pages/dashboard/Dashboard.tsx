// client/src/pages/dashboard/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getSocket } from "../../api/socket";
import {
  SkeletonCard,
  SkeletonActivityItem,
  Skeleton,
} from "../../components/common/Skeleton";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  UserCheck,
  UserX,
  Archive,
  Hourglass,
  RefreshCw,
  ArrowUpRight,
  MessageSquare,
  Activity,
  Layers,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [counts, setCounts] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "agent";

  const fetchSummary = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const res = await axiosClient.get("/dashboard/summary");
      setCounts(res.data.data.counts);
      setActivity(res.data.data.recentActivity || []);
      if (showToast) {
        toast.success("Dashboard metrics refreshed");
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      if (showToast) {
        toast.error("Failed to refresh metrics");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();

    const socket = getSocket();
    socket.emit("join:global");

    const onRefresh = () => {
      fetchSummary();
    };

    socket.on("dashboard:refresh", onRefresh);

    return () => {
      socket.off("dashboard:refresh", onRefresh);
    };
  }, []);

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getActivityConfig = (action: string) => {
    const act = (action || "").toLowerCase();
    if (act.includes("create")) {
      return {
        icon: PlusCircle,
        color: "text-emerald-600 bg-emerald-50",
      };
    }
    if (act.includes("message") || act.includes("repl")) {
      return {
        icon: MessageSquare,
        color: "text-blue-600 bg-blue-50",
      };
    }
    if (act.includes("assign")) {
      return {
        icon: UserCheck,
        color: "text-indigo-600 bg-indigo-50",
      };
    }
    if (act.includes("resolve") || act.includes("close")) {
      return {
        icon: CheckCircle2,
        color: "text-emerald-600 bg-emerald-50",
      };
    }
    return {
      icon: Activity,
      color: "text-slate-600 bg-slate-100",
    };
  };

  // Render Full Wireframe Skeleton during initial load
  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* 8 Stat Cards Skeletons */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Distribution Bar Skeleton */}
        <div className="rounded-2xl bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full rounded-full" />
        </div>

        {/* Activity Skeleton */}
        <div className="rounded-2xl bg-white p-6 shadow-2xs space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonActivityItem key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const total = counts?.total || 0;
  const openCount = counts?.open || 0;
  const inProgressCount = counts?.inProgress || 0;
  const pendingCount = counts?.pending || 0;
  const resolvedCount = counts?.resolved || 0;
  const closedCount = counts?.closed || 0;

  const statCards = [
    {
      label: "Total Tickets",
      val: total,
      icon: Inbox,
      color: "text-slate-900",
      bg: "bg-slate-100",
      path: "/tickets",
    },
    {
      label: "Open",
      val: openCount,
      icon: AlertCircle,
      color: "text-blue-600",
      bg: "bg-blue-50",
      path: "/tickets?status=open",
    },
    {
      label: "In Progress",
      val: inProgressCount,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      path: "/tickets?status=in_progress",
    },
    {
      label: "Pending",
      val: pendingCount,
      icon: Hourglass,
      color: "text-orange-600",
      bg: "bg-orange-50",
      path: "/tickets?status=pending",
    },
    {
      label: "Resolved",
      val: resolvedCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      path: "/tickets?status=resolved",
    },
    {
      label: "Closed",
      val: closedCount,
      icon: Archive,
      color: "text-slate-600",
      bg: "bg-slate-100",
      path: "/tickets?status=closed",
    },
    {
      label: "Reopened",
      val: counts?.reopened || 0,
      icon: RotateCcw,
      color: "text-purple-600",
      bg: "bg-purple-50",
      path: "/tickets?status=reopened",
    },
    ...(isStaff
      ? [
          {
            label: "Unassigned",
            val: counts?.unassigned || 0,
            icon: UserX,
            color: "text-rose-600",
            bg: "bg-rose-50",
            path: "/tickets?tab=unassigned",
          },
          {
            label: "Assigned To Me",
            val: counts?.assignedToMe || 0,
            icon: UserCheck,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            path: "/tickets?tab=mine",
          },
        ]
      : []),
  ];

  const getPercent = (count: number) => {
    if (!total) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Quick Action CTAs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Support Overview</span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
              Live
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time ticket volume, lifecycle distribution, and recent agent
            activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh Action */}
          <button
            onClick={() => fetchSummary(true)}
            disabled={isRefreshing}
            aria-label="Refresh metrics"
            title="Refresh metrics"
            className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Create Ticket Primary CTA */}
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Ticket</span>
          </Link>
        </div>
      </div>

      {/* Actionable KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => navigate(card.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(card.path);
                }
              }}
              title={`View ${card.label} tickets`}
              className="group relative flex flex-col justify-between rounded-2xl bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                  {card.label}
                </span>
                <div
                  className={`rounded-xl p-2.5 ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <p
                  className={`text-2xl font-bold tracking-tight ${card.color}`}
                >
                  {card.val}
                </p>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-slate-500 transition-all duration-150 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Status Breakdown Meter */}
      {total > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Ticket Lifecycle Distribution
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Total <strong>{total}</strong> Tickets
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
            <div
              style={{ width: `${getPercent(openCount)}%` }}
              className="bg-blue-500 rounded-l-full transition-all duration-500"
              title={`Open: ${openCount} (${getPercent(openCount)}%)`}
            />
            <div
              style={{ width: `${getPercent(inProgressCount)}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`In Progress: ${inProgressCount} (${getPercent(inProgressCount)}%)`}
            />
            <div
              style={{ width: `${getPercent(pendingCount)}%` }}
              className="bg-orange-500 transition-all duration-500"
              title={`Pending: ${pendingCount} (${getPercent(pendingCount)}%)`}
            />
            <div
              style={{ width: `${getPercent(resolvedCount)}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Resolved: ${resolvedCount} (${getPercent(resolvedCount)}%)`}
            />
            <div
              style={{ width: `${getPercent(closedCount)}%` }}
              className="bg-slate-400 rounded-r-full transition-all duration-500"
              title={`Closed: ${closedCount} (${getPercent(closedCount)}%)`}
            />
          </div>

          {/* Semantic Legend Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Open ({getPercent(openCount)}%)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>In Progress ({getPercent(inProgressCount)}%)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>Pending ({getPercent(pendingCount)}%)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Resolved ({getPercent(resolvedCount)}%)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>Closed ({getPercent(closedCount)}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity & Audit Trail Section */}
      <div className="rounded-2xl bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Recent Activity & Audit Trail
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Real-time feed
          </span>
        </div>

        <div className="divide-y divide-slate-100/80">
          {activity.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No recent activity logged
              </p>
              <p className="text-xs text-slate-400 mt-1">
                New tickets and agent responses will stream here in real time.
              </p>
            </div>
          ) : (
            activity.map((item, idx) => {
              const config = getActivityConfig(item.action);
              const ActionIcon = config.icon;
              const hasTicket = Boolean(item.ticketId?._id);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (hasTicket) {
                      navigate(`/tickets/${item.ticketId._id}`);
                    }
                  }}
                  className={`flex items-center justify-between py-3.5 px-2 rounded-xl transition-colors ${
                    hasTicket
                      ? "hover:bg-slate-50/90 cursor-pointer group"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.color}`}
                    >
                      <ActionIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.action}
                        </span>
                        {item.ticketId?.ticketNumber && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-600 group-hover:bg-blue-50 transition-colors">
                            {item.ticketId.ticketNumber}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400 mt-0.5">
                        By{" "}
                        <strong className="font-medium text-slate-600">
                          {item.actorEmail || "System"}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4 shrink-0 text-right">
                    <span
                      className="text-xs font-medium text-slate-400"
                      title={new Date(item.createdAt).toLocaleString()}
                    >
                      {formatRelativeTime(item.createdAt)}
                    </span>
                    {hasTicket && (
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all duration-150" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
