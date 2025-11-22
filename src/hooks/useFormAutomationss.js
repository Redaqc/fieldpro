import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formAutomationsApi } from '@/api/form-automations';
import { useToast } from '@/hooks/use-toast';

export const formAutomationsKeys = {
  all: ['formAutomations'],
  lists: () => [...formAutomationsKeys.all, 'list'],
  list: (filters) => [...formAutomationsKeys.lists(), filters],
  details: () => [...formAutomationsKeys.all, 'detail'],
  detail: (id) => [...formAutomationsKeys.details(), id],
  statistics: () => [...formAutomationsKeys.all, 'statistics'],
};

export const useFormAutomationss = (params = {}) => {
  return useQuery({
    queryKey: formAutomationsKeys.list(params),
    queryFn: () => formAutomationsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useFormAutomations = (id, options = {}) => {
  return useQuery({
    queryKey: formAutomationsKeys.detail(id),
    queryFn: () => formAutomationsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateFormAutomations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: formAutomationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: formAutomationsKeys.lists() });
      
      toast({ title: 'Success', description: 'FormAutomations created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create form-automations' });
    },
  });
};

export const useUpdateFormAutomations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => formAutomationsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(formAutomationsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: formAutomationsKeys.lists() });
      toast({ title: 'Success', description: 'FormAutomations updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update form-automations' });
    },
  });
};

export const useDeleteFormAutomations = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: formAutomationsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: formAutomationsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: formAutomationsKeys.lists() });
      
      toast({ title: 'Success', description: 'FormAutomations deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete form-automations' });
    },
  });
};
