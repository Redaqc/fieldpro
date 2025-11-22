import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";
import { JOB_STATUS, JOB_STATUS_LABELS, PRIORITY, PRIORITY_LABELS } from '@/constants/statuses';

/**
 * AUDIT FIX: High Priority Issue #7 - Standardize Status Values
 * AUDIT FIX: High Priority Issue #13 - Comprehensive Audit Logging
 */

export default function BulkJobActions({ jobs, selectedJobs, onClearSelection }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState('');
  const [value, setValue] = useState('');
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ action, value }) => {
      /**
       * AUDIT FIX: High Priority Issue #13 - Comprehensive Audit Logging
       * Add activity log for all bulk actions
       */
      const user = await base44.auth.me();
      const timestamp = new Date().toISOString();

      for (const jobId of selectedJobs) {
        const job = jobs.find(j => j.id === jobId);
        if (!job) continue;

        let updateData = {};
        let logDetails = '';

        if (action === 'status') {
          updateData.status = value;
          logDetails = `Status changed from "${JOB_STATUS_LABELS[job.status] || job.status}" to "${JOB_STATUS_LABELS[value]}" via bulk action`;
        } else if (action === 'priority') {
          updateData.priority = value;
          logDetails = `Priority changed from "${PRIORITY_LABELS[job.priority] || job.priority}" to "${PRIORITY_LABELS[value]}" via bulk action`;
        } else if (action === 'assign') {
          const tech = JSON.parse(value);
          updateData.technicians = [...(job.technicians || []), tech];
          logDetails = `Technician assigned: ${tech.name} via bulk action`;
        }

        // Add activity log for audit trail
        updateData.activity_log = [
          ...(job.activity_log || []),
          {
            timestamp,
            user: user.email,
            action: `bulk_${action}`,
            details: logDetails,
            bulk_operation_count: selectedJobs.length
          }
        ];

        await base44.entities.Job.update(jobId, updateData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setDialogOpen(false);
      onClearSelection();
      alert(`Successfully updated ${selectedJobs.length} jobs`);
    },
  });

  const handleBulkAction = () => {
    if (!action || !value) return;
    bulkUpdateMutation.mutate({ action, value });
  };

  if (selectedJobs.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white shadow-2xl rounded-lg border-2 border-blue-600 p-4 flex items-center gap-4">
          <Badge className="bg-blue-600">
            {selectedJobs.length} selected
          </Badge>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update {selectedJobs.length} Jobs</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Change Status</SelectItem>
                  <SelectItem value="priority">Change Priority</SelectItem>
                  <SelectItem value="assign">Assign Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {action === 'status' && (
              <div>
                <label className="text-sm font-medium mb-2 block">New Status</label>
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={JOB_STATUS.TODO}>{JOB_STATUS_LABELS[JOB_STATUS.TODO]}</SelectItem>
                    <SelectItem value={JOB_STATUS.IN_PROGRESS}>{JOB_STATUS_LABELS[JOB_STATUS.IN_PROGRESS]}</SelectItem>
                    <SelectItem value={JOB_STATUS.REVIEW}>{JOB_STATUS_LABELS[JOB_STATUS.REVIEW]}</SelectItem>
                    <SelectItem value={JOB_STATUS.COMPLETED}>{JOB_STATUS_LABELS[JOB_STATUS.COMPLETED]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === 'priority' && (
              <div>
                <label className="text-sm font-medium mb-2 block">New Priority</label>
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PRIORITY.LOW}>{PRIORITY_LABELS[PRIORITY.LOW]}</SelectItem>
                    <SelectItem value={PRIORITY.MEDIUM}>{PRIORITY_LABELS[PRIORITY.MEDIUM]}</SelectItem>
                    <SelectItem value={PRIORITY.HIGH}>{PRIORITY_LABELS[PRIORITY.HIGH]}</SelectItem>
                    <SelectItem value={PRIORITY.URGENT}>{PRIORITY_LABELS[PRIORITY.URGENT]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkAction}
                disabled={!action || !value || bulkUpdateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {bulkUpdateMutation.isPending ? 'Updating...' : 'Apply to All'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}