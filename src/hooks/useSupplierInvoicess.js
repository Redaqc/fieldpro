import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierInvoicesApi } from '@/api/supplier-invoices';
import { useToast } from '@/hooks/use-toast';

export const supplierInvoicesKeys = {
  all: ['supplierInvoices'],
  lists: () => [...supplierInvoicesKeys.all, 'list'],
  list: (filters) => [...supplierInvoicesKeys.lists(), filters],
  details: () => [...supplierInvoicesKeys.all, 'detail'],
  detail: (id) => [...supplierInvoicesKeys.details(), id],
  statistics: () => [...supplierInvoicesKeys.all, 'statistics'],
};

export const useSupplierInvoicess = (params = {}) => {
  return useQuery({
    queryKey: supplierInvoicesKeys.list(params),
    queryFn: () => supplierInvoicesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useSupplierInvoices = (id, options = {}) => {
  return useQuery({
    queryKey: supplierInvoicesKeys.detail(id),
    queryFn: () => supplierInvoicesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useSupplierInvoicesStatistics = () => {
  return useQuery({
    queryKey: supplierInvoicesKeys.statistics(),
    queryFn: supplierInvoicesApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateSupplierInvoices = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: supplierInvoicesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: supplierInvoicesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierInvoicesKeys.statistics() });
      toast({ title: 'Success', description: 'SupplierInvoices created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create supplier-invoices' });
    },
  });
};

export const useUpdateSupplierInvoices = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => supplierInvoicesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(supplierInvoicesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: supplierInvoicesKeys.lists() });
      toast({ title: 'Success', description: 'SupplierInvoices updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update supplier-invoices' });
    },
  });
};

export const useDeleteSupplierInvoices = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: supplierInvoicesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: supplierInvoicesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: supplierInvoicesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierInvoicesKeys.statistics() });
      toast({ title: 'Success', description: 'SupplierInvoices deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete supplier-invoices' });
    },
  });
};
