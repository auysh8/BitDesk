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
  const [isSlow, setIsSlow] = React.useState(false);

  React.useEffect(() => {
    let t: any = null;
    if (isLoading) {
      t = setTimeout(() => setIsSlow(true), 1500);
    } else {
      setIsSlow(false);
    }
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-md"></div>
          <div>
            <p className="text-base font-semibold text-slate-800">
              Connecting to BitDesk...
            </p>
            {isSlow && (
              <p className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed animate-in fade-in duration-300">
                ⚡ <strong>Waking up Render Free-Tier backend.</strong> Inactive instances sleep after 15 minutes. Cold boot takes ~30–45s—please wait, loading will finish automatically!
              </p>
            )}
          </div>
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
