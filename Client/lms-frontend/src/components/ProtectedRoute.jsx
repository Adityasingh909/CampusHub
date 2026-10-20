
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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
        const response = await fetch(
          "http://localhost:2000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Session is invalid or expired.");
        }

        const data = await response.json();
        const backendRole = String(data.user?.role || "").toLowerCase();
        const savedRole = String(user.role || "").toLowerCase();

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

    setChecking(true);
    validateSession();

    return () => {
      cancelled = true;
    };
  }, [user, token, signOut]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Checking your session...
      </div>
    );
  }

  if (!valid) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const actualRole = String(user?.role || "").toLowerCase();

  if (role && actualRole !== role.toLowerCase()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
