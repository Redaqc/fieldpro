import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceCallsApi } from '@/api/service-calls';
import { useToast } from '@/hooks/use-toast';

export const serviceCallKeys = {
  all: ['serviceCalls'],
  lists: () => [...serviceCallKeys.all, 'list'],
  list: (filters) => [...serviceCallKeys.lists(), filters],
  details: () => [...serviceCallKeys.all, 'detail'],
  detail: (id) => [...serviceCallKeys.details(), id],
  statistics: () => [...serviceCallKeys.all, 'statistics'],
};

export const useServiceCalls = (params = {}) => {
  return useQuery({
    queryKey: serviceCallKeys.list(params),
    queryFn: () => serviceCallsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useServiceCall = (id, options = {}) => {
  return useQuery({
    queryKey: serviceCallKeys.detail(id),
    queryFn: () => serviceCallsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 30000,
  });
};

export const useServiceCallStatistics = () => {
  return useQuery({
    queryKey: serviceCallKeys.statistics(),
    queryFn: serviceCallsApi.getStatistics,
    staleTime: 300000,
  });
};

export const useCreateServiceCall = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: serviceCallsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceCallKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceCallKeys.statistics() });
      toast({ title: 'Success', description: 'Service call created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create service call' });
    },
  });
};

export const useUpdateServiceCall = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => serviceCallsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(serviceCallKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: serviceCallKeys.lists() });
      toast({ title: 'Success', description: 'Service call updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update service call' });
    },
  });
};

export const useDeleteServiceCall = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: serviceCallsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: serviceCallKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: serviceCallKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceCallKeys.statistics() });
      toast({ title: 'Success', description: 'Service call deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete service call' });
    },
  });
};

export const useUpdateServiceCallStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }) => serviceCallsApi.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.setQueryData(serviceCallKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: serviceCallKeys.lists() });
      toast({ title: 'Success', description: `Service call status updated to ${data.status}` });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update status' });
    },
  });
};
