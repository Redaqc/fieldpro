import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gpsZonesApi } from '@/api/gps-zones';
import { useToast } from '@/hooks/use-toast';

export const gpsZonesKeys = {
  all: ['gpsZones'],
  lists: () => [...gpsZonesKeys.all, 'list'],
  list: (filters) => [...gpsZonesKeys.lists(), filters],
  details: () => [...gpsZonesKeys.all, 'detail'],
  detail: (id) => [...gpsZonesKeys.details(), id],
  statistics: () => [...gpsZonesKeys.all, 'statistics'],
};

export const useGpsZoness = (params = {}) => {
  return useQuery({
    queryKey: gpsZonesKeys.list(params),
    queryFn: () => gpsZonesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useGpsZones = (id, options = {}) => {
  return useQuery({
    queryKey: gpsZonesKeys.detail(id),
    queryFn: () => gpsZonesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateGpsZones = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: gpsZonesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gpsZonesKeys.lists() });
      
      toast({ title: 'Success', description: 'GpsZones created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create gps-zones' });
    },
  });
};

export const useUpdateGpsZones = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => gpsZonesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(gpsZonesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: gpsZonesKeys.lists() });
      toast({ title: 'Success', description: 'GpsZones updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update gps-zones' });
    },
  });
};

export const useDeleteGpsZones = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: gpsZonesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: gpsZonesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: gpsZonesKeys.lists() });
      
      toast({ title: 'Success', description: 'GpsZones deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete gps-zones' });
    },
  });
};
