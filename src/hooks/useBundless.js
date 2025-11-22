import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bundlesApi } from '@/api/bundles';
import { useToast } from '@/hooks/use-toast';

export const bundlesKeys = {
  all: ['bundles'],
  lists: () => [...bundlesKeys.all, 'list'],
  list: (filters) => [...bundlesKeys.lists(), filters],
  details: () => [...bundlesKeys.all, 'detail'],
  detail: (id) => [...bundlesKeys.details(), id],
  statistics: () => [...bundlesKeys.all, 'statistics'],
};

export const useBundless = (params = {}) => {
  return useQuery({
    queryKey: bundlesKeys.list(params),
    queryFn: () => bundlesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useBundles = (id, options = {}) => {
  return useQuery({
    queryKey: bundlesKeys.detail(id),
    queryFn: () => bundlesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateBundles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: bundlesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bundlesKeys.lists() });
      
      toast({ title: 'Success', description: 'Bundles created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create bundles' });
    },
  });
};

export const useUpdateBundles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => bundlesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(bundlesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: bundlesKeys.lists() });
      toast({ title: 'Success', description: 'Bundles updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update bundles' });
    },
  });
};

export const useDeleteBundles = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: bundlesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: bundlesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: bundlesKeys.lists() });
      
      toast({ title: 'Success', description: 'Bundles deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete bundles' });
    },
  });
};
