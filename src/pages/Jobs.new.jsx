import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, Calendar as CalendarIcon, Table } from "lucide-react";

// NEW: Import our custom hooks
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useWorkTypess } from "@/hooks/useWorkTypess";
import { useCustomers } from "@/hooks/useCustomers";

import KanbanBoard from "../components/jobs/KanbanBoard";
import JobsList from "../components/jobs/JobsList";
import JobsCalendar from "../components/jobs/JobsCalendar";
import JobsTable from "../components/jobs/JobsTable";
import JobDialog from "../components/jobs/JobDialog";

export default function Jobs() {
  const [view, setView] = useState("kanban");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // NEW: Use our custom hooks
  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const { user: currentUser } = useAuth();

  const { data: techniciansData } = useTechnicians({ page: 1, limit: 1000, isActive: true });
  const technicians = techniciansData?.data || [];

  const { data: workTypesData } = useWorkTypess({ page: 1, limit: 1000 });
  const workTypes = workTypesData?.data || [];

  const { data: customersData } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const handleCreateJob = () => {
    setSelectedJob(null);
    setDialogOpen(true);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  // Transform data to match component expectations (snake_case)
  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    technician_id: job.technicianId,
    work_type_id: job.workTypeId,
    job_number: job.jobNumber,
    scheduled_date: job.scheduledDate,
    completion_date: job.completionDate,
    created_date: job.createdAt,
    updated_date: job.updatedAt,
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 border-b bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Jobs Board</h1>
            <p className="text-slate-500 mt-1">Gérez vos jobs.</p>
          </div>
          <Button onClick={handleCreateJob} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Job
          </Button>
        </div>

        <Tabs value={view} onValueChange={setView} className="mt-4">
          <TabsList className="bg-slate-100">
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
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === "kanban" && (
          <KanbanBoard jobs={transformedJobs} onEditJob={handleEditJob} currentUser={currentUser} />
        )}
        {view === "list" && (
          <JobsList jobs={transformedJobs} onEditJob={handleEditJob} />
        )}
        {view === "calendar" && (
          <JobsCalendar jobs={transformedJobs} onEditJob={handleEditJob} />
        )}
        {view === "table" && (
          <JobsTable jobs={transformedJobs} onEditJob={handleEditJob} />
        )}
      </div>

      <JobDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        technicians={transformedTechnicians}
        currentUser={currentUser}
        workTypes={transformedWorkTypes}
        customers={transformedCustomers}
      />
    </div>
  );
}
