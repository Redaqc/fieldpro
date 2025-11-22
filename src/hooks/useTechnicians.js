import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { techniciansApi } from '@/api/technicians';
import { useToast } from '@/hooks/use-toast';

export const technicianKeys = {
  all: ['technicians'],
  lists: () => [...technicianKeys.all, 'list'],
  list: (filters) => [...technicianKeys.lists(), filters],
  details: () => [...technicianKeys.all, 'detail'],
  detail: (id) => [...technicianKeys.details(), id],
  statistics: () => [...technicianKeys.all, 'statistics'],
  available: (date) => [...technicianKeys.all, 'available', date],
};

export const useTechnicians = (params = {}) => {
  return useQuery({
    queryKey: technicianKeys.list(params),
    queryFn: () => techniciansApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useTechnician = (id, options = {}) => {
  return useQuery({
    queryKey: technicianKeys.detail(id),
    queryFn: () => techniciansApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useTechnicianStatistics = () => {
  return useQuery({
    queryKey: technicianKeys.statistics(),
    queryFn: techniciansApi.getStatistics,
    staleTime: 300000,
  });
};

export const useAvailableTechnicians = (date, options = {}) => {
  return useQuery({
    queryKey: technicianKeys.available(date),
    queryFn: () => techniciansApi.getAvailable(date),
    enabled: !!date && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateTechnician = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: techniciansApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: technicianKeys.lists() });
      queryClient.invalidateQueries({ queryKey: technicianKeys.statistics() });
      toast({ title: 'Success', description: 'Technician created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create technician' });
    },
  });
};

export const useUpdateTechnician = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => techniciansApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(technicianKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: technicianKeys.lists() });
      toast({ title: 'Success', description: 'Technician updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update technician' });
    },
  });
};

export const useDeleteTechnician = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: techniciansApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: technicianKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: technicianKeys.lists() });
      queryClient.invalidateQueries({ queryKey: technicianKeys.statistics() });
      toast({ title: 'Success', description: 'Technician deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete technician' });
    },
  });
};
