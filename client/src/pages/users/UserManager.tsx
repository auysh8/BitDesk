// client/src/pages/users/UserManager.tsx
import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircle,
  AlertTriangle,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

export const UserManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const fetchUsers = async () => {
    try {
      const [allRes, pendingRes] = await Promise.all([
        axiosClient.get(`/users?search=${search}&role=${filterRole}`),
        axiosClient.get(`/users?pendingApproval=true`),
      ]);
      setUsers(allRes.data.data.users || []);
      setPendingApprovals(pendingRes.data.data.users || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, filterRole]);

  const handleApprove = async (userId: string, name: string) => {
    try {
      await axiosClient.patch(`/users/${userId}/approve`);
      alert(`Approved ${name}! They can now log in.`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve user");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await axiosClient.patch(`/users/${userId}/role`, { role: newRole });
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await axiosClient.patch(`/users/${userId}/status`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update user status");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "agent":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          User & Staff Management
        </h1>
        <p className="text-sm text-slate-500">
          Review staff approval requests, modify user roles, and manage platform accounts.
        </p>
      </div>

      {/* Pending Approvals Section */}
      {pendingApprovals.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-amber-900">
              Pending Staff Approvals ({pendingApprovals.length})
            </h2>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            These accounts registered as Agent or Admin and are waiting for your approval before they can sign in.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingApprovals.map((u) => (
              <div
                key={u._id}
                className="flex flex-col justify-between rounded-xl border border-amber-200 bg-white p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{u.name}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${getRoleBadge(
                        u.role
                      )}`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{u.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{u.phone}</p>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleApprove(u._id, u.name)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve Staff
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Users Directory */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="agent">Support Agent</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No users found matching query.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = currentUser?._id === u._id;
                    const isDeactivated = u.isActive === false;

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 text-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          {isSelf ? (
                            <span
                              className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold uppercase ${getRoleBadge(
                                u.role
                              )}`}
                            >
                              {u.role} (You)
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="rounded border border-slate-300 bg-white py-1 px-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                            >
                              <option value="customer">Customer</option>
                              <option value="agent">Support Agent</option>
                              <option value="admin">Administrator</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {u.isApproved === false ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                              Pending Approval
                            </span>
                          ) : isDeactivated ? (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
                              Deactivated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 font-mono">
                          {u.phone || "—"}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.isApproved === false && (
                              <button
                                onClick={() => handleApprove(u._id, u.name)}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                <CheckCircle className="h-3 w-3" /> Approve
                              </button>
                            )}

                            {!isSelf && u.isApproved !== false && (
                              <button
                                onClick={() => handleToggleStatus(u._id)}
                                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold border transition ${
                                  isDeactivated
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                }`}
                              >
                                {isDeactivated ? (
                                  <>
                                    <UserCheck className="h-3 w-3" /> Activate
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3" /> Deactivate
                                  </>
                                )}
                              </button>
                            )}
                          </div>
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
    </div>
  );
};

export default UserManager;
