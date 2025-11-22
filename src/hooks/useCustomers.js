import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/api/customers';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const customerKeys = {
  all: ['customers'],
  lists: () => [...customerKeys.all, 'list'],
  list: (filters) => [...customerKeys.lists(), filters],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
  statistics: () => [...customerKeys.all, 'statistics'],
};

/**
 * Hook to get all customers with pagination
 */
export const useCustomers = (params = {}) => {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get single customer by ID
 */
export const useCustomer = (id, options = {}) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook to get customer statistics
 */
export const useCustomerStatistics = () => {
  return useQuery({
    queryKey: customerKeys.statistics(),
    queryFn: customersApi.getStatistics,
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Hook to create new customer
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: (newCustomer) => {
      // Invalidate customers list to refetch
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.statistics() });

      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });

      return newCustomer;
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create customer',
      });
    },
  });
};

/**
 * Hook to update existing customer
 */
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: (updatedCustomer) => {
      // Update customer in cache
      queryClient.setQueryData(
        customerKeys.detail(updatedCustomer.id),
        updatedCustomer
      );

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });

      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });

      return updatedCustomer;
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update customer',
      });
    },
  });
};

/**
 * Hook to delete customer
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: customersApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: customerKeys.detail(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.statistics() });

      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete customer',
      });
    },
  });
};

/**
 * Hook to search customers
 */
export const useSearchCustomers = (query, options = {}) => {
  return useQuery({
    queryKey: [...customerKeys.lists(), 'search', query],
    queryFn: () => customersApi.search(query),
    enabled: query?.length >= 2 && (options.enabled !== false),
    staleTime: 30000,
  });
};
