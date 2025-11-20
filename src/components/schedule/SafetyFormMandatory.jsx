import React from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle } from "lucide-react";

export default function SafetyFormMandatory({ job }) {
  const hasSafetyForm = job.checklist?.some(group => 
    group.name?.toLowerCase().includes('safety') || 
    group.name?.toLowerCase().includes('sécurité')
  );

  const allSafetyCompleted = hasSafetyForm && job.checklist
    .filter(group => group.name?.toLowerCase().includes('safety') || group.name?.toLowerCase().includes('sécurité'))
    .every(group => 
      (group.items || []).every(item => item.completed)
    );

  if (!job.work_type_name?.toLowerCase().includes('fiber') && 
      !job.work_type_name?.toLowerCase().includes('telecom') &&
      !job.work_type_name?.toLowerCase().includes('installation')) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {!hasSafetyForm && (
        <Badge className="bg-red-500">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Safety Form Required
        </Badge>
      )}
      
      {hasSafetyForm && !allSafetyCompleted && (
        <Badge className="bg-orange-500">
          <Shield className="w-3 h-3 mr-1" />
          Safety Incomplete
        </Badge>
      )}
      
      {hasSafetyForm && allSafetyCompleted && (
        <Badge className="bg-green-500">
          <Shield className="w-3 h-3 mr-1" />
          Safety ✓
        </Badge>
      )}
    </div>
  );
}