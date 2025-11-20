import React from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConflictAlert({ conflicts, onClose }) {
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 text-lg mb-2">
              Scheduling Conflicts Detected
            </h3>
            <div className="space-y-2">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="text-sm text-red-800">
                  <p className="font-semibold">{conflict.type === 'overlap' ? '⚠️ Overlap:' : '⚠️ Warning:'}</p>
                  <p>{conflict.message}</p>
                  {conflict.event && (
                    <p className="text-xs mt-1 text-red-700">
                      Conflicting event: "{conflict.event.title}" ({conflict.event.type})
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-red-700 mt-3">
              Please adjust the schedule to avoid conflicts, or cancel the change.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-red-600 hover:text-red-800 hover:bg-red-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}