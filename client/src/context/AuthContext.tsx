// client/src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "agent" | "admin";
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await axiosClient.get("/auth/me");
        setUser(res.data.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.data.user));
      } catch (err) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch (e) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/login";
    }
  };

  const updateUser = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
