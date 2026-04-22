import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { dashboardPaths } from "@/lib/auth";
import { isSessionActive } from "@/lib/session";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isLoggedIn, role, token, user } = useAuth();
  const location = useLocation();

  // Force re-check authentication state on every render
  const checkAuth = () => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("role") as UserRole | null;
    
    if (!savedToken || !savedUser || !savedRole) {
      return false;
    }
    
    try {
      JSON.parse(savedUser);
      return true;
    } catch {
      return false;
    }
  };

  const isAuthenticated = isLoggedIn && isSessionActive() && token && user && checkAuth();

  if (!isAuthenticated) {
    if (sessionStorage.getItem("forceLoginNoRedirect") === "1") {
      sessionStorage.removeItem("forceLoginNoRedirect");
      localStorage.removeItem("authReturnTo");
      return <Navigate to="/login" replace />;
    }
    const returnTo = location.pathname + location.search;
    localStorage.setItem("authReturnTo", returnTo);
    console.log('🔒 Protected route access denied, redirecting to login:', location.pathname);
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!allowedRoles.includes(role)) {
    console.log('⚠️ Wrong role, redirecting to dashboard:', role);
    return <Navigate to={dashboardPaths[role]} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
