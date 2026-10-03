import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import { Search, PlusCircle, ArrowUpDown } from "lucide-react";

export const TicketList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Preset Tabs
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "unassigned">("all");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isStaff = user?.role === "admin" || user?.role === "agent";

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
      if (search) params.append("search", search);
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

  const getStatusBadge = (st: string) => {
    const map: Record<string, string> = {
      open: "bg-blue-50 text-blue-700 border-blue-200",
      in_progress: "bg-amber-50 text-amber-700 border-amber-200",
      pending: "bg-orange-50 text-orange-700 border-orange-200",
      resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      closed: "bg-slate-100 text-slate-700 border-slate-200",
      reopened: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return (
      <span
        className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${map[st] || "bg-slate-100"}`}
      >
        {st.replace("_", " ")}
      </span>
    );
  };

  const getPriorityBadge = (p: string) => {
    const map: Record<string, string> = {
      low: "text-slate-600 bg-slate-100",
      medium: "text-blue-700 bg-blue-50",
      high: "text-orange-700 bg-orange-50",
      urgent: "text-red-700 bg-red-50",
    };
    return (
      <span
        className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${map[p] || ""}`}
      >
        {p}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Support Tickets
          </h1>
          <p className="text-sm text-slate-500">
            Track and respond to incoming customer inquiries.
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

      {/* Quick Preset Tabs (Staff & Admin) */}
      {isStaff && (
        <div className="flex border-b border-slate-200 text-sm font-medium">
          <button
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
            className={`border-b-2 px-4 py-2.5 transition-colors ${
              activeTab === "all"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            All Tickets
          </button>
          <button
            onClick={() => {
              setActiveTab("mine");
              setPage(1);
            }}
            className={`border-b-2 px-4 py-2.5 transition-colors ${
              activeTab === "mine"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => {
              setActiveTab("unassigned");
              setPage(1);
            }}
            className={`border-b-2 px-4 py-2.5 transition-colors ${
              activeTab === "unassigned"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Unassigned
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search number or subject..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="reopened">Reopened</option>
        </select>

        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4 text-slate-400" />
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Requester</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No tickets found matching current filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => navigate(`/tickets/${t._id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-blue-600">
                        {t.ticketNumber}
                      </div>
                      <div className="font-medium text-slate-900 line-clamp-1">
                        {t.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                    <td className="px-6 py-4">{getPriorityBadge(t.priority)}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {t.category?.name || "General"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {t.requesterId?.name || "Customer"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {t.requesterEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {t.assignedTo ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {t.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(t.lastMessageAt || t.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
