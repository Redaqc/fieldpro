import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

export default function EmergencyCallButton({ currentTech }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    location: '',
    description: ''
  });
  const queryClient = useQueryClient();

  const createEmergencyCallMutation = useMutation({
    mutationFn: async (data) => {
      const serviceCall = await base44.entities.ServiceCall.create({
        title: `EMERGENCY: ${data.customer_name}`,
        description: data.description,
        customer_name: data.customer_name,
        location: data.location,
        priority: 'urgent',
        status: 'in_progress',
        call_type: 'emergency',
        origin: 'phone',
        response_time_required: 2,
        start_date: new Date().toISOString(),
        started_at: new Date().toISOString(),
        technicians: [{
          id: currentTech.id,
          name: `${currentTech.first_name} ${currentTech.last_name}`,
          time_spent: 0,
          time_logs: [],
          active_start: new Date().toISOString()
        }],
        activity_log: [{
          timestamp: new Date().toISOString(),
          user: currentTech.email,
          action: 'emergency_created',
          details: 'Emergency service call created and time tracking started'
        }]
      });

      // Create alert for dispatcher
      await base44.entities.Alert.create({
        type: 'unassigned_work',
        severity: 'critical',
        title: 'Emergency Call Created',
        message: `${currentTech.first_name} created emergency call for ${data.customer_name}`,
        entity_type: 'ServiceCall',
        entity_id: serviceCall.id,
        status: 'active'
      });

      return serviceCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
      setDialogOpen(false);
      setFormData({ customer_name: '', location: '', description: '' });
    },
  });

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="w-full bg-red-600 hover:bg-red-700 h-14 text-lg font-bold"
      >
        <AlertCircle className="w-6 h-6 mr-2" />
        EMERGENCY CALL
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Create Emergency Call
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                placeholder="Customer Name *"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div>
              <Input
                placeholder="Location/Address *"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div>
              <Textarea
                placeholder="Emergency description *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="text-base"
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                Time tracking will start automatically when you create this emergency call.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => createEmergencyCallMutation.mutate(formData)}
                disabled={!formData.customer_name || !formData.location || !formData.description || createEmergencyCallMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Create & Start Timer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}