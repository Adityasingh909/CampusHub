import { createContext, useMemo, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      signIn: (nextUser) => {
        setUser({
          id: nextUser.id,
          name: nextUser.name,
          email: nextUser.email,
          role: nextUser.role,
          subtitle: nextUser.subtitle,
        });
      },
      signOut: () => setUser(null),
    }),
    [user],
  );
 
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 
