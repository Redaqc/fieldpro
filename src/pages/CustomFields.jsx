import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function CustomFields() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [formData, setFormData] = useState({
    entity_type: 'job',
    field_name: '',
    label: '',
    field_type: 'text',
    options: [],
    required: false,
    active: true
  });
  const queryClient = useQueryClient();

  const { data: customFields = [] } = useQuery({
    queryKey: ['customFields'],
    queryFn: () => base44.entities.CustomField.list(),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (selectedField?.id) {
        return base44.entities.CustomField.update(selectedField.id, data);
      }
      return base44.entities.CustomField.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomField.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    },
  });

  const resetForm = () => {
    setFormData({
      entity_type: 'job',
      field_name: '',
      label: '',
      field_type: 'text',
      options: [],
      required: false,
      active: true
    });
    setSelectedField(null);
    setDialogOpen(false);
  };

  const handleEdit = (field) => {
    setSelectedField(field);
    setFormData(field);
    setDialogOpen(true);
  };

  const groupedFields = customFields.reduce((acc, field) => {
    if (!acc[field.entity_type]) acc[field.entity_type] = [];
    acc[field.entity_type].push(field);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Custom Fields</h1>
          <p className="text-slate-500 mt-1">Add custom fields to entities</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Field
        </Button>
      </div>

      {Object.entries(groupedFields).map(([entityType, fields]) => (
        <Card key={entityType}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">{entityType} Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.label}</span>
                      <Badge variant="outline">{field.field_type}</Badge>
                      {field.required && <Badge variant="destructive">Required</Badge>}
                      {!field.active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Field name: {field.field_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(field)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this field?')) {
                          deleteMutation.mutate(field.id);
                        }
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={resetForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedField ? 'Edit' : 'Add'} Custom Field</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Entity Type</label>
              <Select
                value={formData.entity_type}
                onValueChange={(v) => setFormData({ ...formData, entity_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Label</label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Project Manager"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Field Name (no spaces)</label>
              <Input
                value={formData.field_name}
                onChange={(e) => setFormData({
                  ...formData,
                  field_name: e.target.value.toLowerCase().replace(/\s+/g, '_')
                })}
                placeholder="e.g., project_manager"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Field Type</label>
              <Select
                value={formData.field_type}
                onValueChange={(v) => setFormData({ ...formData, field_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Yes/No</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.field_type === 'select' || formData.field_type === 'multiselect') && (
              <div>
                <label className="text-sm font-medium">Options (comma separated)</label>
                <Input
                  value={formData.options?.join(', ') || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Required Field</label>
              <Switch
                checked={formData.required}
                onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.field_name || !formData.label || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}