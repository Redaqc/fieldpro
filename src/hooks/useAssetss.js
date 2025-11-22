import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '@/api/assets';
import { useToast } from '@/hooks/use-toast';

export const assetsKeys = {
  all: ['assets'],
  lists: () => [...assetsKeys.all, 'list'],
  list: (filters) => [...assetsKeys.lists(), filters],
  details: () => [...assetsKeys.all, 'detail'],
  detail: (id) => [...assetsKeys.details(), id],
  statistics: () => [...assetsKeys.all, 'statistics'],
};

export const useAssetss = (params = {}) => {
  return useQuery({
    queryKey: assetsKeys.list(params),
    queryFn: () => assetsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useAssets = (id, options = {}) => {
  return useQuery({
    queryKey: assetsKeys.detail(id),
    queryFn: () => assetsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useAssetsStatistics = () => {
  return useQuery({
    queryKey: assetsKeys.statistics(),
    queryFn: assetsApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateAssets = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: assetsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assetsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetsKeys.statistics() });
      toast({ title: 'Success', description: 'Assets created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create assets' });
    },
  });
};

export const useUpdateAssets = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => assetsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(assetsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: assetsKeys.lists() });
      toast({ title: 'Success', description: 'Assets updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update assets' });
    },
  });
};

export const useDeleteAssets = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: assetsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: assetsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: assetsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetsKeys.statistics() });
      toast({ title: 'Success', description: 'Assets deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete assets' });
    },
  });
};
