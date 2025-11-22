import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/api/alerts';
import { useToast } from '@/hooks/use-toast';

export const alertsKeys = {
  all: ['alerts'],
  lists: () => [...alertsKeys.all, 'list'],
  list: (filters) => [...alertsKeys.lists(), filters],
  details: () => [...alertsKeys.all, 'detail'],
  detail: (id) => [...alertsKeys.details(), id],
  statistics: () => [...alertsKeys.all, 'statistics'],
};

export const useAlertss = (params = {}) => {
  return useQuery({
    queryKey: alertsKeys.list(params),
    queryFn: () => alertsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useAlerts = (id, options = {}) => {
  return useQuery({
    queryKey: alertsKeys.detail(id),
    queryFn: () => alertsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateAlerts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: alertsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: alertsKeys.lists() });
      
      toast({ title: 'Success', description: 'Alerts created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create alerts' });
    },
  });
};

export const useUpdateAlerts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => alertsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(alertsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: alertsKeys.lists() });
      toast({ title: 'Success', description: 'Alerts updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update alerts' });
    },
  });
};

export const useDeleteAlerts = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: alertsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: alertsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: alertsKeys.lists() });
      
      toast({ title: 'Success', description: 'Alerts deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete alerts' });
    },
  });
};
