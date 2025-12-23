"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "@/lib/api/auth";

interface User {
  id: string;
  email: string;
  type: "guest" | "regular";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  guest: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.init();
    // Try to load user from session
    authApi
      .getSession()
      .then(({ user: sessionUser }) => {
        if (sessionUser) {
          setUser(sessionUser);
        }
      })
      .catch(() => {
        // Not authenticated, that's okay
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const { user: loggedInUser } = await authApi.login({ email, password });
    setUser(loggedInUser);
  };

  const register = async (email: string, password: string) => {
    const { user: registeredUser } = await authApi.register({ email, password });
    setUser(registeredUser);
  };

  const guest = async () => {
    const { user: guestUser } = await authApi.guest();
    setUser(guestUser);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, guest, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

