import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/api/payments';
import { useToast } from '@/hooks/use-toast';

export const paymentsKeys = {
  all: ['payments'],
  lists: () => [...paymentsKeys.all, 'list'],
  list: (filters) => [...paymentsKeys.lists(), filters],
  details: () => [...paymentsKeys.all, 'detail'],
  detail: (id) => [...paymentsKeys.details(), id],
  statistics: () => [...paymentsKeys.all, 'statistics'],
};

export const usePaymentss = (params = {}) => {
  return useQuery({
    queryKey: paymentsKeys.list(params),
    queryFn: () => paymentsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const usePayments = (id, options = {}) => {
  return useQuery({
    queryKey: paymentsKeys.detail(id),
    queryFn: () => paymentsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const usePaymentsStatistics = () => {
  return useQuery({
    queryKey: paymentsKeys.statistics(),
    queryFn: paymentsApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreatePayments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentsKeys.statistics() });
      toast({ title: 'Success', description: 'Payments created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create payments' });
    },
  });
};

export const useUpdatePayments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => paymentsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(paymentsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: paymentsKeys.lists() });
      toast({ title: 'Success', description: 'Payments updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update payments' });
    },
  });
};

export const useDeletePayments = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: paymentsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: paymentsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: paymentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentsKeys.statistics() });
      toast({ title: 'Success', description: 'Payments deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete payments' });
    },
  });
};
