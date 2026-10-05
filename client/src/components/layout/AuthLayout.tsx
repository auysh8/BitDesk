// client/src/components/layout/AuthLayout.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footerLink?: {
    prompt: string;
    text: string;
    to: string;
  };
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  footerLink,
}) => {
  return (
    <div className="relative flex min-h-screen min-h-dvh w-full flex-col justify-between overflow-x-hidden bg-[#FAF7F2] text-slate-900 select-none">
      {/* Subtle Dot Matrix Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Ambient Warm Gradient Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-96 w-96 rounded-full bg-indigo-100/20 blur-3xl" />

      {/* Top Header Navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus-visible:outline-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#545AC8] text-white shadow-sm shadow-[#545AC8]/25 transition-transform duration-200 group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            BitDesk
          </span>
          <span className="inline-flex items-center rounded-full border border-[#DDD0F3] bg-[#EFE8F9] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#7154A4]">
            V2.4
          </span>
        </Link>

        <a
          href="https://github.com/auysh8/BitDesk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
        >
          <span>Docs</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
        </a>
      </header>

      {/* Center Form Studio */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
          className="w-full max-w-[460px]"
        >
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-xs font-normal leading-relaxed text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </motion.div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 border-t border-[#EDE7DC]/80 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:px-10">
        <div>
          {footerLink ? (
            <span>
              {footerLink.prompt}{" "}
              <Link
                to={footerLink.to}
                className="font-semibold text-[#545AC8] hover:underline"
              >
                {footerLink.text}
              </Link>
            </span>
          ) : (
            <span>
              Don't have a team account?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#545AC8] hover:underline"
              >
                Request early access
              </Link>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>SOC2 Type II</span>
          <span>•</span>
          <span>SAML 2.0</span>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
