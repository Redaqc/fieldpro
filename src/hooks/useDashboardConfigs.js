import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardConfigApi } from '@/api/dashboard-config';
import { useToast } from '@/hooks/use-toast';

export const dashboardConfigKeys = {
  all: ['dashboardConfig'],
  lists: () => [...dashboardConfigKeys.all, 'list'],
  list: (filters) => [...dashboardConfigKeys.lists(), filters],
  details: () => [...dashboardConfigKeys.all, 'detail'],
  detail: (id) => [...dashboardConfigKeys.details(), id],
  statistics: () => [...dashboardConfigKeys.all, 'statistics'],
};

export const useDashboardConfigs = (params = {}) => {
  return useQuery({
    queryKey: dashboardConfigKeys.list(params),
    queryFn: () => dashboardConfigApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useDashboardConfig = (id, options = {}) => {
  return useQuery({
    queryKey: dashboardConfigKeys.detail(id),
    queryFn: () => dashboardConfigApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateDashboardConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: dashboardConfigApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dashboardConfigKeys.lists() });
      
      toast({ title: 'Success', description: 'DashboardConfig created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create dashboard-config' });
    },
  });
};

export const useUpdateDashboardConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => dashboardConfigApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(dashboardConfigKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: dashboardConfigKeys.lists() });
      toast({ title: 'Success', description: 'DashboardConfig updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update dashboard-config' });
    },
  });
};

export const useDeleteDashboardConfig = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: dashboardConfigApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: dashboardConfigKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: dashboardConfigKeys.lists() });
      
      toast({ title: 'Success', description: 'DashboardConfig deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete dashboard-config' });
    },
  });
};
