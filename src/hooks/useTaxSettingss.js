import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxSettingsApi } from '@/api/tax-settings';
import { useToast } from '@/hooks/use-toast';

export const taxSettingsKeys = {
  all: ['taxSettings'],
  lists: () => [...taxSettingsKeys.all, 'list'],
  list: (filters) => [...taxSettingsKeys.lists(), filters],
  details: () => [...taxSettingsKeys.all, 'detail'],
  detail: (id) => [...taxSettingsKeys.details(), id],
  statistics: () => [...taxSettingsKeys.all, 'statistics'],
};

export const useTaxSettingss = (params = {}) => {
  return useQuery({
    queryKey: taxSettingsKeys.list(params),
    queryFn: () => taxSettingsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useTaxSettings = (id, options = {}) => {
  return useQuery({
    queryKey: taxSettingsKeys.detail(id),
    queryFn: () => taxSettingsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateTaxSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: taxSettingsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taxSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'TaxSettings created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create tax-settings' });
    },
  });
};

export const useUpdateTaxSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => taxSettingsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(taxSettingsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: taxSettingsKeys.lists() });
      toast({ title: 'Success', description: 'TaxSettings updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update tax-settings' });
    },
  });
};

export const useDeleteTaxSettings = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: taxSettingsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: taxSettingsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: taxSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'TaxSettings deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete tax-settings' });
    },
  });
};
