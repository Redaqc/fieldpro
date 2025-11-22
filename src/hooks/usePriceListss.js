import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceListsApi } from '@/api/price-lists';
import { useToast } from '@/hooks/use-toast';

export const priceListsKeys = {
  all: ['priceLists'],
  lists: () => [...priceListsKeys.all, 'list'],
  list: (filters) => [...priceListsKeys.lists(), filters],
  details: () => [...priceListsKeys.all, 'detail'],
  detail: (id) => [...priceListsKeys.details(), id],
  statistics: () => [...priceListsKeys.all, 'statistics'],
};

export const usePriceListss = (params = {}) => {
  return useQuery({
    queryKey: priceListsKeys.list(params),
    queryFn: () => priceListsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};

export const usePriceLists = (id, options = {}) => {
  return useQuery({
    queryKey: priceListsKeys.detail(id),
    queryFn: () => priceListsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 60000,
  });
};

export const useCreatePriceLists = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: priceListsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: priceListsKeys.lists() });
      
      toast({ title: 'Success', description: 'PriceLists created successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to create price-lists' });
    },
  });
};

export const useUpdatePriceLists = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => priceListsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(priceListsKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: priceListsKeys.lists() });
      toast({ title: 'Success', description: 'PriceLists updated successfully' });
      return data;
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update price-lists' });
    },
  });
};

export const useDeletePriceLists = () => {
  const queryClient = useQueryClient();
  const { toast} = useToast();

  return useMutation({
    mutationFn: priceListsApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: priceListsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: priceListsKeys.lists() });
      
      toast({ title: 'Success', description: 'PriceLists deleted successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete price-lists' });
    },
  });
};
