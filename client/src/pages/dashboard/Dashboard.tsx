// client/src/pages/dashboard/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../api/socket";
import {
  Inbox,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  UserCheck,
  UserX,
  Archive,
  Hourglass,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff = user?.role === "admin" || user?.role === "agent";

  const fetchSummary = async () => {
    try {
      const res = await axiosClient.get("/dashboard/summary");
      setCounts(res.data.data.counts);
      setActivity(res.data.data.recentActivity || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading dashboard metrics...
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
    },
    {
      label: "Open",
      val: openCount,
      icon: AlertCircle,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "In Progress",
      val: inProgressCount,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Pending",
      val: pendingCount,
      icon: Hourglass,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Resolved",
      val: resolvedCount,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Closed",
      val: closedCount,
      icon: Archive,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Reopened",
      val: counts?.reopened || 0,
      icon: RotateCcw,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    ...(isStaff
      ? [
          {
            label: "Unassigned",
            val: counts?.unassigned || 0,
            icon: UserX,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
          {
            label: "Assigned To Me",
            val: counts?.assignedToMe || 0,
            icon: UserCheck,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ]
      : []),
  ];

  const getPercent = (count: number) => {
    if (!total) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Overview of support requests, real-time metrics, and recent activity.
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition"
        >
          <PlusCircle className="h-4 w-4" />
          Create Ticket
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.label}
                </span>
                <div className={`rounded-xl p-2.5 ${card.bg} ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={`mt-3 text-2xl font-bold tracking-tight ${card.color}`}>
                {card.val}
              </p>
            </div>
          );
        })}
      </div>

      {/* Visual Status Breakdown Meter */}
      {total > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Ticket Lifecycle Distribution
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              Total {total} Tickets
            </span>
          </div>

          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${getPercent(openCount)}%` }}
              className="bg-blue-500 transition-all"
              title={`Open: ${openCount} (${getPercent(openCount)}%)`}
            />
            <div
              style={{ width: `${getPercent(inProgressCount)}%` }}
              className="bg-amber-500 transition-all"
              title={`In Progress: ${inProgressCount} (${getPercent(inProgressCount)}%)`}
            />
            <div
              style={{ width: `${getPercent(pendingCount)}%` }}
              className="bg-orange-500 transition-all"
              title={`Pending: ${pendingCount} (${getPercent(pendingCount)}%)`}
            />
            <div
              style={{ width: `${getPercent(resolvedCount)}%` }}
              className="bg-emerald-500 transition-all"
              title={`Resolved: ${resolvedCount} (${getPercent(resolvedCount)}%)`}
            />
            <div
              style={{ width: `${getPercent(closedCount)}%` }}
              className="bg-slate-400 transition-all"
              title={`Closed: ${closedCount} (${getPercent(closedCount)}%)`}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600">Open ({getPercent(openCount)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">In Progress ({getPercent(inProgressCount)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-slate-600">Pending ({getPercent(pendingCount)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Resolved ({getPercent(resolvedCount)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600">Closed ({getPercent(closedCount)}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Recent Activity & Audit Trail
        </h2>
        <div className="mt-3 space-y-1">
          {activity.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">
              No activity logged yet.
            </p>
          ) : (
            activity.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-800">
                    {item.action}
                  </span>
                  {item.ticketId && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-600">
                      {item.ticketId.ticketNumber}
                    </span>
                  )}
                  <p className="text-xs text-slate-500">
                    By {item.actorEmail || "System"}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
