
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

export function ProtectedRoute({ children, role }) {
  const { user, token, signOut } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      if (!user || !token) {
        setValid(false);
        setChecking(false);
        return;
      }

      try {
        const response = await api().get("/auth/me", { silent: true });

        if (!response?.success) {
          throw new Error("Session is invalid or expired.");
        }

        const backendRole = String(response.user?.role || "").trim().toLowerCase();
        const savedRole = String(user?.role || "").trim().toLowerCase();

        if (!cancelled) {
          if (!backendRole || backendRole !== savedRole) {
            signOut();
            setValid(false);
          } else {
            setValid(true);
          }
        }
      } catch {
        if (!cancelled) {
          signOut();
          setValid(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [user, token, signOut]);

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas text-sm text-muted">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-orange" />
        <span className="font-medium text-ink">Verifying session...</span>
      </div>
    );
  }

  if (!valid || !user || !token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const actualRole = String(user?.role || "").trim().toLowerCase();
  const requiredRole = String(role || "").trim().toLowerCase();

  if (requiredRole && actualRole !== requiredRole) {
    if (actualRole === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (actualRole === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }

    signOut();
    return <Navigate to="/login" replace />;
  }

  return children;
}
