import { createContext, useContext, useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "sports_app_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginMutation({ email, password });
    setUser(data);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
    return data;
  };

  const register = async (email, password, name) => {
    const data = await registerMutation({ email, password, name, role: "viewer" });
    setUser(data);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
    return data;
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
