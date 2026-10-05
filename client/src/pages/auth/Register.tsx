import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await axiosClient.post("/auth/register", {
        name,
        email,
        phone,
        password,
        role,
      });

      // Redirect to OTP verification passing email in state
      navigate("/verify-otp", { state: { email } });
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
      title="Create account"
      subtitle="Register to access your support triage workspace."
      footerLink={{
        prompt: "Already have an account?",
        text: "Sign in to workspace",
        to: "/login",
      }}
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
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
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

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
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
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

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          <span>{isLoading ? "Creating account..." : "Create account"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
