import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/auth';
import { tokenManager } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for user login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Invalidate and refetch current user query
      queryClient.setQueryData(['currentUser'], data.user);

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      // Navigate to dashboard or home
      navigate('/');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
      });
    },
  });
};

/**
 * Hook for user registration
 */
export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Set current user in cache
      queryClient.setQueryData(['currentUser'], data.user);

      toast({
        title: 'Success',
        description: 'Account created successfully',
      });

      // Navigate to dashboard
      navigate('/');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'Failed to create account',
      });
    },
  });
};

/**
 * Hook for user logout
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();

      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });

      // Navigate to login
      navigate('/login');
    },
    onError: (error) => {
      // Even on error, clear tokens and redirect
      tokenManager.clearTokens();
      queryClient.clear();
      navigate('/login');

      toast({
        variant: 'destructive',
        title: 'Logout error',
        description: error.message || 'An error occurred during logout',
      });
    },
  });
};

/**
 * Hook to get current authenticated user
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: authApi.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Main auth hook - provides all auth state and methods
 */
export const useAuth = () => {
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    // User data
    user,
    isAuthenticated: authApi.isAuthenticated() && !!user,
    isLoading,
    error,

    // Methods
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    refetch,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
};
