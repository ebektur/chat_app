import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";
import { secure } from "./secure";
const { getToken, saveToken, clearToken } = secure;

// Kimlik doğrulama
interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Uygulama genelinde kimlik doğrulama durumunu yönetir
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Uygulama ilk açıldığında kaydedilmiş token'ı yüklemek için kullanılır
  useEffect(() => {
    let isMounted = true;

    const loadToken = async () => {
      console.log("Token yükleniyor");
      setIsLoading(true);
      try {
        const storedToken = await getToken();
        console.log("Depolanan token:", storedToken);
        if (storedToken) {
          if (isMounted) {
            setToken(storedToken);
          }
        }
      } catch (e) {
        console.error("Token yüklenemedi:", e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          // Doğru değeri logla.
          console.log("Token yüklemesi tamamlandı, isLoading: false");
        }
      }
    };

    loadToken();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Kullanıcıyı sisteme giriş yaptırır, token'ı alır ve state'i günceller.
   */
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const newToken = await api.login(username, password);
      await saveToken(newToken);
      setToken(newToken);
      return newToken;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Kullanıcıyı sistemden çıkarır ve depolanan token'ı temizler.
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    await clearToken();
    setToken(null);
    setIsLoading(false);
  }, []);

  const value = useMemo(() => ({
    token,
    isLoading,
    login,
    logout
  }), [token, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, bir AuthProvider içinde kullanılmalıdır");
  return ctx;
};