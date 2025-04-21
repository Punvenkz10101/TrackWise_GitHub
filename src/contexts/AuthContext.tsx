
import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type JWTPayload = {
  userId: string;
  name: string;
  email: string;
  exp: number;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if there's a token in localStorage
    const storedToken = localStorage.getItem("trackwise-token");
    if (storedToken) {
      try {
        // Validate the token (check expiration)
        const payload = jwtDecode<JWTPayload>(storedToken);
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          // Valid token, set the user
          setToken(storedToken);
          setUser({
            id: payload.userId,
            name: payload.name,
            email: payload.email,
          });
          setIsAuthenticated(true);
        } else {
          // Token expired, clear it
          localStorage.removeItem("trackwise-token");
        }
      } catch (error) {
        // Invalid token, clear it
        localStorage.removeItem("trackwise-token");
      }
    }
  }, []);

  const login = (newToken: string) => {
    try {
      // Set the token in localStorage
      localStorage.setItem("trackwise-token", newToken);
      
      // Decode the token to get user info
      const payload = jwtDecode<JWTPayload>(newToken);
      
      // Set the user in state
      setToken(newToken);
      setUser({
        id: payload.userId,
        name: payload.name,
        email: payload.email,
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  const logout = () => {
    // Clear the token from localStorage
    localStorage.removeItem("trackwise-token");
    
    // Clear the user from state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
