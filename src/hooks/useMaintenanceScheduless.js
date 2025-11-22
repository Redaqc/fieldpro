import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceSchedulesApi } from '@/api/maintenance-schedules';
import { useToast } from '@/hooks/use-toast';

export const maintenanceSchedulesKeys = {
  all: ['maintenanceSchedules'],
  lists: () => [...maintenanceSchedulesKeys.all, 'list'],
  list: (filters) => [...maintenanceSchedulesKeys.lists(), filters],
  details: () => [...maintenanceSchedulesKeys.all, 'detail'],
  detail: (id) => [...maintenanceSchedulesKeys.details(), id],
  statistics: () => [...maintenanceSchedulesKeys.all, 'statistics'],
};

export const useMaintenanceScheduless = (params = {}) => {
  return useQuery({
    queryKey: maintenanceSchedulesKeys.list(params),
    queryFn: () => maintenanceSchedulesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useMaintenanceSchedules = (id, options = {}) => {
  return useQuery({
    queryKey: maintenanceSchedulesKeys.detail(id),
    queryFn: () => maintenanceSchedulesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useMaintenanceSchedulesStatistics = () => {
  return useQuery({
    queryKey: maintenanceSchedulesKeys.statistics(),
    queryFn: maintenanceSchedulesApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateMaintenanceSchedules = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: maintenanceSchedulesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: maintenanceSchedulesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceSchedulesKeys.statistics() });
      toast({ title: 'Success', description: 'MaintenanceSchedules created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create maintenance-schedules' });
    },
  });
};

export const useUpdateMaintenanceSchedules = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => maintenanceSchedulesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(maintenanceSchedulesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: maintenanceSchedulesKeys.lists() });
      toast({ title: 'Success', description: 'MaintenanceSchedules updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update maintenance-schedules' });
    },
  });
};

export const useDeleteMaintenanceSchedules = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: maintenanceSchedulesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: maintenanceSchedulesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: maintenanceSchedulesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceSchedulesKeys.statistics() });
      toast({ title: 'Success', description: 'MaintenanceSchedules deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete maintenance-schedules' });
    },
  });
};
