import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationsApi } from '@/api/automations';
import { useToast } from '@/hooks/use-toast';

export const automationsKeys = {
  all: ['automations'],
  lists: () => [...automationsKeys.all, 'list'],
  list: (filters) => [...automationsKeys.lists(), filters],
  details: () => [...automationsKeys.all, 'detail'],
  detail: (id) => [...automationsKeys.details(), id],
  statistics: () => [...automationsKeys.all, 'statistics'],
};

export const useAutomationss = (params = {}) => {
  return useQuery({
    queryKey: automationsKeys.list(params),
    queryFn: () => automationsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useAutomations = (id, options = {}) => {
  return useQuery({
    queryKey: automationsKeys.detail(id),
    queryFn: () => automationsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateAutomations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: automationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: automationsKeys.lists() });
      
      toast({ title: 'Success', description: 'Automations created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create automations' });
    },
  });
};

export const useUpdateAutomations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => automationsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(automationsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: automationsKeys.lists() });
      toast({ title: 'Success', description: 'Automations updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update automations' });
    },
  });
};

export const useDeleteAutomations = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: automationsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: automationsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: automationsKeys.lists() });
      
      toast({ title: 'Success', description: 'Automations deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete automations' });
    },
  });
};
