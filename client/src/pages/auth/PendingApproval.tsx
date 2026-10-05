import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, UserCheck, Mail } from "lucide-react";
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
      title="Account Pending Approval"
      subtitle="Your identity has been verified, but your role requires administrator authorization."
    >
      {/* Verification Summary Card */}
      <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">Email Verification</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Completed
          </span>
        </div>

        <div className="mt-3 space-y-2 text-xs text-slate-600">
          {name && (
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="font-medium text-slate-800">{name}</span>
            </div>
          )}
          {email && (
            <div className="flex justify-between">
              <span className="text-slate-400">Account Email:</span>
              <span className="font-mono text-slate-800">{email}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Requested Role:</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800 uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" /> {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Explanation Alert */}
      <div className="rounded-2xl bg-amber-50/90 p-4 text-xs text-amber-900 space-y-2 border border-amber-200/50 shadow-2xs">
        <p className="font-semibold text-amber-950 flex items-center gap-1.5">
          <span>🛡️</span> Why do I have to wait?
        </p>
        <p className="leading-relaxed text-amber-800">
          To safeguard ticket integrity and customer information, BitDesk restricts elevated permissions. An existing administrator has received your request and must approve your role before you can sign in.
        </p>
        <p className="leading-relaxed text-amber-800">
          Once approved by an admin in the <strong>User Management</strong> console, you will be able to immediately log into your dashboard.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700 transition-colors border-0 cursor-pointer"
        >
          Return to Sign In
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
          <Mail className="h-3.5 w-3.5" />
          <span>Need urgent access? Contact your system administrator</span>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PendingApproval;
