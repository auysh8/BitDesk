// client/src/components/layout/AuthLayout.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
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

      {/* Right Pane: Minimal Ambient Visual (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 items-center justify-center overflow-hidden bg-slate-950 p-12 text-white select-none">
        {/* Ambient Radial Mesh Glow */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />

        {/* Minimal Central Brand Emblem */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-2xl backdrop-blur-xs">
            <ShieldCheck className="h-7 w-7 text-blue-400" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-200">
            BitDesk
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
