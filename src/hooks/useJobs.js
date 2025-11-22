import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/api/jobs';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const jobKeys = {
  all: ['jobs'],
  lists: () => [...jobKeys.all, 'list'],
  list: (filters) => [...jobKeys.lists(), filters],
  details: () => [...jobKeys.all, 'detail'],
  detail: (id) => [...jobKeys.details(), id],
  statistics: (filters) => [...jobKeys.all, 'statistics', filters],
};

/**
 * Hook to get all jobs with pagination and filters
 */
export const useJobs = (params = {}) => {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => jobsApi.getAll(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get single job by ID
 */
export const useJob = (id, options = {}) => {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobsApi.getById(id),
    enabled: !!id && (options.enabled !== false),
    staleTime: 30000,
  });
};

/**
 * Hook to get job statistics
 */
export const useJobStatistics = (filters = {}) => {
  return useQuery({
    queryKey: jobKeys.statistics(filters),
    queryFn: () => jobsApi.getStatistics(filters),
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Hook to create new job
 */
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: jobsApi.create,
    onSuccess: (newJob) => {
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.statistics({}) });

      toast({
        title: 'Success',
        description: `Job ${newJob.jobNumber} created successfully`,
      });

      return newJob;
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create job',
      });
    },
  });
};

/**
 * Hook to update existing job
 */
export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => jobsApi.update(id, data),
    onSuccess: (updatedJob) => {
      // Update job in cache
      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });

      toast({
        title: 'Success',
        description: 'Job updated successfully',
      });

      return updatedJob;
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update job',
      });
    },
  });
};

/**
 * Hook to delete job
 */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: jobsApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: jobKeys.detail(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.statistics({}) });

      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete job',
      });
    },
  });
};

/**
 * Hook to update job status
 */
export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }) => jobsApi.updateStatus(id, status),
    onSuccess: (updatedJob) => {
      // Update job in cache
      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });

      toast({
        title: 'Success',
        description: `Job status updated to ${updatedJob.status}`,
      });

      return updatedJob;
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update job status',
      });
    },
  });
};

/**
 * Hook to assign technician to job
 */
export const useAssignTechnician = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, technicianId }) => jobsApi.assignTechnician(id, technicianId),
    onSuccess: (updatedJob) => {
      // Update job in cache
      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });

      toast({
        title: 'Success',
        description: 'Technician assigned successfully',
      });

      return updatedJob;
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to assign technician',
      });
    },
  });
};
