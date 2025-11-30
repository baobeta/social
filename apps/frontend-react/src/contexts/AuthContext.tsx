import { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as authService from '@/services/auth.ajax';
import type { User, LoginCredentials, RegisterData, UpdateProfileData } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
  getInitials: (name: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: userData, isLoading, } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await authService.getCurrentUser();
        return response.data.user;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const user = userData || null;
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      queryClient.setQueryData(['currentUser'], response.data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Login failed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (response) => {
      queryClient.setQueryData(['currentUser'], response.data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Registration failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
      setError(null);
    },
    onError: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (response) => {
      queryClient.setQueryData(['currentUser'], response.data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Update failed');
    },
  });

  async function login(credentials: LoginCredentials): Promise<void> {
    await loginMutation.mutateAsync(credentials);
  }

  async function register(data: RegisterData): Promise<void> {
    await registerMutation.mutateAsync(data);
  }

  async function logout(): Promise<void> {
    await logoutMutation.mutateAsync();
  }

  async function updateProfile(data: UpdateProfileData): Promise<void> {
    await updateProfileMutation.mutateAsync(data);
  }

  function clearError(): void {
    setError(null);
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const loading = isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
        getInitials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

