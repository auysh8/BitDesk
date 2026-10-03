// client/src/pages/auth/PendingApproval.tsx
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Clock, ShieldCheck, ArrowRight, UserCheck, Mail } from "lucide-react";

export const PendingApproval: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string; role?: string; name?: string } | undefined;

  const email = state?.email || "";
  const role = state?.role || "staff";
  const name = state?.name || "";

  const roleLabel = role === "admin" ? "Administrator" : role === "agent" ? "Support Agent" : role;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200 shadow-sm">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Account Pending Approval
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your identity has been verified, but your role requires administrator authorization.
          </p>
        </div>

        {/* Verification Summary Card */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">Email Verification</span>
            </div>
            <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
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
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" /> {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Explanation Alert */}
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 space-y-2">
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
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Return to Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Mail className="h-3.5 w-3.5" />
            <span>Need urgent access? Contact your system administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
