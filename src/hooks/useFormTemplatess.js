import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formTemplatesApi } from '@/api/form-templates';
import { useToast } from '@/hooks/use-toast';

export const formTemplatesKeys = {
  all: ['formTemplates'],
  lists: () => [...formTemplatesKeys.all, 'list'],
  list: (filters) => [...formTemplatesKeys.lists(), filters],
  details: () => [...formTemplatesKeys.all, 'detail'],
  detail: (id) => [...formTemplatesKeys.details(), id],
  statistics: () => [...formTemplatesKeys.all, 'statistics'],
};

export const useFormTemplatess = (params = {}) => {
  return useQuery({
    queryKey: formTemplatesKeys.list(params),
    queryFn: () => formTemplatesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useFormTemplates = (id, options = {}) => {
  return useQuery({
    queryKey: formTemplatesKeys.detail(id),
    queryFn: () => formTemplatesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateFormTemplates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: formTemplatesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: formTemplatesKeys.lists() });
      
      toast({ title: 'Success', description: 'FormTemplates created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create form-templates' });
    },
  });
};

export const useUpdateFormTemplates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => formTemplatesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(formTemplatesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: formTemplatesKeys.lists() });
      toast({ title: 'Success', description: 'FormTemplates updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update form-templates' });
    },
  });
};

export const useDeleteFormTemplates = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: formTemplatesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: formTemplatesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: formTemplatesKeys.lists() });
      
      toast({ title: 'Success', description: 'FormTemplates deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete form-templates' });
    },
  });
};
