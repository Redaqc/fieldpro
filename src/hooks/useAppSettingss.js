import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appSettingsApi } from '@/api/app-settings';
import { useToast } from '@/hooks/use-toast';

export const appSettingsKeys = {
  all: ['appSettings'],
  lists: () => [...appSettingsKeys.all, 'list'],
  list: (filters) => [...appSettingsKeys.lists(), filters],
  details: () => [...appSettingsKeys.all, 'detail'],
  detail: (id) => [...appSettingsKeys.details(), id],
  statistics: () => [...appSettingsKeys.all, 'statistics'],
};

export const useAppSettingss = (params = {}) => {
  return useQuery({
    queryKey: appSettingsKeys.list(params),
    queryFn: () => appSettingsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useAppSettings = (id, options = {}) => {
  return useQuery({
    queryKey: appSettingsKeys.detail(id),
    queryFn: () => appSettingsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateAppSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: appSettingsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'AppSettings created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create app-settings' });
    },
  });
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => appSettingsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(appSettingsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: appSettingsKeys.lists() });
      toast({ title: 'Success', description: 'AppSettings updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update app-settings' });
    },
  });
};

export const useDeleteAppSettings = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: appSettingsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: appSettingsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: appSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'AppSettings deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete app-settings' });
    },
  });
};
