import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerFeedbackApi } from '@/api/customer-feedback';
import { useToast } from '@/hooks/use-toast';

export const customerFeedbackKeys = {
  all: ['customerFeedback'],
  lists: () => [...customerFeedbackKeys.all, 'list'],
  list: (filters) => [...customerFeedbackKeys.lists(), filters],
  details: () => [...customerFeedbackKeys.all, 'detail'],
  detail: (id) => [...customerFeedbackKeys.details(), id],
  statistics: () => [...customerFeedbackKeys.all, 'statistics'],
};

export const useCustomerFeedbacks = (params = {}) => {
  return useQuery({
    queryKey: customerFeedbackKeys.list(params),
    queryFn: () => customerFeedbackApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useCustomerFeedback = (id, options = {}) => {
  return useQuery({
    queryKey: customerFeedbackKeys.detail(id),
    queryFn: () => customerFeedbackApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateCustomerFeedback = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: customerFeedbackApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customerFeedbackKeys.lists() });
      
      toast({ title: 'Success', description: 'CustomerFeedback created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create customer-feedback' });
    },
  });
};

export const useUpdateCustomerFeedback = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => customerFeedbackApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(customerFeedbackKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerFeedbackKeys.lists() });
      toast({ title: 'Success', description: 'CustomerFeedback updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update customer-feedback' });
    },
  });
};

export const useDeleteCustomerFeedback = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: customerFeedbackApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: customerFeedbackKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: customerFeedbackKeys.lists() });
      
      toast({ title: 'Success', description: 'CustomerFeedback deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete customer-feedback' });
    },
  });
};
