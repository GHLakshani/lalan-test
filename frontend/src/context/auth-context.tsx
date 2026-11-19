"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { SESSION_EXPIRED, errorMessage } from "@/lib/errors";
import type { User } from "@/lib/types";

const TOKEN_KEY = "auth_token";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  expire: (notice?: string | null) => void;
  clearNotice: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const expire = useCallback((message: string | null = null) => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setNotice(message);
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    let active = true;
    const stored = localStorage.getItem(TOKEN_KEY);

    const restore = stored
      ? api.fetchMe(stored).then((current) => {
          if (active) {
            setUser(current);
            setToken(stored);
          }
        })
      : Promise.resolve();

    restore
      .catch((error: unknown) => {
        if (active) {
          expire(error instanceof ApiError && error.status === 401 ? SESSION_EXPIRED : errorMessage(error));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [expire]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, response.token);
    setNotice(null);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await api.logout(token).catch(() => undefined);
    }
    expire();
  }, [token, expire]);

  const value = useMemo(
    () => ({ user, token, loading, notice, login, logout, expire, clearNotice }),
    [user, token, loading, notice, login, logout, expire, clearNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
