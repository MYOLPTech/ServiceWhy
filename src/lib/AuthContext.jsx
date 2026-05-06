import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = () => {
    setIsLoadingAuth(true);
    const token = localStorage.getItem('google_auth_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Optional: Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout(false);
          setAuthError({ type: 'auth_required', message: 'Session expired' });
        } else if (decoded.email !== 'tech@myolifeplan.com') {
          logout(false);
          setAuthError({ type: 'unauthorized', message: 'Unauthorized access: only tech@myolifeplan.com is permitted.' });
        } else {
          setUser(decoded);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Invalid token", e);
        logout(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const login = (credentialResponse) => {
    const { credential } = credentialResponse;
    if (credential) {
      const decoded = jwtDecode(credential);
      if (decoded.email !== 'tech@myolifeplan.com') {
        setAuthError({ type: 'unauthorized', message: 'Unauthorized access: only tech@myolifeplan.com is permitted.' });
        return;
      }
      localStorage.setItem('google_auth_token', credential);
      setUser(decoded);
      setIsAuthenticated(true);
      setAuthError(null);
    }
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem('google_auth_token');
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings: false,
      appPublicSettings: null,
      authError,
      authChecked,
      login,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
