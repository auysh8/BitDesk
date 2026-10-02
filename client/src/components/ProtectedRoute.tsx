// client/src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: Array<"customer" | "agent" | "admin">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600">
            Loading BitDesk...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-red-600">Access Restricted</h2>
          <p className="mt-2 text-slate-600">
            Your role (<strong className="capitalize">{user.role}</strong>) does
            not have permission to view this section.
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
