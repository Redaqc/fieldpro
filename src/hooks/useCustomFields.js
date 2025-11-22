import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFieldApi } from '@/api/custom-field';
import { useToast } from '@/hooks/use-toast';

export const customFieldKeys = {
  all: ['customField'],
  lists: () => [...customFieldKeys.all, 'list'],
  list: (filters) => [...customFieldKeys.lists(), filters],
  details: () => [...customFieldKeys.all, 'detail'],
  detail: (id) => [...customFieldKeys.details(), id],
  statistics: () => [...customFieldKeys.all, 'statistics'],
};

export const useCustomFields = (params = {}) => {
  return useQuery({
    queryKey: customFieldKeys.list(params),
    queryFn: () => customFieldApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useCustomField = (id, options = {}) => {
  return useQuery({
    queryKey: customFieldKeys.detail(id),
    queryFn: () => customFieldApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateCustomField = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: customFieldApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.lists() });
      
      toast({ title: 'Success', description: 'CustomField created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create custom-field' });
    },
  });
};

export const useUpdateCustomField = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => customFieldApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customFieldKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customFieldKeys.lists() });
      toast({ title: 'Success', description: 'CustomField updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update custom-field' });
    },
  });
};

export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: customFieldApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: customFieldKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: customFieldKeys.lists() });
      
      toast({ title: 'Success', description: 'CustomField deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete custom-field' });
    },
  });
};
