import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";
import {
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Loader2,
  Mail,
} from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

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
    <AuthLayout
      title="Verify code"
      subtitle={
        email
          ? `Enter the 6-digit verification code sent to ${email}`
          : "Enter your 6-digit authentication code"
      }
      footerLink={{
        prompt: "Remember your password?",
        text: "Sign in to workspace",
        to: "/login",
      }}
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200/50 bg-red-50/90 p-4 text-xs font-medium text-red-700 shadow-2xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        {/* Email input if missing */}
        {!initialEmail && (
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Email Address
            </label>
            <div className="relative flex items-center rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 px-3.5 py-3 transition-all focus-within:border-[#545AC8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/20">
              <Mail className="mr-2.5 h-4 w-4 text-slate-400" />
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
        )}

        {/* 6-Digit Auto-Advancing Input Array */}
        <div>
          <label className="mb-3 block text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Enter 6-digit code
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
                className="h-13 w-11 sm:h-14 sm:w-12 rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 text-center font-mono text-xl sm:text-2xl font-bold text-slate-900 shadow-2xs transition-all focus:border-[#545AC8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#545AC8]/30"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || otpValue.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Resend Cooldown Section */}
      <div className="pt-2 text-center">
        <button
          type="button"
          disabled={resendCooldown > 0 || isResending}
          onClick={handleResendOtp}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#545AC8] hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`}
          />
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : "Resend verification code"}
        </button>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
