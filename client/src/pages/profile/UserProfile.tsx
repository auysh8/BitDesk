// client/src/pages/profile/UserProfile.tsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Lock,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";

export const UserProfile: React.FC = () => {
  const { user, login } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await axiosClient.patch("/auth/profile", { name, phone });
      const updatedUser = res.data.data;
      if (user) {
        login(localStorage.getItem("token") || "", { ...user, ...updatedUser });
      }
      setProfileSuccess("Profile information updated successfully.");
    } catch (err: any) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordLoading(false);
      return;
    }

    try {
      await axiosClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account Profile
        </h1>
        <p className="text-sm text-slate-500">
          Manage your personal details and account security settings.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-md shadow-blue-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold uppercase text-blue-700">
                  <Shield className="h-3 w-3" />
                  {user?.role}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 sm:text-right">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "2026"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Update Profile & Change Password */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Personal Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border-0">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Personal Information
            </h3>
          </div>

          {profileSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50/90 p-3 text-xs text-emerald-700 shadow-2xs border-0">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50/90 p-3 text-xs text-red-700 shadow-2xs border-0">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Email Address (Read-Only)
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-slate-100/60 py-2.5 px-3.5 text-slate-500 cursor-not-allowed border-0">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Phone Number
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-9 pr-3.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              {profileLoading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border-0">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">
              Security & Password
            </h3>
          </div>

          {passwordSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50/90 p-3 text-xs text-emerald-700 shadow-2xs border-0">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50/90 p-3 text-xs text-red-700 shadow-2xs border-0">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 shadow-sm disabled:opacity-50 transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
