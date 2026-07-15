import { API_URL } from "@/api";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type User = { name: string; email: string; role: string };
type AuthCtx = {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);
const KEY = "pantix-auth";
const DEMO = { email: "admin@pantix.in", password: "admin123" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) try { setUser(JSON.parse(raw)); } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { ok: false, error: data.error || "Login failed" };
      }
      
      if (data.user.role !== "admin" && data.user.role !== "Super Admin" && data.user.role !== "admin-user") {
        return { ok: false, error: "Unauthorized. Admin access required." };
      }

      localStorage.setItem("pantix_admin_token", data.token);
      localStorage.setItem(KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Network error. Please ensure backend is running." };
    }
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem("pantix_admin_token");
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout, loading }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
