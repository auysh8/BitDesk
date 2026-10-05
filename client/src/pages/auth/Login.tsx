import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Zap,
} from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    "password",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberWorkstation, setRememberWorkstation] = useState(true);

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
      setSuccessMsg("Verification code sent to your email.");
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

  const handleAutofillDemo = () => {
    setEmail("admin@bitdesk.dev");
    setPassword("Password123!");
    setLoginMethod("password");
    toast.info("Demo credentials loaded");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your support triage workspace."
      footerLink={{
        prompt: "Don't have a team account?",
        text: "Request early access",
        to: "/register",
      }}
    >
      {/* Login Method Toggle Pills */}
      <div className="mb-5 flex rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/70 p-1.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setLoginMethod("password");
            setError(null);
          }}
          className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2 transition-all ${
            loginMethod === "password"
              ? "bg-[#FAF7F2] text-slate-900 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Lock className="h-3.5 w-3.5 text-slate-600" />
          <span>Password</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLoginMethod("otp");
            setError(null);
          }}
          className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
            loginMethod === "otp"
              ? "bg-[#FAF7F2] text-slate-900 shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5 text-slate-500" />
          <span>One-Time Code</span>
          <span className="inline-flex items-center rounded-md bg-[#EDE4F9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6948B2]">
            New
          </span>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs border border-red-200/50">
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
        <div className="mb-4 rounded-2xl bg-emerald-50/90 p-3.5 text-sm text-emerald-700 shadow-2xs border border-emerald-200/50">
          {successMsg}
        </div>
      )}

      {/* Password Mode Form */}
      {loginMethod === "password" && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Email Address
            </label>
            <div className="relative flex items-center rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 px-3.5 py-3 transition-all focus-within:border-[#545AC8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/20">
              <Mail className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
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
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#545AC8] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 px-3.5 py-3 transition-all focus-within:border-[#545AC8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/20">
              <Lock className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 transition-colors hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="remember"
              checked={rememberWorkstation}
              onChange={(e) => setRememberWorkstation(e.target.checked)}
              className="h-4 w-4 rounded-md border-[#DDD6C8] accent-[#545AC8] cursor-pointer"
            />
            <label
              htmlFor="remember"
              className="select-none text-xs font-medium text-slate-600 cursor-pointer"
            >
              Remember this workstation for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            <span>{isLoading ? "Signing in..." : "Sign in to workspace"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* OTP Mode Form */}
      {loginMethod === "otp" && (
        <form
          onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Email Address
            </label>
            <div className="relative flex items-center rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 px-3.5 py-3 transition-all focus-within:border-[#545AC8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/20">
              <Mail className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="email"
                required
                disabled={otpSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {otpSent && (
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Enter 6-digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 px-4 py-3 text-center font-mono text-xl tracking-widest text-slate-900 transition-all focus:border-[#545AC8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#545AC8]/20"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            <span>
              {isLoading
                ? "Processing..."
                : otpSent
                  ? "Verify & Access Workspace"
                  : "Request One-Time Code"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Demo Credentials Auto-Fill Box */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/60 px-3.5 py-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-slate-200/80 bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            DEMO
          </span>
          <span className="font-mono text-slate-700">admin@bitdesk.dev</span>
        </div>
        <button
          type="button"
          onClick={handleAutofillDemo}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9CBE4] bg-[#E8DEEE]/60 px-2.5 py-1 text-xs font-semibold text-[#634C8E] transition-colors hover:bg-[#E8DEEE] cursor-pointer"
        >
          <Zap className="h-3 w-3" />
          <span>Auto-fill</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#DDD6C8]/80" />
        </div>
        <div className="relative bg-[#FAF7F2] px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Or authenticate with
        </div>
      </div>

      {/* SSO Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            toast.info(
              "Google Workspace SSO is configured for enterprise domains. Use email login for demo access.",
            )
          }
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-[#EDE7DC]/80 cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google Workspace</span>
        </button>

        <button
          type="button"
          onClick={() =>
            toast.info(
              "GitHub SSO is configured for enterprise domains. Use email login for demo access.",
            )
          }
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-[#EDE7DC]/80 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>GitHub SSO</span>
        </button>
      </div>
    </AuthLayout>
  );
};

export default Login;
