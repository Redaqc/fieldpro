import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookApi } from '@/api/webhook';
import { useToast } from '@/hooks/use-toast';

export const webhookKeys = {
  all: ['webhook'],
  lists: () => [...webhookKeys.all, 'list'],
  list: (filters) => [...webhookKeys.lists(), filters],
  details: () => [...webhookKeys.all, 'detail'],
  detail: (id) => [...webhookKeys.details(), id],
  statistics: () => [...webhookKeys.all, 'statistics'],
};

export const useWebhooks = (params = {}) => {
  return useQuery({
    queryKey: webhookKeys.list(params),
    queryFn: () => webhookApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useWebhook = (id, options = {}) => {
  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: () => webhookApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: webhookApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      
      toast({ title: 'Success', description: 'Webhook created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create webhook' });
    },
  });
};

export const useUpdateWebhook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => webhookApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(webhookKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      toast({ title: 'Success', description: 'Webhook updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update webhook' });
    },
  });
};

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: webhookApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: webhookKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      
      toast({ title: 'Success', description: 'Webhook deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete webhook' });
    },
  });
};
