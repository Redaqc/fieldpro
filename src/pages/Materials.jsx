import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import MaterialsList from "../components/materials/MaterialsList";
import MaterialDialog from "../components/materials/MaterialDialog";
import { useCsvImportExport } from "@/hooks/useCsvImportExport";

/**
 * AUDIT FIX: MEDIUM Priority Issue #20 - Refactor Duplicate CSV Patterns
 * Using centralized useCsvImportExport hook
 */

export default function Materials() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const queryClient = useQueryClient();
  const { handleExport, handleImport, importing } = useCsvImportExport('materials', 'materials');

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Material.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowDialog(false);
      setSelectedMaterial(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Material.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowDialog(false);
      setSelectedMaterial(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Material.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  const handleSave = (data) => {
    if (selectedMaterial?.id) {
      updateMutation.mutate({ id: selectedMaterial.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredMaterials = materials.filter(material => {
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
        onDelete={(id) => deleteMutation.mutate(id)}
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