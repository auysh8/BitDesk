import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
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
      subtitle="Enter your email to receive a reset code."
    >
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs border-0">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 transition-colors border-0 cursor-pointer"
        >
          {isLoading ? "Sending..." : "Send code"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
