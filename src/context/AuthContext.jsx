import { createContext, useContext, useState, useCallback } from 'react';
import { addUser, loginUser } from '../db/indexedDB';

const AuthContext = createContext(null);

const SESSION_KEY = 'snakeCurrentUser';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const persistUser = (userData) => {
    // Never store the password in the session, only public profile info.
    const safeUser = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
    return safeUser;
  };

  const signup = useCallback(async ({ username, email, password }) => {
    const newUser = await addUser({ username, email, password });
    return persistUser(newUser);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const matchedUser = await loginUser(email, password);
    if (!matchedUser) {
      throw new Error('Invalid email or password.');
    }
    return persistUser(matchedUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
