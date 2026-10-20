
import { createContext, useMemo, useState } from "react";

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

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAuthenticated: Boolean(auth?.user && auth?.token),

      signIn: (nextUser) => {
        const { token, ...user } = nextUser;
        const nextAuth = { user, token };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
        setAuth(nextAuth);
      },

      signOut: () => {
        localStorage.removeItem(STORAGE_KEY);
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
