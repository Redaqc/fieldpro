import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profitabilityRecordsApi } from '@/api/profitability-records';
import { useToast } from '@/hooks/use-toast';

export const profitabilityRecordsKeys = {
  all: ['profitabilityRecords'],
  lists: () => [...profitabilityRecordsKeys.all, 'list'],
  list: (filters) => [...profitabilityRecordsKeys.lists(), filters],
  details: () => [...profitabilityRecordsKeys.all, 'detail'],
  detail: (id) => [...profitabilityRecordsKeys.details(), id],
  statistics: () => [...profitabilityRecordsKeys.all, 'statistics'],
};

export const useProfitabilityRecordss = (params = {}) => {
  return useQuery({
    queryKey: profitabilityRecordsKeys.list(params),
    queryFn: () => profitabilityRecordsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useProfitabilityRecords = (id, options = {}) => {
  return useQuery({
    queryKey: profitabilityRecordsKeys.detail(id),
    queryFn: () => profitabilityRecordsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useProfitabilityRecordsStatistics = () => {
  return useQuery({
    queryKey: profitabilityRecordsKeys.statistics(),
    queryFn: profitabilityRecordsApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateProfitabilityRecords = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: profitabilityRecordsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profitabilityRecordsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profitabilityRecordsKeys.statistics() });
      toast({ title: 'Success', description: 'ProfitabilityRecords created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create profitability-records' });
    },
  });
};

export const useUpdateProfitabilityRecords = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => profitabilityRecordsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(profitabilityRecordsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: profitabilityRecordsKeys.lists() });
      toast({ title: 'Success', description: 'ProfitabilityRecords updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update profitability-records' });
    },
  });
};

export const useDeleteProfitabilityRecords = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: profitabilityRecordsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: profitabilityRecordsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: profitabilityRecordsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profitabilityRecordsKeys.statistics() });
      toast({ title: 'Success', description: 'ProfitabilityRecords deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete profitability-records' });
    },
  });
};
