import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { languageSettingsApi } from '@/api/language-settings';
import { useToast } from '@/hooks/use-toast';

export const languageSettingsKeys = {
  all: ['languageSettings'],
  lists: () => [...languageSettingsKeys.all, 'list'],
  list: (filters) => [...languageSettingsKeys.lists(), filters],
  details: () => [...languageSettingsKeys.all, 'detail'],
  detail: (id) => [...languageSettingsKeys.details(), id],
  statistics: () => [...languageSettingsKeys.all, 'statistics'],
};

export const useLanguageSettingss = (params = {}) => {
  return useQuery({
    queryKey: languageSettingsKeys.list(params),
    queryFn: () => languageSettingsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useLanguageSettings = (id, options = {}) => {
  return useQuery({
    queryKey: languageSettingsKeys.detail(id),
    queryFn: () => languageSettingsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateLanguageSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: languageSettingsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: languageSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'LanguageSettings created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create language-settings' });
    },
  });
};

export const useUpdateLanguageSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => languageSettingsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(languageSettingsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: languageSettingsKeys.lists() });
      toast({ title: 'Success', description: 'LanguageSettings updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update language-settings' });
    },
  });
};

export const useDeleteLanguageSettings = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: languageSettingsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: languageSettingsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: languageSettingsKeys.lists() });
      
      toast({ title: 'Success', description: 'LanguageSettings deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete language-settings' });
    },
  });
};
