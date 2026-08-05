"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { AUTH_INVALIDATED_EVENT, clearToken, getStoredToken, storeToken } from "@/lib/auth";
import type { AuthUser } from "@/types/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const invalidate = () => setUser(null);
    window.addEventListener(AUTH_INVALIDATED_EVENT, invalidate);

    const restoreSession = async (): Promise<AuthUser | null> => {
      if (!getStoredToken()) return null;
      try {
        return await api.me();
      } catch {
        clearToken();
        return null;
      }
    };

    let active = true;
    void restoreSession().then((restoredUser) => {
      if (active) {
        setUser(restoredUser);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      window.removeEventListener(AUTH_INVALIDATED_EVENT, invalidate);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      const response = await api.login(email, password);
      storeToken(response.access_token);
      setUser(response.user);
    },
    signup: async (email, displayName, password) => {
      const response = await api.register(email, displayName, password);
      storeToken(response.access_token);
      setUser(response.user);
    },
    logout: () => {
      clearToken();
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
