import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gpsTrackingApi } from '@/api/gps-tracking';
import { useToast } from '@/hooks/use-toast';

export const gpsTrackingKeys = {
  all: ['gpsTracking'],
  lists: () => [...gpsTrackingKeys.all, 'list'],
  list: (filters) => [...gpsTrackingKeys.lists(), filters],
  details: () => [...gpsTrackingKeys.all, 'detail'],
  detail: (id) => [...gpsTrackingKeys.details(), id],
  statistics: () => [...gpsTrackingKeys.all, 'statistics'],
};

export const useGpsTrackings = (params = {}) => {
  return useQuery({
    queryKey: gpsTrackingKeys.list(params),
    queryFn: () => gpsTrackingApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useGpsTracking = (id, options = {}) => {
  return useQuery({
    queryKey: gpsTrackingKeys.detail(id),
    queryFn: () => gpsTrackingApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateGpsTracking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: gpsTrackingApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gpsTrackingKeys.lists() });
      
      toast({ title: 'Success', description: 'GpsTracking created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create gps-tracking' });
    },
  });
};

export const useUpdateGpsTracking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => gpsTrackingApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(gpsTrackingKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: gpsTrackingKeys.lists() });
      toast({ title: 'Success', description: 'GpsTracking updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update gps-tracking' });
    },
  });
};

export const useDeleteGpsTracking = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: gpsTrackingApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: gpsTrackingKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: gpsTrackingKeys.lists() });
      
      toast({ title: 'Success', description: 'GpsTracking deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete gps-tracking' });
    },
  });
};
