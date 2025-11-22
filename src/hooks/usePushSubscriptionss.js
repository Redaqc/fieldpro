import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pushSubscriptionsApi } from '@/api/push-subscriptions';
import { useToast } from '@/hooks/use-toast';

export const pushSubscriptionsKeys = {
  all: ['pushSubscriptions'],
  lists: () => [...pushSubscriptionsKeys.all, 'list'],
  list: (filters) => [...pushSubscriptionsKeys.lists(), filters],
  details: () => [...pushSubscriptionsKeys.all, 'detail'],
  detail: (id) => [...pushSubscriptionsKeys.details(), id],
  statistics: () => [...pushSubscriptionsKeys.all, 'statistics'],
};

export const usePushSubscriptionss = (params = {}) => {
  return useQuery({
    queryKey: pushSubscriptionsKeys.list(params),
    queryFn: () => pushSubscriptionsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const usePushSubscriptions = (id, options = {}) => {
  return useQuery({
    queryKey: pushSubscriptionsKeys.detail(id),
    queryFn: () => pushSubscriptionsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreatePushSubscriptions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: pushSubscriptionsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pushSubscriptionsKeys.lists() });
      
      toast({ title: 'Success', description: 'PushSubscriptions created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create push-subscriptions' });
    },
  });
};

export const useUpdatePushSubscriptions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => pushSubscriptionsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(pushSubscriptionsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: pushSubscriptionsKeys.lists() });
      toast({ title: 'Success', description: 'PushSubscriptions updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update push-subscriptions' });
    },
  });
};

export const useDeletePushSubscriptions = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: pushSubscriptionsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: pushSubscriptionsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: pushSubscriptionsKeys.lists() });
      
      toast({ title: 'Success', description: 'PushSubscriptions deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete push-subscriptions' });
    },
  });
};
