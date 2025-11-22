import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationSettingsApi } from '@/api/integration-settings';
import { useToast } from '@/hooks/use-toast';

export const integrationSettingsKeys = {
  all: ['integrationSettings'],
  lists: () => [...integrationSettingsKeys.all, 'list'],
  list: (filters) => [...integrationSettingsKeys.lists(), filters],
  details: () => [...integrationSettingsKeys.all, 'detail'],
  detail: (id) => [...integrationSettingsKeys.details(), id],
  statistics: () => [...integrationSettingsKeys.all, 'statistics'],
};

export const useIntegrationSettingss = (params = {}) => {
  return useQuery({
    queryKey: integrationSettingsKeys.list(params),
    queryFn: () => integrationSettingsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useIntegrationSettings = (id, options = {}) => {
  return useQuery({
    queryKey: integrationSettingsKeys.detail(id),
    queryFn: () => integrationSettingsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateIntegrationSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: integrationSettingsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: integrationSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'IntegrationSettings created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create integration-settings' });
    },
  });
};

export const useUpdateIntegrationSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => integrationSettingsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(integrationSettingsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: integrationSettingsKeys.lists() });
      toast({ title: 'Success', description: 'IntegrationSettings updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update integration-settings' });
    },
  });
};

export const useDeleteIntegrationSettings = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: integrationSettingsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: integrationSettingsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: integrationSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'IntegrationSettings deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete integration-settings' });
    },
  });
};
