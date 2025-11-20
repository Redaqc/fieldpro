import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Zap, Plus, Briefcase, Phone, Users, FileText, Package, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function QuickActionsMenu() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'New Job',
      icon: Briefcase,
      action: () => navigate(createPageUrl('Jobs') + '?new=true'),
      color: 'text-blue-600',
      bg: 'hover:bg-blue-50'
    },
    {
      label: 'New Service Call',
      icon: Phone,
      action: () => navigate(createPageUrl('ServiceCalls') + '?new=true'),
      color: 'text-green-600',
      bg: 'hover:bg-green-50'
    },
    {
      label: 'New Customer',
      icon: Users,
      action: () => navigate(createPageUrl('Customers') + '?new=true'),
      color: 'text-purple-600',
      bg: 'hover:bg-purple-50'
    },
    {
      label: 'New Invoice',
      icon: FileText,
      action: () => navigate(createPageUrl('Invoices') + '?new=true'),
      color: 'text-orange-600',
      bg: 'hover:bg-orange-50'
    },
    {
      label: 'New Quotation',
      icon: FileText,
      action: () => navigate(createPageUrl('Quotations') + '?new=true'),
      color: 'text-indigo-600',
      bg: 'hover:bg-indigo-50'
    },
    {
      label: 'Schedule View',
      icon: Calendar,
      action: () => navigate(createPageUrl('Schedule')),
      color: 'text-teal-600',
      bg: 'hover:bg-teal-50'
    }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
        >
          <Zap className="w-6 h-6 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-600 px-2 py-1">Quick Actions</p>
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${action.bg}`}
            >
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <span className="font-medium text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}