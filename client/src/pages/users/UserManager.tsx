import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { SkeletonTableRow } from "../../components/common/Skeleton";
import {
  CheckCircle2,
  AlertTriangle,
  Search,
  UserCheck,
  UserX,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "agent" | "customer";
  status: "active" | "suspended";
  isApproved?: boolean;
  createdAt: string;
}

export const UserManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "staff" | "customers"
  >("all");

  const fetchUsers = useCallback(async () => {
    try {
      let roleParam = filterRole;
      if (activeTab === "staff") {
        roleParam = "agent,admin";
      } else if (activeTab === "customers") {
        roleParam = "customer";
      }

      const [allRes, pendingRes] = await Promise.all([
        axiosClient.get(`/users?search=${encodeURIComponent(search)}&role=${roleParam}`),
        axiosClient.get(`/users?pendingApproval=true`),
      ]);

      setUsers(allRes.data.data.users || []);
      setPendingApprovals(pendingRes.data.data.users || []);
    } catch (err) {
      console.error("Failed to load users", err);
      toast.error("Failed to load users directory");
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, activeTab, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (userId: string, name: string) => {
    try {
      await axiosClient.patch(`/users/${userId}/approve`);
      toast.success(`Approved ${name}! They can now log in.`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve user");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await axiosClient.patch(`/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      await axiosClient.patch(`/users/${userId}/status`);
      toast.success(
        `Account ${currentStatus === "active" ? "suspended" : "activated"}`,
      );
      await fetchUsers();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to update user status",
      );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20";
      case "agent":
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-400/20";
    }
  };

  const displayedUsers =
    activeTab === "pending" ? pendingApprovals : users;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Bar */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <span>User & Staff Management</span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review staff approval requests, manage permissions, and inspect
          registered accounts.
        </p>
      </div>

      {/* Segmented Filter Tabs with Sliding Motion */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative inline-flex rounded-2xl bg-slate-200/60 p-1 text-xs font-semibold">
          {[
            { id: "all", label: "All Accounts" },
            {
              id: "pending",
              label: "Pending Staff",
              badge: pendingApprovals.length,
            },
            { id: "staff", label: "Staff & Agents" },
            { id: "customers", label: "Customers" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative rounded-xl px-4 py-2 transition-colors flex items-center gap-1.5 ${
                  active
                    ? "text-slate-900 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeUserTab"
                    className="absolute inset-0 rounded-xl bg-white shadow-2xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
                {Boolean(tab.badge) && (
                  <span className="relative z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending Approvals Spotlight Section (If any and not on pending tab) */}
      {activeTab !== "pending" && pendingApprovals.length > 0 && (
        <div className="rounded-3xl bg-amber-50/70 p-6 shadow-2xs ring-1 ring-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="text-sm font-bold text-amber-950">
                Staff Approvals Required ({pendingApprovals.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab("pending")}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              View all
            </button>
          </div>
          <p className="mt-1 text-xs text-amber-800">
            These users requested Staff or Admin access and cannot sign in
            until approved.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingApprovals.slice(0, 3).map((u) => (
              <div
                key={u._id}
                className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-2xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">
                      {u.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getRoleBadge(
                        u.role,
                      )}`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {u.email}
                  </p>
                </div>
                <button
                  onClick={() => handleApprove(u._id, u.name)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve Access</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-100/80 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 rounded-lg p-0.5 text-slate-400 hover:bg-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {activeTab === "all" && (
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl bg-slate-100/80 py-2 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="agent">Support Agent</option>
            <option value="admin">Administrator</option>
          </select>
        )}
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={5} />
                ))
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-700">
                      No accounts found
                    </p>
                  </td>
                </tr>
              ) : (
                displayedUsers.map((u) => {
                  const isCurrent = u._id === currentUser?._id;
                  const isPending = u.isApproved === false;

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Name & Email with Initial Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs ${
                              u.role === "admin"
                                ? "bg-purple-600"
                                : u.role === "agent"
                                  ? "bg-blue-600"
                                  : "bg-slate-600"
                            }`}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">
                              {u.name}{" "}
                              {isCurrent && (
                                <span className="text-[10px] font-bold text-blue-600">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Selector or Badge */}
                      <td className="px-6 py-4">
                        {isCurrent ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getRoleBadge(
                              u.role,
                            )}`}
                          >
                            {u.role}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u._id, e.target.value)
                            }
                            className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer border-0 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${getRoleBadge(
                              u.role,
                            )}`}
                          >
                            <option value="customer">Customer</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
                            Pending Approval
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              u.status === "active"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                            }`}
                          >
                            {u.status === "active" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> Active
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3" /> Suspended
                              </>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() => handleApprove(u._id, u.name)}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-2xs"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                        ) : !isCurrent ? (
                          <button
                            onClick={() => handleToggleStatus(u._id, u.status)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                              u.status === "active"
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {u.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
