// client/src/components/layout/AuthLayout.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Zap, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="flex min-h-screen min-h-dvh w-full bg-white text-slate-900">
      {/* Left Pane: Full-Screen Form Studio */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:w-1/2 lg:p-16 xl:w-5/12">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group focus-visible:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                BitDesk
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Support Cloud
              </span>
            </div>
          </Link>
        </div>

        {/* Center Form Container (Seamless canvas, no floating box borders) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
          className="mx-auto w-full max-w-sm py-8 sm:py-12"
        >
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {children}
        </motion.div>

        {/* Footer Security Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100/80 pt-6 text-[11px] text-slate-400">
          <span>© 2026 BitDesk Inc. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
            <Lock className="h-3 w-3 text-emerald-600" /> End-to-end 256-bit TLS encryption
          </span>
        </div>
      </div>

      {/* Right Pane: Immersive Brand & Support Cloud Showcase (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-12 xl:p-16 text-white select-none">
        {/* Ambient Radial Mesh Glow */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

        {/* Top Enterprise Tag */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300 ring-1 ring-blue-400/25">
            Enterprise Support Infrastructure
          </span>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            High-velocity customer support without the chaos.
          </h2>
          <p className="text-sm xl:text-base text-slate-300 leading-relaxed">
            Manage multi-tier inquiries, eliminate agent collisions, and automate resolution workflows across your entire organization.
          </p>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="flex items-start gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-xs ring-1 ring-white/10">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Real-Time WebSocket Sync</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Instant ticket updates, message feeds, and zero-lag live agent collaboration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl bg-white/5 p-4 backdrop-blur-xs ring-1 ring-white/10">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Omnichannel Email Ingestion</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Seamless bridging between inbound customer emails and staff resolution queues.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Pill */}
        <div className="relative z-10 flex items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            99.98% Service Uptime
          </span>
          <span>•</span>
          <span>SOC2 & ISO/IEC 27001 Aligned</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
