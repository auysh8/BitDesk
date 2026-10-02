// client/src/pages/dashboard/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  Inbox,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const [counts, setCounts] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading dashboard metrics...
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Tickets",
      val: counts?.total || 0,
      icon: Inbox,
      color: "text-slate-900",
      bg: "bg-slate-100",
    },
    {
      label: "Open",
      val: counts?.open || 0,
      icon: AlertCircle,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "In Progress",
      val: counts?.inProgress || 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Resolved",
      val: counts?.resolved || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Reopened",
      val: counts?.reopened || 0,
      icon: RotateCcw,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Overview of support requests and recent activity.
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          Create Ticket
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {card.label}
                </span>
                <div className={`rounded-lg p-2 ${card.bg} ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className={`mt-3 text-2xl font-bold ${card.color}`}>
                {card.val}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900">
          Recent Activity
        </h2>
        <div className="mt-4 divide-y divide-slate-100">
          {activity.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">
              No activity logged yet.
            </p>
          ) : (
            activity.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-800">
                    {item.action}
                  </span>
                  {item.ticketId && (
                    <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
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
