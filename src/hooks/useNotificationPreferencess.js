import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationPreferencesApi } from '@/api/notification-preferences';
import { useToast } from '@/hooks/use-toast';

export const notificationPreferencesKeys = {
  all: ['notificationPreferences'],
  lists: () => [...notificationPreferencesKeys.all, 'list'],
  list: (filters) => [...notificationPreferencesKeys.lists(), filters],
  details: () => [...notificationPreferencesKeys.all, 'detail'],
  detail: (id) => [...notificationPreferencesKeys.details(), id],
  statistics: () => [...notificationPreferencesKeys.all, 'statistics'],
};

export const useNotificationPreferencess = (params = {}) => {
  return useQuery({
    queryKey: notificationPreferencesKeys.list(params),
    queryFn: () => notificationPreferencesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useNotificationPreferences = (id, options = {}) => {
  return useQuery({
    queryKey: notificationPreferencesKeys.detail(id),
    queryFn: () => notificationPreferencesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: notificationPreferencesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationPreferencesKeys.lists() });
      
      toast({ title: 'Success', description: 'NotificationPreferences created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create notification-preferences' });
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => notificationPreferencesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationPreferencesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: notificationPreferencesKeys.lists() });
      toast({ title: 'Success', description: 'NotificationPreferences updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update notification-preferences' });
    },
  });
};

export const useDeleteNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: notificationPreferencesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: notificationPreferencesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: notificationPreferencesKeys.lists() });
      
      toast({ title: 'Success', description: 'NotificationPreferences deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete notification-preferences' });
    },
  });
};
