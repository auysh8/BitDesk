// client/src/pages/profile/UserProfile.tsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";

export const UserProfile: React.FC = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);

    try {
      const res = await axiosClient.patch("/auth/profile", { name, phone });
      const updatedUser = res.data.data;
      if (user) {
        login(localStorage.getItem("token") || "", { ...user, ...updatedUser });
      }
      toast.success("Profile information updated successfully.");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile.";
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      const msg = "New passwords do not match.";
      setPasswordError(msg);
      toast.error(msg);
      setPasswordLoading(false);
      return;
    }

    try {
      await axiosClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Security password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password.";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <User className="h-6 w-6 text-blue-600" />
          <span>Account Profile & Security</span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your personal details, credentials, and authentication preferences.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Dynamic Role Gradient Avatar */}
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md shadow-slate-900/10 ${
                user?.role === "admin"
                  ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/25"
                  : user?.role === "agent"
                    ? "bg-gradient-to-tr from-blue-600 to-cyan-600 shadow-blue-500/25"
                    : "bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/25"
              }`}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    user?.role === "admin"
                      ? "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
                      : user?.role === "agent"
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                        : "bg-slate-100 text-slate-700 ring-1 ring-slate-400/20"
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {user?.role}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5 sm:text-right">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Member since{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })
                : "2026"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Update Profile & Change Password */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Personal Details Form */}
        <div className="rounded-2xl bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Personal Information
            </h3>
          </div>

          {profileError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600">
                Email Address (Read-Only)
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-slate-100/60 py-2.5 px-3.5 text-slate-500 cursor-not-allowed">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600">
                Phone Number
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-9 pr-3.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              {profileLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="rounded-2xl bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Security & Password
            </h3>
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 shadow-sm shadow-purple-600/20 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
