import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '@/api/quotations';
import { useToast } from '@/hooks/use-toast';

export const quotationsKeys = {
  all: ['quotations'],
  lists: () => [...quotationsKeys.all, 'list'],
  list: (filters) => [...quotationsKeys.lists(), filters],
  details: () => [...quotationsKeys.all, 'detail'],
  detail: (id) => [...quotationsKeys.details(), id],
  statistics: () => [...quotationsKeys.all, 'statistics'],
};

export const useQuotationss = (params = {}) => {
  return useQuery({
    queryKey: quotationsKeys.list(params),
    queryFn: () => quotationsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useQuotations = (id, options = {}) => {
  return useQuery({
    queryKey: quotationsKeys.detail(id),
    queryFn: () => quotationsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useQuotationsStatistics = () => {
  return useQuery({
    queryKey: quotationsKeys.statistics(),
    queryFn: quotationsApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateQuotations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: quotationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quotationsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quotationsKeys.statistics() });
      toast({ title: 'Success', description: 'Quotations created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create quotations' });
    },
  });
};

export const useUpdateQuotations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => quotationsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(quotationsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: quotationsKeys.lists() });
      toast({ title: 'Success', description: 'Quotations updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update quotations' });
    },
  });
};

export const useDeleteQuotations = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: quotationsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: quotationsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: quotationsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quotationsKeys.statistics() });
      toast({ title: 'Success', description: 'Quotations deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete quotations' });
    },
  });
};
