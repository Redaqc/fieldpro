import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Phone, LayoutGrid, List, Calendar as CalendarIcon, Table } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// NEW: Import our custom hooks
import { useServiceCalls } from "@/hooks/useServiceCalls";
import { useAuth } from "@/hooks/useAuth";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useWorkTypess } from "@/hooks/useWorkTypess";
import { useCustomers } from "@/hooks/useCustomers";

import ServiceCallDialog from "../components/servicecalls/ServiceCallDialog";
import ServiceCallKanban from "../components/servicecalls/ServiceCallKanban";
import ServiceCallsList from "../components/servicecalls/ServiceCallsList";
import ServiceCallsCalendar from "../components/servicecalls/ServiceCallsCalendar";
import ServiceCallsTable from "../components/servicecalls/ServiceCallsTable";

export default function ServiceCalls() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [activeTab, setActiveTab] = useState('kanban');

  // NEW: Use our custom hooks
  const { data: serviceCallsData, isLoading } = useServiceCalls({ page: 1, limit: 1000 });
  const serviceCalls = serviceCallsData?.data || [];

  const { user: currentUser } = useAuth();

  const { data: techniciansData } = useTechnicians({ page: 1, limit: 1000, isActive: true });
  const technicians = techniciansData?.data || [];

  const { data: workTypesData } = useWorkTypess({ page: 1, limit: 1000 });
  const workTypes = workTypesData?.data || [];

  const { data: customersData } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const handleEditCall = (call) => {
    setSelectedCall(call);
    setShowDialog(true);
  };

  const handleNewCall = () => {
    setSelectedCall(null);
    setShowDialog(true);
  };

  // Transform data to match component expectations (snake_case)
  const transformedServiceCalls = serviceCalls.map(call => ({
    ...call,
    customer_id: call.customerId,
    technician_id: call.technicianId,
    call_number: call.callNumber,
    scheduled_date: call.scheduledDate,
    completion_date: call.completionDate,
    created_date: call.createdAt,
    updated_date: call.updatedAt,
  }));

  const transformedTechnicians = technicians.map(tech => ({
    ...tech,
    user_id: tech.userId,
    is_active: tech.isActive,
    phone_number: tech.phoneNumber,
  }));

  const transformedWorkTypes = workTypes.map(wt => ({
    ...wt,
    default_duration: wt.defaultDuration,
    default_price: wt.defaultPrice,
    is_active: wt.isActive,
  }));

  const transformedCustomers = customers.map(customer => ({
    ...customer,
    first_name: customer.fullName?.split(' ')[0] || '',
    last_name: customer.fullName?.split(' ').slice(1).join(' ') || '',
    company_name: customer.companyName,
    postal_code: customer.postalCode,
    billing_address: customer.billingAddress,
    is_active: customer.isActive,
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Phone className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">Appels de Service</h1>
            </div>
            <p className="text-slate-500 mt-1">Gérez vos appels de service et interventions</p>
          </div>
          <Button onClick={handleNewCall} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Appel
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 bg-white border-b">
          <TabsList>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendrier
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              Tableau
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="kanban" className="h-full m-0">
            <ServiceCallKanban
              calls={transformedServiceCalls}
              onEditCall={handleEditCall}
              currentUser={currentUser}
              technicians={transformedTechnicians}
              workTypes={transformedWorkTypes}
            />
          </TabsContent>

          <TabsContent value="list" className="h-full m-0 overflow-auto">
            <ServiceCallsList
              calls={transformedServiceCalls}
              onEditCall={handleEditCall}
              technicians={transformedTechnicians}
              customers={transformedCustomers}
            />
          </TabsContent>

          <TabsContent value="calendar" className="h-full m-0 overflow-auto">
            <ServiceCallsCalendar
              calls={transformedServiceCalls}
              onEditCall={handleEditCall}
              technicians={transformedTechnicians}
            />
          </TabsContent>

          <TabsContent value="table" className="h-full m-0 overflow-auto">
            <ServiceCallsTable
              calls={transformedServiceCalls}
              onEditCall={handleEditCall}
              technicians={transformedTechnicians}
              customers={transformedCustomers}
            />
          </TabsContent>
        </div>
      </Tabs>

      {showDialog && (
        <ServiceCallDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedCall(null);
          }}
          call={selectedCall}
          technicians={transformedTechnicians}
          currentUser={currentUser}
          workTypes={transformedWorkTypes}
          customers={transformedCustomers}
        />
      )}
    </div>
  );
}
