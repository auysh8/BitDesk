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
        text: "Register",
        to: "/register",
      }}
    >
      {/* Login Method Toggle Pills */}
      <div className="mb-5 flex rounded-2xl bg-[#EDE7DC]/80 p-1.5 text-xs font-semibold shadow-2xs">
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
        <div className="mb-4 rounded-2xl bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs">
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
        <div className="mb-4 rounded-2xl bg-emerald-50/90 p-3.5 text-sm text-emerald-700 shadow-2xs">
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
            <div className="relative flex items-center rounded-2xl bg-[#EDE7DC]/60 px-3.5 py-3 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/25">
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
            <div className="relative flex items-center rounded-2xl bg-[#EDE7DC]/60 px-3.5 py-3 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/25">
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
              className="h-4 w-4 rounded-md accent-[#545AC8] cursor-pointer"
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
            <div className="relative flex items-center rounded-2xl bg-[#EDE7DC]/60 px-3.5 py-3 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/25">
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
                className="w-full rounded-2xl bg-[#EDE7DC]/60 px-4 py-3 text-center font-mono text-xl tracking-widest text-slate-900 shadow-2xs transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#545AC8]/25"
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
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#EDE7DC]/70 px-3.5 py-2.5 text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs">
            DEMO
          </span>
          <span className="font-mono text-slate-700">admin@bitdesk.dev</span>
        </div>
        <button
          type="button"
          onClick={handleAutofillDemo}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8DEEE]/80 px-2.5 py-1 text-xs font-semibold text-[#634C8E] shadow-2xs transition-colors hover:bg-[#E8DEEE] cursor-pointer"
        >
          <Zap className="h-3 w-3" />
          <span>Auto-fill</span>
        </button>
      </div>
    </AuthLayout>
  );
};

export default Login;
