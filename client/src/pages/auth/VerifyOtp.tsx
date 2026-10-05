// client/src/pages/auth/VerifyOtp.tsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";
import {
  KeyRound,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Loader2,
  Mail,
} from "lucide-react";

export const VerifyOtp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const initialEmail = location.state?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend OTP Cooldown
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const otpValue = otpDigits.join("");

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    // Single digit input
    const char = clean.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);

    // Auto-advance to next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        // Shift to previous input
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/auth/verify-otp", {
        email,
        otp: otpValue,
      });

      const data = res.data.data;

      // If user requires admin approval (Agent/Admin) and no access token was issued
      if (data?.user?.isApproved === false || !data?.accessToken) {
        toast.info("Account submitted for administrator approval");
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
      toast.success("Signed in successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid or expired OTP code.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setIsResending(true);
    setError(null);

    try {
      const res = await axiosClient.post("/auth/resend-otp", { email });
      toast.success(res.data.message || "A new 6-digit OTP code has been sent.");
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Failed to resend verification code.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100/75 px-4 py-12 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-900/5 space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Verify Your Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter the 6-digit security code sent to{" "}
            <strong className="text-slate-800">{email || "your email"}</strong>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 p-4 text-xs font-medium text-rose-700 ring-1 ring-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          {/* Email input if missing */}
          {!initialEmail && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* 6-Digit Auto-Advancing Input Array */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 text-center mb-3">
              Enter 6-Digit Code
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="h-13 w-11 sm:h-14 sm:w-12 rounded-2xl bg-slate-100/80 text-center font-mono text-xl sm:text-2xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 ring-1 ring-slate-200 shadow-2xs transition-all"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otpValue.length !== 6}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Complete Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Cooldown Section */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Didn't receive the verification code?
          </p>
          <button
            type="button"
            disabled={resendCooldown > 0 || isResending}
            onClick={handleResendOtp}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`}
            />
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend verification code"}
          </button>
        </div>

        <div className="text-center text-xs text-slate-400">
          <Link
            to="/login"
            className="font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Return to password sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
