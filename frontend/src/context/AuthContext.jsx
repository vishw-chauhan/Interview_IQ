import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { setOnUnauthorized } from '../services/api.js';
import { loginUser, registerUser, fetchCurrentUser } from '../services/auth.service.js';

const TOKEN_KEY = 'interviewiq_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  // On first load (or when the token changes), confirm the token is still
  // valid by asking the backend who it belongs to.
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      if (!token) {
        setIsInitializing(false);
        return;
      }
      try {
        const me = await fetchCurrentUser();
        if (isMounted) setUser(me);
      } catch {
        if (isMounted) logout();
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (credentials) => {
    const result = await loginUser(credentials);
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await registerUser(payload);
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(token), isInitializing, login, register, logout }),
    [user, token, isInitializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}