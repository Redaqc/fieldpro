import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gpsAlertsApi } from '@/api/gps-alerts';
import { useToast } from '@/hooks/use-toast';

export const gpsAlertsKeys = {
  all: ['gpsAlerts'],
  lists: () => [...gpsAlertsKeys.all, 'list'],
  list: (filters) => [...gpsAlertsKeys.lists(), filters],
  details: () => [...gpsAlertsKeys.all, 'detail'],
  detail: (id) => [...gpsAlertsKeys.details(), id],
  statistics: () => [...gpsAlertsKeys.all, 'statistics'],
};

export const useGpsAlertss = (params = {}) => {
  return useQuery({
    queryKey: gpsAlertsKeys.list(params),
    queryFn: () => gpsAlertsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useGpsAlerts = (id, options = {}) => {
  return useQuery({
    queryKey: gpsAlertsKeys.detail(id),
    queryFn: () => gpsAlertsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateGpsAlerts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: gpsAlertsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gpsAlertsKeys.lists() });
      
      toast({ title: 'Success', description: 'GpsAlerts created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create gps-alerts' });
    },
  });
};

export const useUpdateGpsAlerts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => gpsAlertsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(gpsAlertsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: gpsAlertsKeys.lists() });
      toast({ title: 'Success', description: 'GpsAlerts updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update gps-alerts' });
    },
  });
};

export const useDeleteGpsAlerts = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: gpsAlertsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: gpsAlertsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: gpsAlertsKeys.lists() });
      
      toast({ title: 'Success', description: 'GpsAlerts deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete gps-alerts' });
    },
  });
};
