import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandingSettingsApi } from '@/api/branding-settings';
import { useToast } from '@/hooks/use-toast';

export const brandingSettingsKeys = {
  all: ['brandingSettings'],
  lists: () => [...brandingSettingsKeys.all, 'list'],
  list: (filters) => [...brandingSettingsKeys.lists(), filters],
  details: () => [...brandingSettingsKeys.all, 'detail'],
  detail: (id) => [...brandingSettingsKeys.details(), id],
  statistics: () => [...brandingSettingsKeys.all, 'statistics'],
};

export const useBrandingSettingss = (params = {}) => {
  return useQuery({
    queryKey: brandingSettingsKeys.list(params),
    queryFn: () => brandingSettingsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useBrandingSettings = (id, options = {}) => {
  return useQuery({
    queryKey: brandingSettingsKeys.detail(id),
    queryFn: () => brandingSettingsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateBrandingSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: brandingSettingsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandingSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'BrandingSettings created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create branding-settings' });
    },
  });
};

export const useUpdateBrandingSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => brandingSettingsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(brandingSettingsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: brandingSettingsKeys.lists() });
      toast({ title: 'Success', description: 'BrandingSettings updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update branding-settings' });
    },
  });
};

export const useDeleteBrandingSettings = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: brandingSettingsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: brandingSettingsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: brandingSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'BrandingSettings deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete branding-settings' });
    },
  });
};
