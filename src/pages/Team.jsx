import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import TechniciansList from "../components/team/TechniciansList";
import TechnicianModal from "../components/team/TechnicianModal";

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTech, setSelectedTech] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list('-created_date'),
    initialData: [],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const deleteTechMutation = useMutation({
    mutationFn: (id) => base44.entities.Technician.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setSelectedTech(null);
    },
  });

  const filteredTechs = technicians.filter(tech => {
    const searchLower = searchQuery.toLowerCase();
    return (
      tech.first_name?.toLowerCase().includes(searchLower) ||
      tech.last_name?.toLowerCase().includes(searchLower) ||
      tech.email?.toLowerCase().includes(searchLower) ||
      tech.phone?.includes(searchQuery)
    );
  });

  const getTechJobCount = (techId) => {
    return jobs.filter(job => 
      job.technician_id === techId && 
      (job.status === 'scheduled' || job.status === 'in_progress')
    ).length;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 mt-1">Manage your technicians and field staff</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Technician
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search technicians..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <TechniciansList 
        technicians={filteredTechs}
        isLoading={isLoading}
        onSelectTech={setSelectedTech}
        getJobCount={getTechJobCount}
      />

      {(selectedTech || showCreateModal) && (
        <TechnicianModal
          technician={selectedTech}
          jobs={jobs.filter(j => j.technician_id === selectedTech?.id)}
          onClose={() => {
            setSelectedTech(null);
            setShowCreateModal(false);
          }}
          onDelete={() => deleteTechMutation.mutate(selectedTech.id)}
        />
      )}
    </div>
  );
}