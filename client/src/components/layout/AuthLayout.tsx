// client/src/components/layout/AuthLayout.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
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
        </Link>

        <a
          href="https://github.com/auysh8/BitDesk"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Repository"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDE7DC]/70 text-slate-700 shadow-2xs transition-all hover:bg-[#EDE7DC] hover:text-slate-900"
        >
          <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        </a>
      </header>

      {/* Center Form Studio */}
      <main className="relative z-10 flex flex-1 items-start justify-center px-4 pt-8 pb-12 sm:pt-12 md:pt-16">
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
      <footer className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-center px-6 py-6 text-xs text-slate-500 sm:px-10">
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
                Register
              </Link>
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
