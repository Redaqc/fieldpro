import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

/**
 * Touch-optimized select component for mobile
 * Large tap targets (min 44px) following mobile UX best practices
 */
export default function TouchOptimizedSelect({ 
  options = [], 
  value, 
  onChange, 
  label,
  className = '' 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <p className="text-sm font-semibold text-slate-700">{label}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => {
          const isSelected = value === option.value;
          return (
            <Button
              key={option.value}
              onClick={() => onChange(option.value)}
              variant={isSelected ? "default" : "outline"}
              className={`h-12 text-base font-medium justify-start ${
                isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
            >
              {isSelected && <Check className="w-5 h-5 mr-2" />}
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}