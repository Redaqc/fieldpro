import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamMessageApi } from '@/api/team-message';
import { useToast } from '@/hooks/use-toast';

export const teamMessageKeys = {
  all: ['teamMessage'],
  lists: () => [...teamMessageKeys.all, 'list'],
  list: (filters) => [...teamMessageKeys.lists(), filters],
  details: () => [...teamMessageKeys.all, 'detail'],
  detail: (id) => [...teamMessageKeys.details(), id],
  statistics: () => [...teamMessageKeys.all, 'statistics'],
};

export const useTeamMessages = (params = {}) => {
  return useQuery({
    queryKey: teamMessageKeys.list(params),
    queryFn: () => teamMessageApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useTeamMessage = (id, options = {}) => {
  return useQuery({
    queryKey: teamMessageKeys.detail(id),
    queryFn: () => teamMessageApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateTeamMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: teamMessageApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamMessageKeys.lists() });
      
      toast({ title: 'Success', description: 'TeamMessage created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create team-message' });
    },
  });
};

export const useUpdateTeamMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => teamMessageApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(teamMessageKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: teamMessageKeys.lists() });
      toast({ title: 'Success', description: 'TeamMessage updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update team-message' });
    },
  });
};

export const useDeleteTeamMessage = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: teamMessageApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: teamMessageKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: teamMessageKeys.lists() });
      
      toast({ title: 'Success', description: 'TeamMessage deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete team-message' });
    },
  });
};
