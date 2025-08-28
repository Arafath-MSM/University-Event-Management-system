
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | 'student'
    | 'faculty'
    | 'service-provider'
    | 'super-admin'
    | 'vice-chancellor'
    | 'administration'
    | 'student-union'
    | 'warden';
  serviceType?: 'Sound System' | 'Media'; // Only for service-provider
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define role categories
const PUBLIC_ROLES = ['student', 'faculty'];
const AUTHORITY_ROLES = ['super-admin', 'service-provider', 'vice-chancellor', 'administration', 'student-union', 'warden'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('eventra_token');
        const storedUser = localStorage.getItem('eventra_user');
        
        console.log('Checking authentication status...');
        console.log('Token exists:', !!token);
        console.log('Stored user exists:', !!storedUser);
        
        if (token && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            
            // Verify token is still valid by making a test API call
            const isValid = await apiService.isAuthenticated();
            
            if (isValid) {
              console.log('Token is valid, restoring user session');
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              console.log('Token is invalid, clearing session');
              localStorage.removeItem('eventra_token');
              localStorage.removeItem('eventra_user');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('eventra_token');
            localStorage.removeItem('eventra_user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('No stored authentication found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext: Login attempt for:', { email, password: password ? 'provided' : 'missing' });
    
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.user && response.token) {
        console.log('Authentication successful:', response.user);
        
        const userData: User = {
          id: response.user.id.toString(),
          name: response.user.name,
          email: response.user.email,
          role: response.user.role as User['role'],
          serviceType: response.user.service_type as User['serviceType'],
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('eventra_user', JSON.stringify(userData));
        localStorage.setItem('eventra_token', response.token);
        return true;
      } else {
        console.log('Authentication failed:', response.message);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    console.log('AuthContext: Registration attempt for:', userData);
    
    // Check if the role is allowed for public registration
    if (!PUBLIC_ROLES.includes(userData.role as any)) {
      console.error('Registration failed: Role not allowed for public registration');
      throw new Error('This role cannot be registered publicly. Please contact your administrator.');
    }
    
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        console.log('Registration successful:', response.user);
        
        localStorage.removeItem('eventra_user');
        localStorage.removeItem('eventra_token');
        setUser(null);
        setIsAuthenticated(false);
        
        return true;
      } else {
        console.error('Registration failed:', response.message);
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('eventra_token');
    localStorage.removeItem('eventra_user');
    apiService.logout();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
