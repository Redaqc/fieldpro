import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/api/roles';
import { useToast } from '@/hooks/use-toast';

export const rolesKeys = {
  all: ['roles'],
  lists: () => [...rolesKeys.all, 'list'],
  list: (filters) => [...rolesKeys.lists(), filters],
  details: () => [...rolesKeys.all, 'detail'],
  detail: (id) => [...rolesKeys.details(), id],
  statistics: () => [...rolesKeys.all, 'statistics'],
};

export const useRoless = (params = {}) => {
  return useQuery({
    queryKey: rolesKeys.list(params),
    queryFn: () => rolesApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useRoles = (id, options = {}) => {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => rolesApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useRolesStatistics = () => {
  return useQuery({
    queryKey: rolesKeys.statistics(),
    queryFn: rolesApi.getStatistics,
    staleTime: 300000,
  });
};
export const useCreateRoles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.statistics() });
      toast({ title: 'Success', description: 'Roles created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create roles' });
    },
  });
};

export const useUpdateRoles = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => rolesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(rolesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      toast({ title: 'Success', description: 'Roles updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update roles' });
    },
  });
};

export const useDeleteRoles = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: rolesKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.statistics() });
      toast({ title: 'Success', description: 'Roles deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete roles' });
    },
  });
};
