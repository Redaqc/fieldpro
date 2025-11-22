import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';
import { useToast } from '@/hooks/use-toast';

export const notificationsKeys = {
  all: ['notifications'],
  lists: () => [...notificationsKeys.all, 'list'],
  list: (filters) => [...notificationsKeys.lists(), filters],
  details: () => [...notificationsKeys.all, 'detail'],
  detail: (id) => [...notificationsKeys.details(), id],
  statistics: () => [...notificationsKeys.all, 'statistics'],
};

export const useNotificationss = (params = {}) => {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => notificationsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useNotifications = (id, options = {}) => {
  return useQuery({
    queryKey: notificationsKeys.detail(id),
    queryFn: () => notificationsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: notificationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
      
      toast({ title: 'Success', description: 'Notifications created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create notifications' });
    },
  });
};

export const useUpdateNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => notificationsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
      toast({ title: 'Success', description: 'Notifications updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update notifications' });
    },
  });
};

export const useDeleteNotifications = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: notificationsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
      
      toast({ title: 'Success', description: 'Notifications deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete notifications' });
    },
  });
};
