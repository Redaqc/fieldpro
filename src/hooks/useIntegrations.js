import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationApi } from '@/api/integration';
import { useToast } from '@/hooks/use-toast';

export const integrationKeys = {
  all: ['integration'],
  lists: () => [...integrationKeys.all, 'list'],
  list: (filters) => [...integrationKeys.lists(), filters],
  details: () => [...integrationKeys.all, 'detail'],
  detail: (id) => [...integrationKeys.details(), id],
  statistics: () => [...integrationKeys.all, 'statistics'],
};

export const useIntegrations = (params = {}) => {
  return useQuery({
    queryKey: integrationKeys.list(params),
    queryFn: () => integrationApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useIntegration = (id, options = {}) => {
  return useQuery({
    queryKey: integrationKeys.detail(id),
    queryFn: () => integrationApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: integrationApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      
      toast({ title: 'Success', description: 'Integration created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create integration' });
    },
  });
};

export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => integrationApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(integrationKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      toast({ title: 'Success', description: 'Integration updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update integration' });
    },
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: integrationApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: integrationKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      
      toast({ title: 'Success', description: 'Integration deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete integration' });
    },
  });
};
