import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import JobsList from "../components/jobs/JobsList";
import JobDialog from "../components/jobs/JobDialog";
import JobDetails from "../components/jobs/JobDetails";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const queryClient = useQueryClient();

  // Check URL for action=new or id=xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setShowDialog(true);
      setSelectedJob(null);
    } else if (params.get('id')) {
      const jobId = params.get('id');
      // Fetch and show job details
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
      setSelectedJob(null);
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
    if (selectedJob?.id) {
      updateJobMutation.mutate({ id: selectedJob.id, data: jobData });
    } else {
      const jobNumber = `JOB-${Date.now().toString().slice(-6)}`;
      createJobMutation.mutate({ ...jobData, job_number: jobNumber });
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === "" || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage and track all your service jobs</p>
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search jobs by title, customer, or job number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <JobsList 
        jobs={filteredJobs}
        isLoading={isLoading}
        onJobClick={setSelectedJob}
      />

      {showDialog && (
        <JobDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedJob(null);
          }}
          onSave={handleSaveJob}
          customers={customers}
          technicians={technicians}
        />
      )}

      {selectedJob && !showDialog && (
        <JobDetails
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onEdit={() => setShowDialog(true)}
          onUpdate={updateJobMutation.mutate}
          onDelete={() => deleteJobMutation.mutate(selectedJob.id)}
          customers={customers}
          technicians={technicians}
        />
      )}
    </div>
  );
}