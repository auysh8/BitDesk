import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  Mail,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await axiosClient.post("/auth/forgot-password", { email });
      // Redirect to Reset Password screen passing the email
      navigate("/reset-password", { state: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email to receive a password reset verification code."
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

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          <span>{isLoading ? "Sending code..." : "Send reset code"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
