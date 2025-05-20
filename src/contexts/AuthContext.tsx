import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { authAPI } from "@/lib/api";
import { saveToken, getToken, removeToken } from "@/lib/auth";

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

// Create a development user for dev environment
const getDevUser = () => {
  return {
    id: localStorage.getItem('dev-user-id') || "dev-user-id",
    name: "Development User",
    email: "dev@example.com",
  };
};

// Create a proper JWT-formatted token for development purposes
const createDefaultToken = () => {
  // This creates a token that matches the structure expected by the server
  // with the same signature method (even though in development we won't validate the signature)
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  // Use a consistent dev userId that persists in localStorage
  let devUserId = localStorage.getItem('dev-user-id');
  if (!devUserId) {
    // Generate a valid MongoDB ObjectId format for development
    // Format: 12 bytes - 4 bytes timestamp, 5 bytes random, 3 bytes counter
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
    const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
    const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');

    // Ensure exactly 24 hex characters
    devUserId = timestamp + machineId.substring(0, 4) + processId.substring(0, 4) + counter.substring(0, 8);

    // Validate that it's exactly 24 characters
    if (devUserId.length !== 24) {
      // If not, create a simple 24-char hex string
      devUserId = Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 16).toString(16)).join('');
    }

    localStorage.setItem('dev-user-id', devUserId);
  } else if (devUserId.length !== 24) {
    // If stored ID is invalid, regenerate it
    devUserId = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 16).toString(16)).join('');
    localStorage.setItem('dev-user-id', devUserId);
  }

  const payload = {
    userId: devUserId,
    name: "Development User",
    email: "dev@example.com",
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
  };

  const encodeBase64 = (obj: Record<string, unknown>) => {
    return btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerEncoded = encodeBase64(header);
  const payloadEncoded = encodeBase64(payload);
  // In development, we use a fake signature (in production this would be cryptographically generated)
  const signature = "dev_signature_not_valid_for_production";

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const isDev = import.meta.env.DEV;

  // Direct API call to check if token is valid by requesting current user
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // Only do this check in development mode since we're using a fake token
      if (isDev) {
        return true;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`, {
        headers
      });

      return response.ok;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Check for stored token in both dev and production
      const storedToken = getToken();

      if (storedToken) {
        try {
          const payload = jwtDecode<JWTPayload>(storedToken);
          const currentTime = Date.now() / 1000;

          if (payload.exp > currentTime) {
            // Additional validation by checking with the server
            const isValid = await validateToken(storedToken);

            if (isValid) {
              setToken(storedToken);
              setUser({
                id: payload.userId,
                name: payload.name,
                email: payload.email,
              });
              setIsAuthenticated(true);
            } else {
              console.log("Token validation failed, removing token");
              removeToken();
            }
          } else {
            console.log("Token expired, removing token");
            removeToken();
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          removeToken();
        }
      }
    };

    initAuth();
  }, [isDev]);

  const login = (newToken: string) => {
    try {
      saveToken(newToken);

      // In development, use the token but still decode it
      const payload = jwtDecode<JWTPayload>(newToken);
      setToken(newToken);

      if (isDev) {
        // In dev, use the dev user info but still require login
        const devUser = getDevUser();
        setUser({
          id: payload.userId || devUser.id,
          name: payload.name || devUser.name,
          email: payload.email || devUser.email,
        });
      } else {
        // In production, decode the token normally
        setUser({
          id: payload.userId,
          name: payload.name,
          email: payload.email,
        });
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error logging in:", error);
      throw new Error("Login failed: Invalid token");
    }
  };

  const loginWithCredentials = async (email: string, password: string) => {
    if (isDev) {
      console.log("Development mode login");
      // Simulate a successful login but require credentials
      login(createDefaultToken());
      return;
    }

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
    if (isDev) {
      console.log("Development mode signup");
      // Simulate a successful signup but require credentials
      login(createDefaultToken());
      return;
    }

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
    removeToken();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
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
