import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "../api";

const AuthContext = createContext(null);
const TOKEN_KEY = "hms_token";

const readToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(readToken);
  const [checking, setChecking] = useState(Boolean(readToken()));

  useEffect(() => {
    const saved = readToken();
    if (!saved) return;

    apiRequest("/api/auth/me", { token: saved })
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener("hms:unauthorized", logout);
    return () => window.removeEventListener("hms:unauthorized", logout);
  }, [logout]);

  const startSession = ({ token: newToken, user: newUser }, remember = true) => {
    clearToken();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const login = async ({ email, password, remember }) => {
    const data = await apiRequest("/api/auth/login", { method: "POST", body: { email, password } });
    startSession(data, remember);
  };

  const updateProfile = async (values) => {
    const data = await apiRequest("/api/auth/profile", { method: "PATCH", body: values });
    setUser(data.user);
  };
  const isStudent = user?.userType === "student";

  return (
    <AuthContext.Provider value={{ user, token, checking, isStudent, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
