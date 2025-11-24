import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, MapPin, Building2, Users, Trash2 } from "lucide-react";

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  vip: "bg-purple-100 text-purple-800"
};

export default function CustomersList({ customers, isLoading, onCustomerClick, onDelete, jobs, viewMode = "cards" }) {
  const getCustomerJobCount = (customerId) => {
    return jobs.filter(j => j.customer_id === customerId).length;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No customers found</h3>
        <p className="text-slate-500">Add your first customer to get started</p>
      </Card>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {customers.map((customer) => {
          const jobCount = getCustomerJobCount(customer.id);
          return (
            <Card key={customer.id} className="p-4 hover:shadow-md transition-all border-slate-200">
              <div className="flex items-center gap-4">
                {customer.logo_url ? (
                  <div className="w-12 h-12 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <img src={customer.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {customer.first_name?.[0]}{customer.last_name?.[0]}
                  </div>
                )}
                
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onCustomerClick(customer)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <Badge className={statusColors[customer.status || 'active']}>
                      {customer.status || 'active'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    {customer.company_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {customer.company_name}
                      </span>
                    )}
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {customer.phone}
                      </span>
                    )}
                    {customer.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3.5 h-3.5" />
                        {customer.email}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm text-slate-500">{jobCount} jobs</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(customer.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((customer) => {
        const jobCount = getCustomerJobCount(customer.id);
        return (
          <Card key={customer.id} className="p-6 hover:shadow-md transition-all border-slate-200 relative group">
            <div onClick={() => onCustomerClick(customer)} className="cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {customer.logo_url ? (
                    <div className="w-14 h-14 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <img src={customer.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {customer.first_name?.[0]}{customer.last_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-slate-900 mb-1">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    {customer.company_name && (
                      <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{customer.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={statusColors[customer.status || 'active']}>
                  {customer.status || 'active'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  {jobCount} job{jobCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(customer.id);
              }}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}