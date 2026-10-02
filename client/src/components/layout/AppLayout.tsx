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
      ? [{ name: "Categories", path: "/categories", icon: Tags }]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            BitDesk
          </span>
        </div>

        <div className="p-4">
          <Link
            to="/tickets/new"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            New Ticket
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {links.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 px-2">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Signed in as
            </p>
            <p className="truncate text-sm font-medium text-slate-800">
              {user?.name}
            </p>
            <span className="inline-block mt-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-600">
              {user?.role}
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded p-2 text-slate-600 hover:bg-slate-100 md:hidden"
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
            <span className="text-xs font-semibold uppercase text-slate-500">
              Role: <strong className="text-blue-600">{user?.role}</strong>
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
