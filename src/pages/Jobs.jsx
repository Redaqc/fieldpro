import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LayoutGrid, List, Calendar as CalendarIcon, Table } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import JobKanban from "../components/jobs/JobKanban";
import JobsList from "../components/jobs/JobsList";
import JobCalendar from "../components/jobs/JobCalendar";
import JobTable from "../components/jobs/JobTable";
import JobDialog from "../components/jobs/JobDialog";
import JobDetailsTrello from "../components/jobs/JobDetailsTrello";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("kanban");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setShowDialog(true);
      setSelectedJob(null);
    } else if (params.get('id')) {
      const jobId = params.get('id');
      base44.entities.Job.filter({ id: jobId }).then(jobs => {
        if (jobs.length > 0) {
          setSelectedJob(jobs[0]);
        }
      });
    }
  }, []);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date'),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const createJobMutation = useMutation({
    mutationFn: (jobData) => base44.entities.Job.create(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowDialog(false);
      setSelectedJob(null);
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Job.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id) => base44.entities.Job.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJob(null);
    },
  });

  const handleSaveJob = (jobData) => {
    const activityLog = {
      action: selectedJob?.id ? 'updated' : 'created',
      user_name: user?.full_name || 'User',
      timestamp: new Date().toISOString(),
      details: selectedJob?.id ? 'Job updated' : 'Job created'
    };

    const dataWithLog = {
      ...jobData,
      activity_log: [...(jobData.activity_log || []), activityLog]
    };

    if (selectedJob?.id) {
      updateJobMutation.mutate({ id: selectedJob.id, data: dataWithLog });
    } else {
      const jobNumber = `JOB-${Date.now().toString().slice(-6)}`;
      createJobMutation.mutate({ ...dataWithLog, job_number: jobNumber });
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === "" || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.labels?.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch && job.status !== 'archived';
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage jobs with Kanban board</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedJob(null);
            setShowDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>
        
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'kanban' && (
        <JobKanban
          jobs={filteredJobs}
          isLoading={isLoading}
          onJobClick={setSelectedJob}
          onUpdate={updateJobMutation.mutate}
        />
      )}

      {view === 'list' && (
        <JobsList
          jobs={filteredJobs}
          isLoading={isLoading}
          onJobClick={setSelectedJob}
        />
      )}

      {view === 'calendar' && (
        <JobCalendar
          jobs={filteredJobs}
          onJobClick={setSelectedJob}
        />
      )}

      {view === 'table' && (
        <JobTable
          jobs={filteredJobs}
          isLoading={isLoading}
          onJobClick={setSelectedJob}
          technicians={technicians}
        />
      )}

      {showDialog && (
        <JobDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onSave={handleSaveJob}
          customers={customers}
          technicians={technicians}
        />
      )}

      {selectedJob && !showDialog && (
        <JobDetailsTrello
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={updateJobMutation.mutate}
          customers={customers}
          technicians={technicians}
          currentUser={user}
        />
      )}
    </div>
  );
}