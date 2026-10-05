import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
      subtitle="Enter your verification code and set a new password."
      footerLink={{
        prompt: "Remember your password?",
        text: "Sign in to workspace",
        to: "/login",
      }}
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200/50 bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Email Address
          </label>
          <div className="relative flex items-center rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 px-3.5 py-3 transition-all focus-within:border-[#545AC8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/20">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
            6-Digit Code
          </label>
          <div className="relative flex items-center rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 px-3.5 py-3 transition-all focus-within:border-[#545AC8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/20">
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full bg-transparent text-center font-mono text-lg tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
            New Password
          </label>
          <div className="relative flex items-center rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 px-3.5 py-3 transition-all focus-within:border-[#545AC8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/20">
            <Lock className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Resetting...</span>
            </>
          ) : (
            <>
              <span>Reset password</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
