import { createContext, useContext, useState, ReactNode } from "react";
import { isSessionActive, clearSession } from "@/lib/session";

export type UserRole = "customer" | "merchant" | "admin";

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  token: string | null;
  setToken: (t: string | null) => void;
  user: { _id: string; name: string; email: string; role: UserRole; createdAt: string; updatedAt: string } | null;
  setUser: (u: { _id: string; name: string; email: string; role: UserRole; createdAt: string; updatedAt: string } | null) => void;
  updateUser: (updatedUser: { _id: string; name: string; email: string; role: UserRole; createdAt: string; updatedAt: string }) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: "customer",
  setRole: () => {},
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  token: null,
  setToken: () => {},
  user: null,
  setUser: () => {},
  updateUser: () => {},
  isLoading: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem("token")
  );
  const [user, setUserState] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [role, setRoleState] = useState<UserRole>(() => {
    const r = localStorage.getItem("role") as UserRole | null;
    return r === "customer" || r === "merchant" || r === "admin" ? r : "customer";
  });
  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(
    () => !!localStorage.getItem("token") && !!localStorage.getItem("user") && isSessionActive()
  );

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  };

  const setUser = (u: any) => {
    setUserState(u);
    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");
  };

  const setRole = (r: UserRole) => {
    setRoleState(r);
    localStorage.setItem("role", r);
  };

  const setIsLoggedIn = (v: boolean) => {
    setIsLoggedInState(v);
    if (!v) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      clearSession();
      setTokenState(null);
      setUserState(null);
      setRoleState("customer");
    }
  };

  const updateUser = (updatedUser: { _id: string; name: string; email: string; role: UserRole; createdAt: string; updatedAt: string }) => {
    setUser(updatedUser);
    setRole(updatedUser.role);
  };

  return (
    <AuthContext.Provider value={{
      role, setRole,
      isLoggedIn, setIsLoggedIn,
      token, setToken,
      user, setUser,
      updateUser,
      isLoading: false,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
