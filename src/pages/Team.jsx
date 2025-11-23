import { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Grid, List, Download, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

import TeamList from "../components/team/TeamList";
import TechnicianDialog from "../components/team/TechnicianDialog";
import TechnicianDetails from "../components/team/TechnicianDetails";
import { useCsvImportExport } from "@/hooks/useCsvImportExport";

/**
 * AUDIT FIX: MEDIUM Priority Issue #20 - Refactor Duplicate CSV Patterns
 * Using centralized useCsvImportExport hook
 */

export default function Team() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const queryClient = useQueryClient();
  const { handleExport, handleImport, importing } = useCsvImportExport('technicians', 'technicians');

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list('-created_date'),
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    staleTime: 30000,
  });

  const createTechnicianMutation = useMutation({
    mutationFn: (data) => base44.entities.Technician.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setShowDialog(false);
      setSelectedTechnician(null);
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: async ({ id, data, oldData }) => {
      const result = await base44.entities.Technician.update(id, data);
      
      // Send security notifications if phone or email changed
      if (oldData) {
        if (data.phone && data.phone !== oldData.phone) {
          await base44.functions.invoke('sendSecurityNotification', {
            userId: id,
            changeType: 'phone',
            oldValue: oldData.phone,
            newValue: data.phone,
            changedBy: currentUser?.email || 'Unknown'
          });
        }
        if (data.email && data.email !== oldData.email) {
          await base44.functions.invoke('sendSecurityNotification', {
            userId: id,
            changeType: 'email',
            oldValue: oldData.email,
            newValue: data.email,
            changedBy: currentUser?.email || 'Unknown'
          });
        }
      }
      
      return result;
    },
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

  const handleSave = useCallback((data) => {
    if (selectedTechnician?.id) {
      updateTechnicianMutation.mutate({ 
        id: selectedTechnician.id, 
        data,
        oldData: selectedTechnician
      });
    } else {
      createTechnicianMutation.mutate(data);
    }
  }, [selectedTechnician, createTechnicianMutation, updateTechnicianMutation]);

  const filteredTechnicians = useMemo(() => {
    if (!searchTerm) return technicians;
    const search = searchTerm.toLowerCase();
    return technicians.filter(tech => 
      tech.first_name?.toLowerCase().includes(search) ||
      tech.last_name?.toLowerCase().includes(search) ||
      tech.email?.toLowerCase().includes(search) ||
      tech.phone?.includes(search)
    );
  }, [technicians, searchTerm]);

  const stats = useMemo(() => {
    const available = technicians.filter(t => t.status === 'available').length;
    const busy = technicians.filter(t => t.status === 'busy').length;
    const offDuty = technicians.filter(t => t.status === 'off_duty').length;
    return { available, busy, offDuty, total: technicians.length };
  }, [technicians]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Équipe</h1>
          <p className="text-slate-500 mt-1">{stats.total} technicien{stats.total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <label>
            <Button variant="outline" disabled={importing} asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Importing...' : 'Import CSV'}
              </span>
            </Button>
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Occupés</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.busy}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Hors service</p>
              <p className="text-2xl font-bold text-slate-600">{stats.offDuty}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-slate-400" />
          </div>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Rechercher techniciens par nom, email, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
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
        viewMode={viewMode}
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