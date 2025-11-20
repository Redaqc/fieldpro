import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

export default function FormFillDialog({ open, onClose, formTemplate }) {
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const submitFormMutation = useMutation({
    mutationFn: async (data) => {
      const submission = await base44.entities.FormSubmission.create(data);
      
      // Trigger automations
      try {
        await base44.functions.invoke('executeFormAutomations', { submission_id: submission.id });
      } catch (error) {
        console.error('Automation error:', error);
      }
      
      return submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSubmissions'] });
      alert('Formulaire soumis avec succès!');
      onClose();
      setFormData({});
    },
  });

  if (!formTemplate) return null;

  const handleChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSubmit = () => {
    const submission = {
      form_template_id: formTemplate.id,
      form_name: formTemplate.name,
      submitted_by: currentUser?.email,
      submitted_by_name: currentUser?.full_name,
      submission_date: new Date().toISOString(),
      data: formData,
      status: 'submitted',
    };
    submitFormMutation.mutate(submission);
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        );
      case 'select':
        return (
          <Select value={formData[field.id] || ''} onValueChange={(value) => handleChange(field.id, value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt, idx) => (
                <SelectItem key={idx} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  checked={formData[field.id] === opt}
                  onChange={() => handleChange(field.id, opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={(e) => handleChange(field.id, e.target.checked)}
            />
            <span>{field.label}</span>
          </label>
        );
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleChange(field.id, n)}
                className={`text-2xl ${formData[field.id] >= n ? 'text-yellow-400' : 'text-slate-300'}`}
              >
                ★
              </button>
            ))}
          </div>
        );
      default:
        return <Input />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formTemplate.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {formTemplate.description && (
            <p className="text-slate-600">{formTemplate.description}</p>
          )}

          <div className="space-y-4">
            {formTemplate.fields?.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit}>Soumettre</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}