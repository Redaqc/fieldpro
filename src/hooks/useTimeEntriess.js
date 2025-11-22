import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '@/api/time-entries';
import { useToast } from '@/hooks/use-toast';

export const timeEntriesKeys = {
  all: ['timeEntries'],
  lists: () => [...timeEntriesKeys.all, 'list'],
  list: (filters) => [...timeEntriesKeys.lists(), filters],
  details: () => [...timeEntriesKeys.all, 'detail'],
  detail: (id) => [...timeEntriesKeys.details(), id],
  statistics: () => [...timeEntriesKeys.all, 'statistics'],
};

export const useTimeEntriess = (params = {}) => {
  return useQuery({
    queryKey: timeEntriesKeys.list(params),
    queryFn: () => timeEntriesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useTimeEntries = (id, options = {}) => {
  return useQuery({
    queryKey: timeEntriesKeys.detail(id),
    queryFn: () => timeEntriesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useTimeEntriesStatistics = () => {
  return useQuery({
    queryKey: timeEntriesKeys.statistics(),
    queryFn: timeEntriesApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateTimeEntries = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: timeEntriesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: timeEntriesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeEntriesKeys.statistics() });
      toast({ title: 'Success', description: 'TimeEntries created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create time-entries' });
    },
  });
};

export const useUpdateTimeEntries = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => timeEntriesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(timeEntriesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: timeEntriesKeys.lists() });
      toast({ title: 'Success', description: 'TimeEntries updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update time-entries' });
    },
  });
};

export const useDeleteTimeEntries = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: timeEntriesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: timeEntriesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: timeEntriesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeEntriesKeys.statistics() });
      toast({ title: 'Success', description: 'TimeEntries deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete time-entries' });
    },
  });
};
