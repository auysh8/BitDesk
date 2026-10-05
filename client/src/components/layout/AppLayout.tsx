import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getSocket } from "../../api/socket";
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
  const { toast } = useToast();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Subscribe to WebSocket connection status
  useEffect(() => {
    const socket = getSocket();
    setIsSocketConnected(socket.connected);

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.info("You have signed out of BitDesk.");
  };

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
    <div className="flex h-screen overflow-hidden bg-slate-100/75 text-slate-900">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col bg-white shadow-xs transition-transform duration-200 ease-in-out md:static md:translate-x-0 overflow-hidden select-none ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Branding Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-100/80">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group focus-visible:outline-none"
          >
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

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary CTA */}
        <div className="px-4 py-3 shrink-0">
          <Link
            to="/tickets/new"
            onClick={() => setSidebarOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-600/50"
          >
            <PlusCircle className="h-4 w-4" />
            New Ticket
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 px-4 overflow-hidden py-1">
          {links.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.path ||
              (item.path !== "/dashboard" &&
                location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-blue-50/90 text-blue-700 font-semibold shadow-2xs ring-1 ring-blue-600/10"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    active ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer Card */}
        <div className="p-3 shrink-0 border-t border-slate-100/80">
          <div className="flex items-center justify-between rounded-2xl bg-slate-100/70 p-2.5 shadow-2xs hover:bg-slate-100 transition-colors">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
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
                    className={`inline-block rounded-full px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                      user?.role === "admin"
                        ? "bg-purple-100/80 text-purple-700"
                        : user?.role === "agent"
                          ? "bg-blue-100/80 text-blue-700"
                          : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 bg-white/85 backdrop-blur-md shadow-2xs px-4 md:px-8 z-10 border-b border-slate-100/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation drawer"
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Right Header Status Group */}
          <div className="flex items-center gap-3">
            {/* Live Real-time Socket Indicator */}
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isSocketConnected
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
              }`}
              title={
                isSocketConnected
                  ? "WebSocket connected: Real-time ticket synchronization active"
                  : "Connecting to WebSocket server..."
              }
            >
              {isSocketConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide hidden sm:inline">
                    Live Sync
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-[11px] font-semibold tracking-wide hidden sm:inline">
                    Connecting...
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content with Smooth Motion Page Transition */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
