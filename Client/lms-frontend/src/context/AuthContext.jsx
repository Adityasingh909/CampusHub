
import { createContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export const AuthContext = createContext(null);

const STORAGE_KEY = "campushub_auth";

function getSavedAuth() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getSavedAuth);

  useEffect(() => {
    let cancelled = false;

    async function syncProfile() {
      if (!auth?.token) return;

      try {
        const data = await api().get("/profile", { silent: true });
        if (cancelled || !data) return;

        setAuth((current) => {
          if (!current || !current.token) return current;

          const updatedUser = {
            ...current.user,
            id: data.id ?? current.user?.id,
            name: data.name ?? current.user?.name,
            email: data.email ?? current.user?.email,
            role: data.role ?? current.user?.role,
            avatar: data.profile?.avatar ?? current.user?.avatar ?? null,
            phone: data.profile?.phone ?? current.user?.phone ?? null,
            bio: data.profile?.bio ?? current.user?.bio ?? null,
          };

          const nextAuth = { ...current, user: updatedUser };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
          } catch {
            // ignore storage quota error
          }
          return nextAuth;
        });
      } catch {
        // profile sync failed gracefully without crashing
      }
    }

    syncProfile();

    return () => {
      cancelled = true;
    };
  }, [auth?.token]);

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAuthenticated: Boolean(auth?.user && auth?.token),

      signIn: (nextUser) => {
        const { token, ...user } = nextUser;
        const nextAuth = { user, token };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
        } catch {
          // ignore
        }
        setAuth(nextAuth);
      },

      updateUser: (partialUser) => {
        setAuth((current) => {
          if (!current) return current;
          const nextUser = { ...current.user, ...partialUser };
          const nextAuth = { ...current, user: nextUser };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
          } catch {
            // ignore
          }
          return nextAuth;
        });
      },

      signOut: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        setAuth(null);
      },
    }),
    [auth]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
