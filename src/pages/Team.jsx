import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import TeamList from "../components/team/TeamList";
import TechnicianDialog from "../components/team/TechnicianDialog";
import TechnicianDetails from "../components/team/TechnicianDetails";

export default function Team() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const queryClient = useQueryClient();

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

  const createTechnicianMutation = useMutation({
    mutationFn: (data) => base44.entities.Technician.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setShowDialog(false);
      setSelectedTechnician(null);
    },
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Technician.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setShowDialog(false);
      setSelectedTechnician(null);
    },
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: (id) => base44.entities.Technician.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setSelectedTechnician(null);
    },
  });

  const handleSave = (data) => {
    if (selectedTechnician?.id) {
      updateTechnicianMutation.mutate({ id: selectedTechnician.id, data });
    } else {
      createTechnicianMutation.mutate(data);
    }
  };

  const filteredTechnicians = technicians.filter(tech => {
    const search = searchTerm.toLowerCase();
    return (
      tech.first_name?.toLowerCase().includes(search) ||
      tech.last_name?.toLowerCase().includes(search) ||
      tech.email?.toLowerCase().includes(search) ||
      tech.phone?.includes(search)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Équipe</h1>
          <p className="text-slate-500 mt-1">Gérer les techniciens de terrain</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedTechnician(null);
            setShowDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Technicien
        </Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Rechercher techniciens par nom, email, téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-slate-200"
        />
      </div>

      <TeamList
        technicians={filteredTechnicians}
        isLoading={isLoading}
        onTechnicianClick={(tech) => {
          setSelectedTechnician(tech);
          setShowDetails(true);
        }}
        onUpdateStatus={(id, status) => {
          updateTechnicianMutation.mutate({ id, data: { status } });
        }}
        onDelete={(id) => {
          if (confirm('Voulez-vous vraiment supprimer ce technicien?')) {
            deleteTechnicianMutation.mutate(id);
          }
        }}
        jobs={jobs}
      />

      {showDialog && (
        <TechnicianDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedTechnician(null);
          }}
          onSave={handleSave}
          technician={selectedTechnician}
        />
      )}

      {showDetails && (
        <TechnicianDetails
          open={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedTechnician(null);
          }}
          technician={selectedTechnician}
          onEdit={() => {
            setShowDetails(false);
            setShowDialog(true);
          }}
        />
      )}
    </div>
  );
}