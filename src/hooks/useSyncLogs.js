import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syncLogApi } from '@/api/sync-log';
import { useToast } from '@/hooks/use-toast';

export const syncLogKeys = {
  all: ['syncLog'],
  lists: () => [...syncLogKeys.all, 'list'],
  list: (filters) => [...syncLogKeys.lists(), filters],
  details: () => [...syncLogKeys.all, 'detail'],
  detail: (id) => [...syncLogKeys.details(), id],
  statistics: () => [...syncLogKeys.all, 'statistics'],
};

export const useSyncLogs = (params = {}) => {
  return useQuery({
    queryKey: syncLogKeys.list(params),
    queryFn: () => syncLogApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useSyncLog = (id, options = {}) => {
  return useQuery({
    queryKey: syncLogKeys.detail(id),
    queryFn: () => syncLogApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useSyncLogStatistics = () => {
  return useQuery({
    queryKey: syncLogKeys.statistics(),
    queryFn: syncLogApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateSyncLog = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: syncLogApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: syncLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: syncLogKeys.statistics() });
      toast({ title: 'Success', description: 'SyncLog created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create sync-log' });
    },
  });
};

export const useUpdateSyncLog = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => syncLogApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(syncLogKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: syncLogKeys.lists() });
      toast({ title: 'Success', description: 'SyncLog updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update sync-log' });
    },
  });
};

export const useDeleteSyncLog = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: syncLogApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: syncLogKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: syncLogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: syncLogKeys.statistics() });
      toast({ title: 'Success', description: 'SyncLog deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete sync-log' });
    },
  });
};
