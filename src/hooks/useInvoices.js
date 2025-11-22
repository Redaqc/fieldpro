import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/api/invoices';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const invoiceKeys = {
  all: ['invoices'],
  lists: () => [...invoiceKeys.all, 'list'],
  list: (filters) => [...invoiceKeys.lists(), filters],
  details: () => [...invoiceKeys.all, 'detail'],
  detail: (id) => [...invoiceKeys.details(), id],
  statistics: (filters) => [...invoiceKeys.all, 'statistics', filters],
};

/**
 * Hook to get all invoices
 */
export const useInvoices = (params = {}) => {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoicesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

/**
 * Hook to get single invoice
 */
export const useInvoice = (id, options = {}) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 30000,
  });
};

/**
 * Hook to get invoice statistics
 */
export const useInvoiceStatistics = (filters = {}) => {
  return useQuery({
    queryKey: invoiceKeys.statistics(filters),
    queryFn: () => invoicesApi.getStatistics(filters),
    staleTime: 300000,
  });
};

/**
 * Hook to create invoice
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.statistics({}) });

      toast({
        title: 'Success',
        description: `Invoice ${newInvoice.invoiceNumber} created successfully`,
      });

      return newInvoice;
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create invoice',
      });
    },
  });
};

/**
 * Hook to update invoice
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => invoicesApi.update(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(invoiceKeys.detail(updatedInvoice.id), updatedInvoice);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });

      return updatedInvoice;
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update invoice',
      });
    },
  });
};

/**
 * Hook to delete invoice
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: invoicesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.statistics({}) });

      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete invoice',
      });
    },
  });
};
