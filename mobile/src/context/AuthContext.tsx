import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { apiService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (you might want to store this in AsyncStorage)
    console.log('Auth: useEffect mount -> checkAuthStatus');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Auth: checkAuthStatus start');
      // Try to get current user with permissions
      const userData = await apiService.getCurrentUser();
      console.log('Auth: checkAuthStatus success', userData?.username, userData?.id);
      setUser(userData);
    } catch (error) {
      console.log('Auth: checkAuthStatus not authenticated');
      setUser(null);
    } finally {
      console.log('Auth: checkAuthStatus end');
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Auth: login start', username);
      const response = await apiService.login({ username, password });
      
      // Backend returns {message: "login successful"} and sets cookie
      if (response.message === 'login successful') {
        console.log('Auth: login ok, fetching me');
        // Fetch user data with permissions
        const userData = await apiService.getCurrentUser();
        console.log('Auth: me', userData?.username, userData?.id);
        setUser(userData);
        return true;
      }
      console.log('Auth: login unexpected response', response);
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      console.log('Auth: login end');
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  };

  const isAdmin = (): boolean => {
    return user?.role_id === 1;
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    hasPermission,
    isAdmin,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
