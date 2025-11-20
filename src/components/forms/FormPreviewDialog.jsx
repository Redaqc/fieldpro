import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function FormPreviewDialog({ open, onClose, formData }) {
  const renderField = (field) => {
    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'time':
        return (
          <Input 
            type={field.type} 
            placeholder={field.placeholder}
            disabled
          />
        );
      case 'textarea':
        return (
          <Textarea 
            placeholder={field.placeholder}
            rows={4}
            disabled
          />
        );
      case 'select':
        return (
          <Select disabled>
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
                <input type="radio" name={field.id} disabled />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input type="checkbox" disabled />
            <span>{field.label}</span>
          </label>
        );
      case 'signature':
        return (
          <div className="border-2 border-dashed rounded-lg h-32 flex items-center justify-center text-slate-400">
            Zone de signature
          </div>
        );
      case 'photo':
        return (
          <div className="border-2 border-dashed rounded-lg h-32 flex items-center justify-center text-slate-400">
            Zone photo
          </div>
        );
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <span key={n} className="text-2xl text-slate-300">★</span>
            ))}
          </div>
        );
      default:
        return <Input disabled />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aperçu du formulaire</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h2 className="text-2xl font-bold">{formData.name}</h2>
            {formData.description && (
              <p className="text-slate-600 mt-1">{formData.description}</p>
            )}
            <Badge className="mt-2">{formData.category}</Badge>
          </div>

          <div className="space-y-4">
            {formData.fields?.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <Label className="flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {formData.require_signature && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Signature *</Label>
              <div className="border-2 border-dashed rounded-lg h-32 flex items-center justify-center text-slate-400">
                Zone de signature
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}