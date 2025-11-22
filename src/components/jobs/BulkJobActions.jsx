import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";

export default function BulkJobActions({ jobs, selectedJobs, onClearSelection }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState('');
  const [value, setValue] = useState('');
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ action, value }) => {
      for (const jobId of selectedJobs) {
        const job = jobs.find(j => j.id === jobId);
        if (!job) continue;

        let updateData = {};
        if (action === 'status') updateData.status = value;
        else if (action === 'priority') updateData.priority = value;
        else if (action === 'assign') {
          const tech = JSON.parse(value);
          updateData.technicians = [...(job.technicians || []), tech];
        }

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
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
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