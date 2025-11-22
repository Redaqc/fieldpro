import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringJobsApi } from '@/api/recurring-jobs';
import { useToast } from '@/hooks/use-toast';

export const recurringJobsKeys = {
  all: ['recurringJobs'],
  lists: () => [...recurringJobsKeys.all, 'list'],
  list: (filters) => [...recurringJobsKeys.lists(), filters],
  details: () => [...recurringJobsKeys.all, 'detail'],
  detail: (id) => [...recurringJobsKeys.details(), id],
  statistics: () => [...recurringJobsKeys.all, 'statistics'],
};

export const useRecurringJobss = (params = {}) => {
  return useQuery({
    queryKey: recurringJobsKeys.list(params),
    queryFn: () => recurringJobsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useRecurringJobs = (id, options = {}) => {
  return useQuery({
    queryKey: recurringJobsKeys.detail(id),
    queryFn: () => recurringJobsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useRecurringJobsStatistics = () => {
  return useQuery({
    queryKey: recurringJobsKeys.statistics(),
    queryFn: recurringJobsApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateRecurringJobs = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: recurringJobsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: recurringJobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringJobsKeys.statistics() });
      toast({ title: 'Success', description: 'RecurringJobs created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create recurring-jobs' });
    },
  });
};

export const useUpdateRecurringJobs = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => recurringJobsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(recurringJobsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: recurringJobsKeys.lists() });
      toast({ title: 'Success', description: 'RecurringJobs updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update recurring-jobs' });
    },
  });
};

export const useDeleteRecurringJobs = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: recurringJobsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: recurringJobsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: recurringJobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recurringJobsKeys.statistics() });
      toast({ title: 'Success', description: 'RecurringJobs deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete recurring-jobs' });
    },
  });
};
