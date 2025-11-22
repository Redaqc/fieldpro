import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/api/materials';
import { useToast } from '@/hooks/use-toast';

export const materialsKeys = {
  all: ['materials'],
  lists: () => [...materialsKeys.all, 'list'],
  list: (filters) => [...materialsKeys.lists(), filters],
  details: () => [...materialsKeys.all, 'detail'],
  detail: (id) => [...materialsKeys.details(), id],
  statistics: () => [...materialsKeys.all, 'statistics'],
};

export const useMaterialss = (params = {}) => {
  return useQuery({
    queryKey: materialsKeys.list(params),
    queryFn: () => materialsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useMaterials = (id, options = {}) => {
  return useQuery({
    queryKey: materialsKeys.detail(id),
    queryFn: () => materialsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useMaterialsStatistics = () => {
  return useQuery({
    queryKey: materialsKeys.statistics(),
    queryFn: materialsApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateMaterials = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: materialsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: materialsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialsKeys.statistics() });
      toast({ title: 'Success', description: 'Materials created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create materials' });
    },
  });
};

export const useUpdateMaterials = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => materialsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(materialsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: materialsKeys.lists() });
      toast({ title: 'Success', description: 'Materials updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update materials' });
    },
  });
};

export const useDeleteMaterials = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: materialsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: materialsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: materialsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: materialsKeys.statistics() });
      toast({ title: 'Success', description: 'Materials deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete materials' });
    },
  });
};
