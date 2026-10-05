import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="flex min-h-screen min-h-dvh w-full bg-white text-slate-900">
      {/* Left Pane: Clean Form Canvas */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:w-1/2 lg:p-16 xl:w-5/12">
        {/* Brand Header */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5 group focus-visible:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              BitDesk
            </span>
          </Link>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as any }}
          className="mx-auto w-full max-w-sm py-6 sm:py-10"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </motion.div>

        {/* Minimal Bottom Spacer */}
        <div className="h-6" />
      </div>

      {/* Right Pane: Balanced Product Preview (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between overflow-hidden bg-slate-950 p-12 xl:p-16 text-white select-none">
        {/* Ambient Radial Mesh Glow */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />

        {/* Top: Live Workspace Tag */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10 backdrop-blur-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Workspace
          </div>
        </div>

        {/* Center: Sleek Interactive Ticket Preview & Metric Layer */}
        <div className="relative z-10 mx-auto w-full max-w-md my-auto py-8">
          {/* Main Ticket Card Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as any }}
            className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl space-y-4"
          >
            {/* Header: ID + Badges + Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-blue-400">
                  #TK-2048
                </span>
                <span className="inline-flex items-center rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300 ring-1 ring-rose-500/25">
                  High
                </span>
                <span className="inline-flex items-center rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/25">
                  Technical
                </span>
              </div>
              <span className="text-[11px] text-slate-400">2m ago</span>
            </div>

            {/* Subject */}
            <div>
              <h3 className="text-sm font-semibold text-white">
                Payment webhook failing on subscription renewals
              </h3>
              <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                Stripe webhook endpoint returning 504 on recurring billing events.
              </p>
            </div>

            {/* Assignee & Status Strip */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-xs">
                  AC
                </div>
                <div className="text-xs">
                  <div className="font-medium text-slate-200">Alex Chen</div>
                  <div className="text-[10px] text-slate-500">Assigned Agent</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                In Progress
              </div>
            </div>
          </motion.div>

          {/* Floating Metric Pill Layer */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] as any }}
            className="-mt-3 ml-auto w-4/5 rounded-xl border border-white/10 bg-slate-800/95 p-3 shadow-xl backdrop-blur-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <div className="text-slate-400 text-[10px]">Avg First Response</div>
                <div className="font-semibold text-white">4m 12s</div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-400 text-[10px]">SLA Target</div>
              <div className="font-semibold text-emerald-400">99.4% Met</div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Social Proof Bar */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-4">
          <span className="text-slate-300 font-medium">
            Designed for modern support teams
          </span>
          <div className="flex items-center gap-1 text-amber-400 text-xs">
            <span>★★★★★</span>
            <span className="text-slate-400 ml-1">4.9/5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
