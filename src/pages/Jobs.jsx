import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, Calendar as CalendarIcon, Table } from "lucide-react";

import KanbanBoard from "../components/jobs/KanbanBoard";
import JobsList from "../components/jobs/JobsList";
import JobsCalendar from "../components/jobs/JobsCalendar";
import JobsTable from "../components/jobs/JobsTable";
import JobDialog from "../components/jobs/JobDialog";

export default function Jobs() {
  const [view, setView] = useState("kanban");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const handleCreateJob = () => {
    setSelectedJob(null);
    setDialogOpen(true);
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 border-b bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Jobs Board</h1>
            <p className="text-slate-500 mt-1">Gérez vos jobs comme dans Trello</p>
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
          <KanbanBoard jobs={jobs} onEditJob={handleEditJob} currentUser={currentUser} />
        )}
        {view === "list" && (
          <JobsList jobs={jobs} onEditJob={handleEditJob} />
        )}
        {view === "calendar" && (
          <JobsCalendar jobs={jobs} onEditJob={handleEditJob} />
        )}
        {view === "table" && (
          <JobsTable jobs={jobs} onEditJob={handleEditJob} />
        )}
      </div>

      <JobDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        technicians={technicians}
        currentUser={currentUser}
      />
    </div>
  );
}