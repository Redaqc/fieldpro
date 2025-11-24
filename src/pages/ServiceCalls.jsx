import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Phone, LayoutGrid, List, Calendar as CalendarIcon, Table } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import ServiceCallDialog from "../components/servicecalls/ServiceCallDialog";
import ServiceCallKanban from "../components/servicecalls/ServiceCallKanban";
import ServiceCallsList from "../components/servicecalls/ServiceCallsList";
import ServiceCallsCalendar from "../components/servicecalls/ServiceCallsCalendar";
import ServiceCallsTable from "../components/servicecalls/ServiceCallsTable";

export default function ServiceCalls() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [activeTab, setActiveTab] = useState('kanban');

  const { data: serviceCalls = [], isLoading } = useQuery({
    queryKey: ['serviceCalls'],
    queryFn: () => base44.entities.ServiceCall.list('-created_date'),
    initialData: [],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const { data: workTypes = [] } = useQuery({
    queryKey: ['workTypes'],
    queryFn: () => base44.entities.WorkType.list(),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const handleEditCall = (call) => {
    setSelectedCall(call);
    setShowDialog(true);
  };

  const handleNewCall = () => {
    setSelectedCall(null);
    setShowDialog(true);
  };

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
              calls={serviceCalls}
              onEditCall={handleEditCall}
              currentUser={currentUser}
              technicians={technicians}
              workTypes={workTypes}
            />
          </TabsContent>

          <TabsContent value="list" className="h-full m-0 overflow-auto">
            <ServiceCallsList 
              calls={serviceCalls}
              onEditCall={handleEditCall}
              technicians={technicians}
              customers={customers}
            />
          </TabsContent>

          <TabsContent value="calendar" className="h-full m-0 overflow-auto">
            <ServiceCallsCalendar 
              calls={serviceCalls}
              onEditCall={handleEditCall}
              technicians={technicians}
            />
          </TabsContent>

          <TabsContent value="table" className="h-full m-0 overflow-auto">
            <ServiceCallsTable 
              calls={serviceCalls}
              onEditCall={handleEditCall}
              technicians={technicians}
              customers={customers}
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
          technicians={technicians}
          currentUser={currentUser}
          workTypes={workTypes}
          customers={customers}
        />
      )}
    </div>
  );
}