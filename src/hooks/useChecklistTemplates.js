import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistTemplateApi } from '@/api/checklist-template';
import { useToast } from '@/hooks/use-toast';

export const checklistTemplateKeys = {
  all: ['checklistTemplate'],
  lists: () => [...checklistTemplateKeys.all, 'list'],
  list: (filters) => [...checklistTemplateKeys.lists(), filters],
  details: () => [...checklistTemplateKeys.all, 'detail'],
  detail: (id) => [...checklistTemplateKeys.details(), id],
  statistics: () => [...checklistTemplateKeys.all, 'statistics'],
};

export const useChecklistTemplates = (params = {}) => {
  return useQuery({
    queryKey: checklistTemplateKeys.list(params),
    queryFn: () => checklistTemplateApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useChecklistTemplate = (id, options = {}) => {
  return useQuery({
    queryKey: checklistTemplateKeys.detail(id),
    queryFn: () => checklistTemplateApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateChecklistTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: checklistTemplateApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.lists() });
      
      toast({ title: 'Success', description: 'ChecklistTemplate created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create checklist-template' });
    },
  });
};

export const useUpdateChecklistTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => checklistTemplateApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(checklistTemplateKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.lists() });
      toast({ title: 'Success', description: 'ChecklistTemplate updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update checklist-template' });
    },
  });
};

export const useDeleteChecklistTemplate = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: checklistTemplateApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: checklistTemplateKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.lists() });
      
      toast({ title: 'Success', description: 'ChecklistTemplate deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete checklist-template' });
    },
  });
};
