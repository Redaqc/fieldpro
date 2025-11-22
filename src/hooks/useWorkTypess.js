import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workTypesApi } from '@/api/work-types';
import { useToast } from '@/hooks/use-toast';

export const workTypesKeys = {
  all: ['workTypes'],
  lists: () => [...workTypesKeys.all, 'list'],
  list: (filters) => [...workTypesKeys.lists(), filters],
  details: () => [...workTypesKeys.all, 'detail'],
  detail: (id) => [...workTypesKeys.details(), id],
  statistics: () => [...workTypesKeys.all, 'statistics'],
};

export const useWorkTypess = (params = {}) => {
  return useQuery({
    queryKey: workTypesKeys.list(params),
    queryFn: () => workTypesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useWorkTypes = (id, options = {}) => {
  return useQuery({
    queryKey: workTypesKeys.detail(id),
    queryFn: () => workTypesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateWorkTypes = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: workTypesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workTypesKeys.lists() });
      
      toast({ title: 'Success', description: 'WorkTypes created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create work-types' });
    },
  });
};

export const useUpdateWorkTypes = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => workTypesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(workTypesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: workTypesKeys.lists() });
      toast({ title: 'Success', description: 'WorkTypes updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update work-types' });
    },
  });
};

export const useDeleteWorkTypes = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: workTypesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: workTypesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: workTypesKeys.lists() });
      
      toast({ title: 'Success', description: 'WorkTypes deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete work-types' });
    },
  });
};
