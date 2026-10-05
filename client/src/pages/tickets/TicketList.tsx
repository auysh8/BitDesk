import React, { useEffect, useState, useTransition } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../../components/common/StatusBadge";
import { PriorityBadge } from "../../components/common/PriorityBadge";
import { SkeletonTableRow, Skeleton } from "../../components/common/Skeleton";
import {
  Search,
  PlusCircle,
  ArrowUpDown,
  X,
  RotateCcw,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const TicketList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL query parameters
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "unassigned">(
    () => {
      const tabParam = searchParams.get("tab");
      if (tabParam === "mine" || tabParam === "unassigned") return tabParam;
      return "all";
    },
  );

  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [status, setStatus] = useState(() => searchParams.get("status") || "");
  const [priority, setPriority] = useState(
    () => searchParams.get("priority") || "",
  );
  const [category, setCategory] = useState(
    () => searchParams.get("category") || "",
  );
  const [sortOption, setSortOption] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isStaff = user?.role === "admin" || user?.role === "agent";

  // Sync state changes back to URL search params
  const updateQueryParams = (newValues: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newValues).forEach(([k, v]) => {
      if (v) {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });
    startTransition(() => {
      setSearchParams(params, { replace: true });
    });
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/categories");
      setCategories(res.data.data || []);
    } catch (e) {
      console.error("Failed to load categories");
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);
      if (category) params.append("category", category);

      // Handle Quick Preset Tab
      if (isStaff) {
        if (activeTab === "mine" && user?._id) {
          params.append("assignedTo", user._id);
        } else if (activeTab === "unassigned") {
          params.append("assignedTo", "unassigned");
        }
      }

      // Handle Sorting
      if (sortOption === "newest") {
        params.append("sortBy", "createdAt");
        params.append("sortOrder", "desc");
      } else if (sortOption === "oldest") {
        params.append("sortBy", "createdAt");
        params.append("sortOrder", "asc");
      } else if (sortOption === "updated") {
        params.append("sortBy", "lastMessageAt");
        params.append("sortOrder", "desc");
      } else if (sortOption === "priority") {
        params.append("sortBy", "priority");
        params.append("sortOrder", "desc");
      }

      params.append("page", page.toString());
      params.append("limit", "10");

      const res = await axiosClient.get(`/tickets?${params.toString()}`);
      setTickets(res.data.data.tickets || []);
      setTotalPages(res.data.data.pagination?.pages || 1);
      setTotalCount(res.data.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [search, status, priority, category, activeTab, sortOption, page]);

  // Keep in sync if searchParams change externally (e.g. from Topbar search)
  useEffect(() => {
    const qSearch = searchParams.get("search") || "";
    const qStatus = searchParams.get("status") || "";
    const qPriority = searchParams.get("priority") || "";
    const qCategory = searchParams.get("category") || "";
    const qTab = searchParams.get("tab");

    if (qSearch !== search) setSearch(qSearch);
    if (qStatus !== status) setStatus(qStatus);
    if (qPriority !== priority) setPriority(qPriority);
    if (qCategory !== category) setCategory(qCategory);
    if (qTab === "mine" || qTab === "unassigned") {
      setActiveTab(qTab);
    } else if (qTab === "all") {
      setActiveTab("all");
    }
  }, [searchParams]);

  const resetAllFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategory("");
    setActiveTab("all");
    setPage(1);
    startTransition(() => {
      setSearchParams(new URLSearchParams(), { replace: true });
    });
  };

  const hasActiveFilters = Boolean(
    search || status || priority || category || activeTab !== "all",
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Support Tickets</span>
            {!loading && totalCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {totalCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Filter, triage, and resolve incoming customer requests.
          </p>
        </div>

        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Ticket</span>
        </Link>
      </div>

      {/* Staff Preset Segmented Tabs with Sliding Indicator */}
      {isStaff && (
        <div className="relative inline-flex rounded-2xl bg-slate-200/60 p-1 text-xs font-semibold">
          {[
            { id: "all", label: "All Tickets" },
            { id: "mine", label: "Assigned to Me" },
            { id: "unassigned", label: "Unassigned Queue" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setPage(1);
                  updateQueryParams({ tab: tab.id });
                }}
                className={`relative rounded-xl px-4 py-2 transition-colors duration-150 ${
                  active
                    ? "text-slate-900 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeTicketTab"
                    className="absolute inset-0 rounded-xl bg-white shadow-2xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search Input with Instant Clear */}
          <div className="relative lg:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticket # or subject..."
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                setPage(1);
                updateQueryParams({ search: val });
              }}
              className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                  updateQueryParams({ search: "" });
                }}
                aria-label="Clear search text"
                className="absolute right-3 top-2.5 rounded-lg p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => {
              const val = e.target.value;
              setStatus(val);
              setPage(1);
              updateQueryParams({ status: val });
            }}
            className="rounded-xl bg-slate-100/80 py-2.5 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="reopened">Reopened</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priority}
            onChange={(e) => {
              const val = e.target.value;
              setPriority(val);
              setPage(1);
              updateQueryParams({ priority: val });
            }}
            className="rounded-xl bg-slate-100/80 py-2.5 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => {
              const val = e.target.value;
              setCategory(val);
              setPage(1);
              updateQueryParams({ category: val });
            }}
            className="rounded-xl bg-slate-100/80 py-2.5 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
              <option value="priority">Highest Priority</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400">
              Filtered results active
            </span>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <RotateCcw className="h-3 w-3" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block overflow-hidden rounded-2xl bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Ticket</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Requester</th>
                <th className="px-6 py-3.5">Assigned To</th>
                <th className="px-6 py-3.5">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={7} />
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No tickets found
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {hasActiveFilters
                        ? "Try clearing filters to expand your search results."
                        : "No support tickets have been created yet."}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        onClick={resetAllFilters}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset Filters
                      </button>
                    ) : (
                      <Link
                        to="/tickets/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Create New Ticket
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <motion.tr
                    key={t._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as any }}
                    onClick={() => navigate(`/tickets/${t._id}`)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-blue-600 group-hover:underline">
                        {t.ticketNumber}
                      </div>
                      <div className="font-medium text-slate-900 line-clamp-1 max-w-md">
                        {t.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {t.category?.name || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 text-xs">
                        {t.requesterId?.name || "Customer"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {t.requesterEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {t.assignedTo ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {t.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(
                        t.lastMessageAt || t.updatedAt,
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Tiles View (< 768px) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-4/5" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No tickets found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters
                ? "Try clearing filters to expand your search."
                : "No support tickets created yet."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          tickets.map((t) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as any }}
              onClick={() => navigate(`/tickets/${t._id}`)}
              className="rounded-2xl bg-white p-4 shadow-2xs hover:shadow-md transition-shadow duration-150 cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-blue-600">
                  {t.ticketNumber}
                </span>
                <PriorityBadge priority={t.priority} />
              </div>

              <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">
                {t.subject}
              </h3>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <StatusBadge status={t.status} />
                <span className="text-slate-400">
                  {new Date(
                    t.lastMessageAt || t.updatedAt,
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-3.5 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;
