import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '@/services/api';
import logger from '@/lib/logger';

const AuthContext = createContext();

const TOKEN_KEY = 'fieldpro_auth_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Check if token exists
      const token = getToken();
      if (!token) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        return;
      }

      // Verify token with backend
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);

      // Set user context for logging
      logger.setContext({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
      });

      logger.info('User authenticated successfully', {
        userId: currentUser.id,
        email: currentUser.email,
      });
    } catch (error) {
      logger.error('Authentication check failed', {
        status: error.status,
        message: error.message,
      }, error);

      // Clear invalid token
      removeToken();
      setUser(null);
      setIsAuthenticated(false);

      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required. Please log in.',
        });
      } else {
        setAuthError({
          type: 'error',
          message: error.message || 'Authentication failed',
        });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      setAuthError(null);

      const response = await api.auth.login(email, password);
      const { token, user: userData } = response;

      // Store token
      setToken(token);

      // Set user state
      setUser(userData);
      setIsAuthenticated(true);

      // Set user context for logging
      logger.setContext({
        userId: userData.id,
        userEmail: userData.email,
        userName: userData.name,
      });

      logger.info('User logged in successfully', {
        userId: userData.id,
        email: userData.email,
      });

      return { success: true, user: userData };
    } catch (error) {
      logger.error('Login failed', {
        email,
        status: error.status,
        message: error.message,
      }, error);

      setAuthError({
        type: 'login_failed',
        message: error.message || 'Login failed. Please check your credentials.',
      });

      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      setAuthError(null);

      const response = await api.auth.register(userData);
      const { token, user: newUser } = response;

      // Store token
      setToken(token);

      // Set user state
      setUser(newUser);
      setIsAuthenticated(true);

      // Set user context for logging
      logger.setContext({
        userId: newUser.id,
        userEmail: newUser.email,
        userName: newUser.name,
      });

      logger.info('User registered successfully', {
        userId: newUser.id,
        email: newUser.email,
      });

      return { success: true, user: newUser };
    } catch (error) {
      logger.error('Registration failed', {
        email: userData.email,
        status: error.status,
        message: error.message,
      }, error);

      setAuthError({
        type: 'registration_failed',
        message: error.message || 'Registration failed. Please try again.',
      });

      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    logger.info('User logging out', {
      userId: user?.id,
    });

    // Clear token
    removeToken();

    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);

    // Clear user context from logger
    logger.clearContext(['userId', 'userEmail', 'userName']);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    logger.setContext({
      userId: updatedUser.id,
      userEmail: updatedUser.email,
      userName: updatedUser.name,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        login,
        register,
        logout,
        updateUser,
        checkAuth,
      }}
    >
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

// Token management utilities
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};
