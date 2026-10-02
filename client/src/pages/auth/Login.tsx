// client/src/pages/auth/Login.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosClient from "../../api/axiosClient";
import { Mail, Lock, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

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
      setError(err.response?.data?.message || "Invalid credentials.");
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Welcome to BitDesk
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage and track your support tickets
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="mt-6 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setLoginMethod("password");
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 transition ${
              loginMethod === "password"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod("otp");
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 transition ${
              loginMethod === "otp"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            OTP Login
          </button>
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

        {/* Password Form */}
        {loginMethod === "password" && (
          <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
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
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={otpSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
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
                  className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-4 text-center font-mono text-lg tracking-widest text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
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

        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:underline"
          >
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
