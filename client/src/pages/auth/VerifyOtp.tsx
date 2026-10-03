// client/src/pages/auth/VerifyOtp.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import { KeyRound, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

export const VerifyOtp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const initialEmail = location.state?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend OTP Cooldown
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/auth/verify-otp", {
        email,
        otp,
      });

      const data = res.data.data;

      // If user requires admin approval (Agent/Admin) and no access token was issued
      if (data?.user?.isApproved === false || !data?.accessToken) {
        navigate("/pending-approval", {
          state: {
            email: data?.user?.email || email,
            role: data?.user?.role || "staff",
            name: data?.user?.name || "",
          },
        });
        return;
      }

      const { accessToken, user } = data;
      login(accessToken, user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setIsResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await axiosClient.post("/auth/resend-otp", { email });
      setSuccessMsg(res.data.message || "A new OTP code has been dispatched.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Verify Your Account
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the 6-digit verification code sent to your email
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
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
              className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-4 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              6-Digit OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="mt-1 w-full rounded-lg border border-slate-300 py-3 px-4 text-center font-mono text-2xl tracking-widest text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Didn't receive the code?</span>
            {resendCooldown > 0 ? (
              <span className="font-medium text-slate-400">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || !email}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
                Resend Code
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify & Activate"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Back to{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
