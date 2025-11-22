import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyInfoApi } from '@/api/company-info';
import { useToast } from '@/hooks/use-toast';

export const companyInfoKeys = {
  all: ['companyInfo'],
  lists: () => [...companyInfoKeys.all, 'list'],
  list: (filters) => [...companyInfoKeys.lists(), filters],
  details: () => [...companyInfoKeys.all, 'detail'],
  detail: (id) => [...companyInfoKeys.details(), id],
  statistics: () => [...companyInfoKeys.all, 'statistics'],
};

export const useCompanyInfos = (params = {}) => {
  return useQuery({
    queryKey: companyInfoKeys.list(params),
    queryFn: () => companyInfoApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useCompanyInfo = (id, options = {}) => {
  return useQuery({
    queryKey: companyInfoKeys.detail(id),
    queryFn: () => companyInfoApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateCompanyInfo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: companyInfoApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyInfoKeys.lists() });
      
      toast({ title: 'Success', description: 'CompanyInfo created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create company-info' });
    },
  });
};

export const useUpdateCompanyInfo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => companyInfoApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(companyInfoKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: companyInfoKeys.lists() });
      toast({ title: 'Success', description: 'CompanyInfo updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update company-info' });
    },
  });
};

export const useDeleteCompanyInfo = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: companyInfoApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: companyInfoKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: companyInfoKeys.lists() });
      
      toast({ title: 'Success', description: 'CompanyInfo deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete company-info' });
    },
  });
};
