import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import { AuthLayout } from "../../components/layout/AuthLayout";

export const PendingApproval: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string; role?: string; name?: string } | undefined;

  const email = state?.email || "";
  const role = state?.role || "staff";
  const name = state?.name || "";

  const roleLabel = role === "admin" ? "Administrator" : role === "agent" ? "Support Agent" : role;

  return (
    <AuthLayout
      title="Pending approval"
      subtitle="Your account is waiting for administrator confirmation."
      footerLink={{
        prompt: "Already approved by your administrator?",
        text: "Sign in to workspace",
        to: "/login",
      }}
    >
      {/* Verification Summary */}
      <div className="rounded-2xl border border-[#DDD6C8] bg-[#EDE7DC]/40 p-4">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">Email Verified</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Done
          </span>
        </div>

        <div className="mt-3 space-y-2 text-xs text-slate-600">
          {name && (
            <div className="flex justify-between">
              <span className="text-slate-400">Name</span>
              <span className="font-medium text-slate-800">{name}</span>
            </div>
          )}
          {email && (
            <div className="flex justify-between">
              <span className="text-slate-400">Email</span>
              <span className="font-mono text-slate-800">{email}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Requested role</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              <ShieldCheck className="h-3 w-3" /> {roleLabel}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
        Staff accounts require authorization from an administrator before sign in.
      </p>

      {/* Action Button */}
      <div className="pt-4">
        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#545AC8] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#545AC8]/25 transition-all hover:bg-[#484EB8] active:scale-[0.99] cursor-pointer"
        >
          <span>Return to sign in</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AuthLayout>
  );
};

export default PendingApproval;
