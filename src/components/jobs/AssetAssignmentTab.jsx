import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package, CheckCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function AssetAssignmentTab({ job }) {
  const [adding, setAdding] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    asset_id: '',
    condition_before: ''
  });
  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
    initialData: [],
  });

  const assetAssignments = job.asset_assignments || [];

  const addAssignmentMutation = useMutation({
    mutationFn: async (assignment) => {
      const asset = assets.find(a => a.id === assignment.asset_id);
      
      const updatedAssignments = [
        ...assetAssignments,
        {
          id: Date.now().toString(),
          asset_id: assignment.asset_id,
          asset_name: asset.name,
          assigned_at: new Date().toISOString(),
          condition_before: assignment.condition_before,
          returned_at: null,
          condition_after: null
        }
      ];

      await base44.entities.Job.update(job.id, {
        asset_assignments: updatedAssignments,
        activity_log: [
          ...(job.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            user: (await base44.auth.me()).email,
            action: 'asset_assigned',
            details: `Assigned asset: ${asset.name}`
          }
        ]
      });

      // Update asset status
      await base44.entities.Asset.update(asset.id, {
        status: 'in_use',
        current_job_id: job.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setAdding(false);
      setNewAssignment({ asset_id: '', condition_before: '' });
    },
  });

  const returnAssetMutation = useMutation({
    mutationFn: async ({ assignmentId, conditionAfter }) => {
      const assignment = assetAssignments.find(a => a.id === assignmentId);
      const updatedAssignments = assetAssignments.map(a => 
        a.id === assignmentId 
          ? { ...a, returned_at: new Date().toISOString(), condition_after: conditionAfter }
          : a
      );

      await base44.entities.Job.update(job.id, {
        asset_assignments: updatedAssignments
      });

      // Update asset status
      const asset = assets.find(a => a.id === assignment.asset_id);
      if (asset) {
        await base44.entities.Asset.update(asset.id, {
          status: 'available',
          current_job_id: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const availableAssets = assets.filter(a => a.status === 'available');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Assets Assigned</h3>
          <p className="text-sm text-slate-600">Track equipment and tools used on this job</p>
        </div>
      </div>

      {/* Add Asset Form */}
      {adding && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Asset</label>
              <Select
                value={newAssignment.asset_id}
                onValueChange={(v) => setNewAssignment({ ...newAssignment, asset_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} - {a.asset_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Condition Before Use</label>
              <Textarea
                value={newAssignment.condition_before}
                onChange={(e) => setNewAssignment({ ...newAssignment, condition_before: e.target.value })}
                placeholder="Document the asset condition..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => addAssignmentMutation.mutate(newAssignment)}
                disabled={!newAssignment.asset_id || addAssignmentMutation.isPending}
                className="flex-1"
              >
                Assign to Job
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAdding(false);
                  setNewAssignment({ asset_id: '', condition_before: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!adding && (
        <Button onClick={() => setAdding(true)} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Assign Asset
        </Button>
      )}

      {/* Assets List */}
      <div className="space-y-2">
        {assetAssignments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">No assets assigned yet</p>
          </div>
        ) : (
          assetAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{assignment.asset_name}</h4>
                      {assignment.returned_at ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Returned
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500">In Use</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <p className="text-slate-600">
                        <strong>Assigned:</strong> {new Date(assignment.assigned_at).toLocaleString()}
                      </p>
                      {assignment.condition_before && (
                        <p className="text-slate-600">
                          <strong>Condition Before:</strong> {assignment.condition_before}
                        </p>
                      )}
                      {assignment.returned_at && (
                        <>
                          <p className="text-slate-600">
                            <strong>Returned:</strong> {new Date(assignment.returned_at).toLocaleString()}
                          </p>
                          {assignment.condition_after && (
                            <p className="text-slate-600">
                              <strong>Condition After:</strong> {assignment.condition_after}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {!assignment.returned_at && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const condition = prompt('Asset condition after use:');
                        if (condition !== null) {
                          returnAssetMutation.mutate({ 
                            assignmentId: assignment.id, 
                            conditionAfter: condition 
                          });
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Return
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}