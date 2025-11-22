import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents';
import { useToast } from '@/hooks/use-toast';

export const documentsKeys = {
  all: ['documents'],
  lists: () => [...documentsKeys.all, 'list'],
  list: (filters) => [...documentsKeys.lists(), filters],
  details: () => [...documentsKeys.all, 'detail'],
  detail: (id) => [...documentsKeys.details(), id],
  statistics: () => [...documentsKeys.all, 'statistics'],
};

export const useDocumentss = (params = {}) => {
  return useQuery({
    queryKey: documentsKeys.list(params),
    queryFn: () => documentsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const useDocuments = (id, options = {}) => {
  return useQuery({
    queryKey: documentsKeys.detail(id),
    queryFn: () => documentsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreateDocuments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() });
      
      toast({ title: 'Success', description: 'Documents created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create documents' });
    },
  });
};

export const useUpdateDocuments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => documentsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(documentsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() });
      toast({ title: 'Success', description: 'Documents updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update documents' });
    },
  });
};

export const useDeleteDocuments = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: documentsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() });
      
      toast({ title: 'Success', description: 'Documents deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete documents' });
    },
  });
};
