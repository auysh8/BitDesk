import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      title="Create an Account"
      subtitle="Register to start submitting and managing support tickets"
    >

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50/90 p-4 text-sm text-red-700 shadow-2xs border-0">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Full Name
            </label>
            <div className="relative mt-1.5">
              <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Phone Number
            </label>
            <div className="relative mt-1.5">
              <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 w-full rounded-xl bg-slate-100/80 py-2.5 px-3.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 border-0 transition-colors"
            >
              <option value="customer">Customer (Raise & manage own tickets)</option>
              <option value="agent">Support Agent (Requires Admin approval)</option>
              <option value="admin">Administrator (Requires Admin approval)</option>
            </select>
            {role !== "customer" && (
              <p className="mt-2 text-xs text-amber-800 bg-amber-50/90 p-2.5 rounded-xl border-0 shadow-2xs">
                ⚠️ Staff accounts (Agent/Admin) require confirmation from an administrator before you can log in.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors border-0"
          >
            {isLoading ? "Creating account..." : "Register & Get OTP"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </div>
    </AuthLayout>
  );
};

export default Register;
