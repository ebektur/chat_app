// lib/ctx.tsx

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "./api";
import { clearToken, getToken, saveToken } from "./secure";

// Define the shape of the context's value
interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  // FIX: The login function now correctly returns a Promise with the token string.
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication state and functions to its children.
 * It manages the user's token, loading states, and login/logout operations.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the token from secure storage on initial app launch
  useEffect(() => {
    const loadToken = async () => {
      try {
        setIsLoading(true);
        const storedToken = await getToken();
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (e) {
        console.error("Failed to load token:", e);
        // It's good practice to handle this error, maybe by ensuring the user is logged out
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // Encapsulates the full login flow: API call, token saving, and state update
  const login = useCallback(async (username: string, password: string): Promise<string> => {
    setIsLoading(true);
    try {
      const newToken = await api.login(username, password); // API returns string
      await saveToken(newToken);
      setToken(newToken);
      return newToken; // ✅ return token to caller
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Encapsulates the full logout flow: token clearing and state update
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearToken();
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value = {
    token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to easily access the authentication context.
 * Throws an error if used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};