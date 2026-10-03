// client/src/pages/auth/ForgotPassword.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  AlertCircle,
} from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Forgot Password
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we'll send a 6-digit password reset OTP
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Sending OTP..." : "Send Reset Code"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
