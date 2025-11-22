import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// NEW: Import our custom hooks
import { useMaterialss, useCreateMaterials, useUpdateMaterials, useDeleteMaterials } from "@/hooks/useMaterialss";

import MaterialsList from "../components/materials/MaterialsList";
import MaterialDialog from "../components/materials/MaterialDialog";

export default function Materials() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [importing, setImporting] = useState(false);

  // NEW: Use our custom hooks
  const { data: materialsData, isLoading } = useMaterialss({ page: 1, limit: 1000 });
  const materials = materialsData?.data || [];

  const createMutation = useCreateMaterials();
  const updateMutation = useUpdateMaterials();
  const deleteMutation = useDeleteMaterials();

  const handleSave = (data) => {
    if (selectedMaterial?.id) {
      updateMutation.mutate(
        { id: selectedMaterial.id, data },
        {
          onSuccess: () => {
            setShowDialog(false);
            setSelectedMaterial(null);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setShowDialog(false);
          setSelectedMaterial(null);
        },
      });
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  // TODO: Implement CSV export via backend API endpoint
  const handleExport = async () => {
    try {
      // This will need a backend endpoint like: GET /materials/export/csv
      // For now, we'll do a client-side CSV generation as fallback
      const headers = ['Code', 'Name', 'Category', 'Quantity', 'Unit', 'Unit Price'];
      const rows = materials.map(m => [
        m.code || '',
        m.name || '',
        m.category || '',
        m.quantity || 0,
        m.unit || '',
        m.unitPrice || 0,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials_${new Date().toISOString().split('T')[0]}.csv`;
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
      // This will need a backend endpoint like: POST /materials/import/csv
      // For now, just show a message
      alert('CSV Import requires backend API endpoint implementation');
      // const text = await file.text();
      // const response = await apiClient.post('/materials/import/csv', { csvData: text });
      // alert(`Import réussi: ${response.data.created} créés, ${response.data.updated} mis à jour`);
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Transform data to match component expectations (snake_case)
  const transformedMaterials = materials.map(material => ({
    ...material,
    unit_price: material.unitPrice,
    min_stock: material.minStock,
    is_active: material.isActive,
    created_date: material.createdAt,
    updated_date: material.updatedAt,
  }));

  const filteredMaterials = transformedMaterials.filter(material => {
    const matchesSearch = searchTerm === "" ||
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || material.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventaire de Matériaux</h1>
          <p className="text-slate-500 mt-1">Gérer l'inventaire des matériaux</p>
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
              setSelectedMaterial(null);
              setShowDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Matériel
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Rechercher matériaux..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>

        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="fiber_optic">Fibre Optique</TabsTrigger>
            <TabsTrigger value="cable">Câble</TabsTrigger>
            <TabsTrigger value="equipment">Équipement</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <MaterialsList
        materials={filteredMaterials}
        isLoading={isLoading}
        onMaterialClick={(material) => {
          setSelectedMaterial(material);
          setShowDialog(true);
        }}
        onDelete={handleDelete}
      />

      {showDialog && (
        <MaterialDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedMaterial(null);
          }}
          onSave={handleSave}
          material={selectedMaterial}
        />
      )}
    </div>
  );
}
