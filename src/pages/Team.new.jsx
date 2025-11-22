import React, { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Grid, List, Download, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

// NEW: Import our custom hooks
import { useTechnicians, useCreateTechnician, useUpdateTechnician, useDeleteTechnician } from "@/hooks/useTechnicians";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api-client";

import TeamList from "../components/team/TeamList";
import TechnicianDialog from "../components/team/TechnicianDialog";
import TechnicianDetails from "../components/team/TechnicianDetails";

export default function Team() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  // NEW: Use our custom hooks
  const { data: techniciansData, isLoading, refetch } = useTechnicians({ page: 1, limit: 1000 });
  const technicians = techniciansData?.data || [];

  const { data: jobsData } = useJobs({ page: 1, limit: 1000 });
  const jobs = jobsData?.data || [];

  const { user: currentUser } = useAuth();

  const createTechnicianMutation = useCreateTechnician();
  const deleteTechnicianMutation = useDeleteTechnician();

  // Custom update mutation with security notifications
  const updateTechnicianMutation = useMutation({
    mutationFn: async ({ id, data, oldData }) => {
      const result = await apiClient.patch(`/technicians/${id}`, data);

      // Send security notifications if phone or email changed
      // TODO: Implement security notification API endpoint
      if (oldData) {
        if (data.phone && data.phone !== oldData.phone_number) {
          try {
            await apiClient.post('/notifications/security', {
              userId: id,
              changeType: 'phone',
              oldValue: oldData.phone_number,
              newValue: data.phone,
              changedBy: currentUser?.email || 'Unknown'
            });
          } catch (error) {
            console.warn('Security notification failed:', error);
          }
        }
        if (data.email && data.email !== oldData.email) {
          try {
            await apiClient.post('/notifications/security', {
              userId: id,
              changeType: 'email',
              oldValue: oldData.email,
              newValue: data.email,
              changedBy: currentUser?.email || 'Unknown'
            });
          } catch (error) {
            console.warn('Security notification failed:', error);
          }
        }
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setShowDialog(false);
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
      createTechnicianMutation.mutate(data, {
        onSuccess: () => {
          setShowDialog(false);
          setSelectedTechnician(null);
        },
      });
    }
  }, [selectedTechnician, createTechnicianMutation, updateTechnicianMutation]);

  const handleDelete = (id) => {
    if (confirm('Voulez-vous vraiment supprimer ce technicien?')) {
      deleteTechnicianMutation.mutate(id, {
        onSuccess: () => {
          setSelectedTechnician(null);
        },
      });
    }
  };

  // Transform data to match component expectations (snake_case)
  const transformedTechnicians = technicians.map(tech => ({
    ...tech,
    user_id: tech.userId,
    is_active: tech.isActive,
    phone_number: tech.phoneNumber,
    first_name: tech.name?.split(' ')[0] || tech.name || '',
    last_name: tech.name?.split(' ').slice(1).join(' ') || '',
    created_date: tech.createdAt,
    updated_date: tech.updatedAt,
  }));

  const transformedJobs = jobs.map(job => ({
    ...job,
    customer_id: job.customerId,
    technician_id: job.technicianId,
    work_type_id: job.workTypeId,
    job_number: job.jobNumber,
    scheduled_date: job.scheduledDate,
    completion_date: job.completionDate,
  }));

  const filteredTechnicians = useMemo(() => {
    if (!searchTerm) return transformedTechnicians;
    const search = searchTerm.toLowerCase();
    return transformedTechnicians.filter(tech =>
      tech.first_name?.toLowerCase().includes(search) ||
      tech.last_name?.toLowerCase().includes(search) ||
      tech.email?.toLowerCase().includes(search) ||
      tech.phone_number?.includes(search)
    );
  }, [transformedTechnicians, searchTerm]);

  // TODO: Implement CSV export via backend API endpoint
  const handleExport = async () => {
    try {
      // This will need a backend endpoint like: GET /technicians/export/csv
      // For now, we'll do a client-side CSV generation as fallback
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Skills'];
      const rows = transformedTechnicians.map(t => [
        t.first_name || '',
        t.last_name || '',
        t.email || '',
        t.phone_number || '',
        t.status || '',
        t.skills || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `technicians_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erreur lors de l\'export');
    }
  };

  // TODO: Implement CSV import via backend API endpoint
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      // This will need a backend endpoint like: POST /technicians/import/csv
      alert('CSV Import requires backend API endpoint implementation');
      // const text = await file.text();
      // const response = await apiClient.post('/technicians/import/csv', { csvData: text });
      // alert(`Import réussi: ${response.data.created} créés, ${response.data.updated} mis à jour`);
      refetch();
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset file input
    }
  };

  const stats = useMemo(() => {
    const available = transformedTechnicians.filter(t => t.status === 'available').length;
    const busy = transformedTechnicians.filter(t => t.status === 'busy').length;
    const offDuty = transformedTechnicians.filter(t => t.status === 'off_duty').length;
    return { available, busy, offDuty, total: transformedTechnicians.length };
  }, [transformedTechnicians]);

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
        onDelete={handleDelete}
        jobs={transformedJobs}
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
