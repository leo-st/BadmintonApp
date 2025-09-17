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
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // For now, we'll just set loading to false
      // In a real app, you'd check for stored tokens or make a request to verify auth
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login({ username, password });
      
      // Backend returns {message: "login successful"} and sets cookie
      if (response.message === 'login successful') {
        // Fetch user data after successful login
        try {
          const userData = await apiService.getUser(1); // You might need to adjust this
          setUser(userData);
        } catch (userError) {
          // If we can't fetch user data, create a mock user
          console.log('Could not fetch user data, using mock user');
          const mockUser: User = {
            id: 1,
            username,
            email: `${username}@example.com`,
            full_name: username.charAt(0).toUpperCase() + username.slice(1),
            is_active: true,
            created_at: new Date().toISOString(),
          };
          setUser(mockUser);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
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

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
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
