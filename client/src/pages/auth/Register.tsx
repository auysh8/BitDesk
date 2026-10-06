import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  // Wizard Step: 1 = Email Verification, 2 = Profile & Password
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Email & OTP state
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);

  // Step 2: Profile details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("customer");

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown for OTP resend
  useEffect(() => {
    if (!otpSent || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, resendCooldown]);

  // Focus first OTP input when OTP screen appears
  useEffect(() => {
    if (otpSent && step === 1) {
      otpInputRefs.current[0]?.focus();
    }
  }, [otpSent, step]);

  const otpValue = otpDigits.join("");

  // Handle digit input in 6-box OTP
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    const char = clean.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
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
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Step 1a: Send OTP to email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await axiosClient.post("/auth/pre-register/send-otp", {
        email: cleanEmail,
      });

      setOtpSent(true);
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      toast.success("Verification code sent to your email!");
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.join(", ") ||
        err.response?.data?.message ||
        "Failed to send verification code.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1b: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);

    try {
      await axiosClient.post("/auth/pre-register/send-otp", {
        email: email.trim().toLowerCase(),
      });
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      toast.success("New verification code sent!");
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.join(", ") ||
        err.response?.data?.message ||
        "Failed to resend code.";
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Step 1c: Verify OTP and proceed to Step 2
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/auth/pre-register/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: otpValue,
      });

      const token = res.data.data.emailVerificationToken;
      setEmailVerificationToken(token);
      toast.success("Email verified successfully!");
      setStep(2);
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.join(", ") ||
        err.response?.data?.message ||
        "Invalid or expired verification code.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Complete profile & register user
  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
        emailVerificationToken,
      });

      const data = res.data.data;

      // Auto-approved user (e.g. customer) receives tokens directly
      if (data?.accessToken && data?.user) {
        login(data.accessToken, data.user);
        toast.success("Welcome to BitDesk!");
        navigate("/dashboard");
      } else {
        // Staff accounts needing approval
        toast.info("Account created and submitted for administrator approval.");
        navigate("/pending-approval", {
          state: {
            email: email.trim().toLowerCase(),
            role: data?.role || role,
          },
        });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.join(", ") ||
        err.response?.data?.message ||
        "Registration failed.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? "Verify Your Email" : "Create Account"}
      subtitle={
        step === 1
          ? "We'll send a 6-digit code to verify your email before setting up your account."
          : "Complete your profile details to finish account creation."
      }
      footerLink={{
        prompt: "Already have an account?",
        text: "Sign in to workspace",
        to: "/login",
      }}
    >
      {/* Visual Step Indicator */}
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#EDE7DC]/40 p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold transition-all ${
              step === 2
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-[#545AC8] text-white shadow-xs"
            }`}
          >
            {step === 2 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-800">
              {step === 2 ? "Email Verified" : "Verify Email"}
            </span>
            <span className="text-[9px] text-slate-500">
              {step === 2 ? email : "Receive 6-digit code"}
            </span>
          </div>
        </div>

        <div className="h-0.5 w-8 bg-slate-300" />

        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold transition-all ${
              step === 2
                ? "bg-[#545AC8] text-white shadow-xs"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            2
          </div>
          <div className="flex flex-col">
            <span
              className={`text-[11px] font-bold ${
                step === 2 ? "text-slate-800" : "text-slate-400"
              }`}
            >
              Account Details
            </span>
            <span className="text-[9px] text-slate-400">Name & Password</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: EMAIL VERIFICATION */}
      {step === 1 && (
        <div>
          {!otpSent ? (
            /* Sub-step 1a: Enter Email */
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                    autoFocus
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  A 6-digit confirmation code will be sent to this email.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Account Role
                </label>
                <div className="rounded-2xl bg-[#EDE7DC]/60 px-3 py-2.5 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/25">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="customer">Customer</option>
                    <option value="agent">Support Agent</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                {role !== "customer" && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Staff roles require administrator approval before login.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Sub-step 1b: Enter OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="rounded-2xl bg-[#EDE7DC]/50 p-3.5 text-xs text-slate-700 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Mail className="h-4 w-4 shrink-0 text-[#545AC8]" />
                  <span className="truncate font-medium">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setError(null);
                  }}
                  className="text-xs font-semibold text-[#545AC8] hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="h-12 w-11 sm:w-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-900 shadow-2xs transition-all focus:border-[#545AC8] focus:outline-none focus:ring-2 focus:ring-[#545AC8]/20"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-slate-500">
                    Resend code in{" "}
                    <span className="font-semibold text-slate-700">
                      {resendCooldown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#545AC8] hover:text-[#484EB8] transition-colors cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        isResending ? "animate-spin" : ""
                      }`}
                    />
                    <span>Resend verification code</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpValue.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* STEP 2: PROFILE & PASSWORD */}
      {step === 2 && (
        <form onSubmit={handleCompleteRegister} className="space-y-4">
          {/* Verified Email Banner */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-900">
                  {email}
                </span>
                <span className="text-[10px] text-emerald-700">
                  Email verified
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtpSent(false);
                setEmailVerificationToken(null);
              }}
              className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Full Name
            </label>
            <div className="relative flex items-center rounded-2xl bg-[#EDE7DC]/60 px-3.5 py-3 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/25">
              <User className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoFocus
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Phone Number
            </label>
            <div className="relative flex items-center rounded-2xl bg-[#EDE7DC]/60 px-3.5 py-3 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/25">
              <Phone className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Password
            </label>
            <div className="relative flex items-center rounded-2xl bg-[#EDE7DC]/60 px-3.5 py-3 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/25">
              <Lock className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Account Role
            </label>
            <div className="rounded-2xl bg-[#EDE7DC]/60 px-3 py-2.5 shadow-2xs transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#545AC8]/25">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="customer">Customer</option>
                <option value="agent">Support Agent</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            {role !== "customer" && (
              <p className="mt-1.5 text-xs text-slate-500">
                Staff roles require administrator approval before login.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-[0.99] cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default Register;
