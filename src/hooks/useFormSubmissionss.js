import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formSubmissionsApi } from '@/api/form-submissions';
import { useToast } from '@/hooks/use-toast';

export const formSubmissionsKeys = {
  all: ['formSubmissions'],
  lists: () => [...formSubmissionsKeys.all, 'list'],
  list: (filters) => [...formSubmissionsKeys.lists(), filters],
  details: () => [...formSubmissionsKeys.all, 'detail'],
  detail: (id) => [...formSubmissionsKeys.details(), id],
  statistics: () => [...formSubmissionsKeys.all, 'statistics'],
};

export const useFormSubmissionss = (params = {}) => {
  return useQuery({
    queryKey: formSubmissionsKeys.list(params),
    queryFn: () => formSubmissionsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useFormSubmissions = (id, options = {}) => {
  return useQuery({
    queryKey: formSubmissionsKeys.detail(id),
    queryFn: () => formSubmissionsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateFormSubmissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: formSubmissionsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: formSubmissionsKeys.lists() });
      
      toast({ title: 'Success', description: 'FormSubmissions created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create form-submissions' });
    },
  });
};

export const useUpdateFormSubmissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => formSubmissionsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(formSubmissionsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: formSubmissionsKeys.lists() });
      toast({ title: 'Success', description: 'FormSubmissions updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update form-submissions' });
    },
  });
};

export const useDeleteFormSubmissions = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: formSubmissionsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: formSubmissionsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: formSubmissionsKeys.lists() });
      
      toast({ title: 'Success', description: 'FormSubmissions deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete form-submissions' });
    },
  });
};
