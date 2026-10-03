// client/src/components/layout/AppLayout.tsx
import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Tags,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      name: user?.role === "customer" ? "My Tickets" : "Tickets",
      path: "/tickets",
      icon: Ticket,
    },
    ...(user?.role === "admin"
      ? [
          { name: "Categories", path: "/categories", icon: Tags },
          { name: "Users & Staff", path: "/users", icon: ShieldCheck },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-slate-100/75 text-slate-900">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar for Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xs transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              BitDesk
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          <Link
            to="/tickets/new"
            onClick={() => setSidebarOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            New Ticket
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Refined User Profile Card */}
        <div className="p-3">
          <div className="flex items-center justify-between rounded-2xl bg-slate-100/70 p-2.5 shadow-2xs hover:bg-slate-100 transition">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition"
              title="View & Edit Account Profile"
            >
              {/* User Avatar with Role Colors */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs ${
                  user?.role === "admin"
                    ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
                    : user?.role === "agent"
                      ? "bg-gradient-to-tr from-blue-600 to-cyan-600"
                      : "bg-gradient-to-tr from-emerald-600 to-teal-600"
                }`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* Name & Role Badge */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name}
                </p>
                <div className="mt-0.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      user?.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : user?.role === "agent"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between bg-white/80 backdrop-blur-md shadow-2xs px-4 md:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <div className="text-sm font-medium text-slate-500">
            Support Ticketing & Email System
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Role: <strong className="text-blue-600 capitalize">{user?.role}</strong>
            </span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
