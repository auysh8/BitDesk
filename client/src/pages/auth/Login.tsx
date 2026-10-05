import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    "password",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/auth/login-password", {
        email,
        password,
      });
      const { accessToken, user } = res.data.data;
      login(accessToken, user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.errors?.join(", ") ||
          err.response?.data?.message ||
          "Invalid credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Request login OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await axiosClient.post("/auth/login-otp", { email });
      setOtpSent(true);
      setSuccessMsg(
        "6-digit login OTP has been generated. Check server logs/inbox.",
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify login OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/auth/verify-login-otp", {
        email,
        otp,
      });
      const { accessToken, user } = res.data.data;
      login(accessToken, user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Enter your details to continue."
    >
      {/* Login Method Toggle */}
      <div className="relative flex rounded-2xl bg-slate-100/90 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => {
            setLoginMethod("password");
            setError(null);
          }}
          className={`relative flex-1 rounded-xl py-1.5 transition-colors ${
            loginMethod === "password"
              ? "text-blue-700 font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {loginMethod === "password" && (
            <motion.div
              layoutId="loginMethodPill"
              className="absolute inset-0 rounded-xl bg-white shadow-2xs"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">Password</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMethod("otp");
            setError(null);
          }}
          className={`relative flex-1 rounded-xl py-1.5 transition-colors ${
            loginMethod === "otp"
              ? "text-blue-700 font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {loginMethod === "otp" && (
            <motion.div
              layoutId="loginMethodPill"
              className="absolute inset-0 rounded-xl bg-white shadow-2xs"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">OTP</span>
        </button>
      </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs border-0">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span>{error}</span>
                {error.toLowerCase().includes("pending administrator approval") && (
                  <div className="mt-2">
                    <Link
                      to="/pending-approval"
                      state={{ email }}
                      className="font-semibold text-blue-700 underline hover:text-blue-800"
                    >
                      View Approval Status &amp; Details &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-2xl bg-emerald-50/90 p-3.5 text-sm text-emerald-700 shadow-2xs border-0">
            {successMsg}
          </div>
        )}

        {/* Password Form */}
        {loginMethod === "password" && (
          <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* OTP Form */}
        {loginMethod === "otp" && (
          <form
            onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={otpSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 disabled:opacity-60 transition-colors"
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-4 text-center font-mono text-lg tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading
                ? "Processing..."
                : otpSent
                  ? "Verify OTP & Sign In"
                  : "Request Login OTP"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Quick Demo Access */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>Demo: <span className="font-mono text-slate-700">admin@bitdesk.dev</span></span>
          <button
            type="button"
            onClick={() => {
              setEmail("admin@bitdesk.dev");
              setPassword("Password123!");
              setLoginMethod("password");
            }}
            className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Auto-fill
          </button>
        </div>

        <div className="mt-5 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign up
          </Link>
        </div>
    </AuthLayout>
  );
};

export default Login;
