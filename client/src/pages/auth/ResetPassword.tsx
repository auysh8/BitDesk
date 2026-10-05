// client/src/pages/auth/ResetPassword.tsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../context/ToastContext";
import { Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

export const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await axiosClient.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });

      toast.success(
        "Password reset successfully! Please sign in with your new password.",
      );
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to reset password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your verification code and new password."
    >
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs border-0">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            6-Digit Code
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-4 text-center font-mono text-xl tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            New Password
          </label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 transition-colors border-0 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              Reset password
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
