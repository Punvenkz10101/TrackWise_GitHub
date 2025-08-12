import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { authAPI } from "@/lib/api";
import MultiBrowserAuth from "@/lib/multiBrowserAuth";
import { tabStorage } from "@/lib/tabScopedStorage";
import socketService from "@/lib/socketService";

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
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  signupWithCredentials: (name: string, email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type JWTPayload = {
  userId: string;
  name: string;
  email: string;
  exp: number;
};

// No more fake token generation - always use real API calls

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const isDev = import.meta.env.DEV;

  // Validate token using multi-browser auth system
  const validateToken = async (token?: string): Promise<boolean> => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const tokenToValidate = token || MultiBrowserAuth.getToken();

    if (!tokenToValidate) {
      return false;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json'
        }
      });

      const isValid = response.ok;

      if (!isValid) {
        MultiBrowserAuth.clearTabAuth();
      }

      return isValid;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const tabInfo = tabStorage.getTabInfo();

      try {
        // Check if user is authenticated in current tab
        // During initialization, these calls might fail if no user is set yet
        let storedToken = null;
        let userData = null;

        try {
          storedToken = MultiBrowserAuth.getToken();
          userData = MultiBrowserAuth.getUser();
        } catch (error) {
          // No stored authentication found
        }

        if (storedToken && userData) {
          // Set the state first, then validate in background
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);

          // Validate token with server in background (don't block UI)
          setTimeout(async () => {
            try {
              const isValid = await validateToken(storedToken);
              if (!isValid) {
                MultiBrowserAuth.clearTabAuth();
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
              }
            } catch (error) {
              // Don't clear auth on network errors
            }
          }, 1000);

        } else {
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    initAuth();
  }, []);

  const login = (newToken: string) => {
    try {
      const tabInfo = tabStorage.getTabInfo();

      // CRITICAL: Clear previous user data from this tab
      if (user?.id) {
        MultiBrowserAuth.switchUser();
      }

      // Decode and validate the token
      const payload = jwtDecode<JWTPayload>(newToken);

      // Save token using multi-browser auth system
      MultiBrowserAuth.saveToken(newToken);

      // Set local state
      setToken(newToken);
      const newUser = {
        id: payload.userId,
        name: payload.name,
        email: payload.email,
      };
      setUser(newUser);
      setIsAuthenticated(true);

      // Reconnect socket with new authentication
      socketService.reconnectWithAuth();
    } catch (error) {
      throw new Error("Login failed: Invalid token");
    }
  };

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      console.log("Attempting login with credentials");
      const response = await authAPI.login(email, password);

      if (!response || !response.token) {
        throw new Error("Invalid response from server");
      }

      console.log("Login successful, token received");
      login(response.token);
    } catch (error) {
      console.error("Login error:", error);
      // Provide more specific error message based on the error
      let errorMessage = "Login failed";

      if (error instanceof Error) {
        if (error.message.includes("Invalid credentials")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("connect")) {
          errorMessage = "Cannot connect to server";
        }
      }

      throw new Error(errorMessage);
    }
  };

  const signupWithCredentials = async (name: string, email: string, password: string) => {
    try {
      console.log("Attempting signup with credentials");
      const response = await authAPI.signup(name, email, password);

      if (!response || !response.token) {
        throw new Error("Invalid response from server");
      }

      console.log("Signup successful, token received");
      login(response.token);
    } catch (error) {
      console.error("Signup error:", error);
      // Provide more specific error message based on the error
      let errorMessage = "Signup failed";

      if (error instanceof Error) {
        if (error.message.includes("User already exists")) {
          errorMessage = "Email is already registered";
        } else if (error.message.includes("connect")) {
          errorMessage = "Cannot connect to server";
        }
      }

      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    const currentUserId = user?.id;
    const tabInfo = tabStorage.getTabInfo();

    // Clear authentication using multi-browser system
    MultiBrowserAuth.clearTabAuth();

    // Disconnect socket since user is no longer authenticated
    socketService.disconnect();

    // Clear local state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Clear any non-user-specific cache keys for this tab
    const cacheKeys = ['currentPath', 'redirectAfterLogin', 'lastLocation'];
    cacheKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Ignore errors
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated,
      loginWithCredentials,
      signupWithCredentials
    }}>
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

// Safe version that returns null instead of throwing
export const useAuthSafe = (): AuthContextType | null => {
  const context = useContext(AuthContext);
  return context || null;
};
