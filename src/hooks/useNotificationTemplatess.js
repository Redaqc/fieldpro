import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationTemplatesApi } from '@/api/notification-templates';
import { useToast } from '@/hooks/use-toast';

export const notificationTemplatesKeys = {
  all: ['notificationTemplates'],
  lists: () => [...notificationTemplatesKeys.all, 'list'],
  list: (filters) => [...notificationTemplatesKeys.lists(), filters],
  details: () => [...notificationTemplatesKeys.all, 'detail'],
  detail: (id) => [...notificationTemplatesKeys.details(), id],
  statistics: () => [...notificationTemplatesKeys.all, 'statistics'],
};

export const useNotificationTemplatess = (params = {}) => {
  return useQuery({
    queryKey: notificationTemplatesKeys.list(params),
    queryFn: () => notificationTemplatesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useNotificationTemplates = (id, options = {}) => {
  return useQuery({
    queryKey: notificationTemplatesKeys.detail(id),
    queryFn: () => notificationTemplatesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateNotificationTemplates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: notificationTemplatesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationTemplatesKeys.lists() });
      
      toast({ title: 'Success', description: 'NotificationTemplates created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create notification-templates' });
    },
  });
};

export const useUpdateNotificationTemplates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => notificationTemplatesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationTemplatesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: notificationTemplatesKeys.lists() });
      toast({ title: 'Success', description: 'NotificationTemplates updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update notification-templates' });
    },
  });
};

export const useDeleteNotificationTemplates = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: notificationTemplatesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: notificationTemplatesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: notificationTemplatesKeys.lists() });
      
      toast({ title: 'Success', description: 'NotificationTemplates deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete notification-templates' });
    },
  });
};
