import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, MapPin, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  vip: "bg-purple-100 text-purple-800 border-purple-200"
};

export default function CustomersList({ customers, isLoading, onSelectCustomer, getJobCount }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500">No customers found. Add your first customer to get started!</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((customer) => {
        const jobCount = getJobCount(customer.id);
        return (
          <Card 
            key={customer.id}
            className="p-6 hover:shadow-md transition-all cursor-pointer border-slate-200"
            onClick={() => onSelectCustomer(customer)}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                    {customer.first_name} {customer.last_name}
                  </h3>
                  {customer.company_name && (
                    <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{customer.company_name}</span>
                    </div>
                  )}
                </div>
                <Badge className={statusColors[customer.status || 'active']}>
                  {customer.status || 'active'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                {customer.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                
                {customer.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Briefcase className="w-4 h-4" />
                  <span>{jobCount} job{jobCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}