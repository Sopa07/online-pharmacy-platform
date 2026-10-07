import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../utils/api";

const AUTH_STORAGE_KEY = "shazzar_auth_v1";
const AuthContext = createContext(null);

async function authRequest(path, payload) {
  const result = await apiRequest(path, { method: "POST", body: payload });
  return result.data;
}

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed?.token && parsed?.user ? parsed : null;
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return;
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [session]);

  useEffect(() => {
    let isMounted = true;

    async function verifyStoredSession() {
      if (!session?.token) {
        if (isMounted) setIsReady(true);
        return;
      }

      try {
        const result = await apiRequest("/auth/me", { token: session.token });
        if (!isMounted) return;
        setSession((previous) => ({
          ...previous,
          user: result.data.user
        }));
      } catch {
        if (isMounted) setSession(null);
      } finally {
        if (isMounted) setIsReady(true);
      }
    }

    verifyStoredSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const register = async ({ name, email, phone, password }) => {
    const data = await authRequest("/auth/register", { name, email, phone, password });
    // With email confirmation enabled the signup response has no session token;
    // the user must confirm and log in instead of being signed in here.
    const needsConfirmation = !data.token;
    if (!needsConfirmation) {
      setSession(data);
    }
    return { user: data.user, needsConfirmation };
  };

  const login = async ({ email, password }) => {
    const data = await authRequest("/auth/login", { email, password });
    setSession(data);
    return data.user;
  };

  const logout = () => setSession(null);

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      register,
      login,
      logout,
      isReady,
      isAuthenticated: Boolean(session?.token),
      isAdmin: Boolean(session?.user?.role === "admin")
    }),
    [isReady, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
