import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Upload } from "lucide-react";

import AssetsList from "../components/assets/AssetsList";
import AssetDialog from "../components/assets/AssetDialog";
import AIMaintenancePanel from "../components/assets/AIMaintenancePanel";
import { useCsvImportExport } from "@/hooks/useCsvImportExport";

/**
 * AUDIT FIX: MEDIUM Priority Issue #20 - Refactor Duplicate CSV Patterns
 * Using centralized useCsvImportExport hook
 */

export default function Assets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();
  const { handleExport, handleImport, importing } = useCsvImportExport('assets', 'assets');

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date'),
    initialData: [],
  });



  const createAssetMutation = useMutation({
    mutationFn: (data) => {
      const assetNumber = `AST-${Date.now().toString().slice(-6)}`;
      return base44.entities.Asset.create({ ...data, asset_number: assetNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowDialog(false);
      setSelectedAsset(null);
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowDialog(false);
      setSelectedAsset(null);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setSelectedAsset(null);
    },
  });

  const handleSave = (data) => {
    if (selectedAsset?.id) {
      updateAssetMutation.mutate({ id: selectedAsset.id, data });
    } else {
      createAssetMutation.mutate(data);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const search = searchTerm.toLowerCase();
    return (
      asset.name?.toLowerCase().includes(search) ||
      asset.asset_number?.toLowerCase().includes(search) ||
      asset.brand?.toLowerCase().includes(search) ||
      asset.model?.toLowerCase().includes(search) ||
      asset.serial_number?.toLowerCase().includes(search) ||
      asset.assigned_to_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Équipements</h1>
          <p className="text-slate-500 mt-1">Gérer les outils et équipements de la compagnie</p>
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
              setSelectedAsset(null);
              setShowDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Équipement
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Rechercher par nom, marque, modèle, numéro de série..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-slate-200"
        />
      </div>

      <AIMaintenancePanel 
        assets={assets}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}
      />

      <AssetsList
        assets={filteredAssets}
        isLoading={isLoading}
        onAssetClick={(asset) => {
          setSelectedAsset(asset);
          setShowDialog(true);
        }}
        onDelete={(id) => deleteAssetMutation.mutate(id)}
      />

      {showDialog && (
        <AssetDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedAsset(null);
          }}
          onSave={handleSave}
          asset={selectedAsset}
        />
      )}
    </div>
  );
}