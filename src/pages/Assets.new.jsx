import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Upload } from "lucide-react";

// NEW: Import our custom hooks
import { useAssetss, useCreateAssets, useUpdateAssets, useDeleteAssets } from "@/hooks/useAssetss";

import AssetsList from "../components/assets/AssetsList";
import AssetDialog from "../components/assets/AssetDialog";
import AIMaintenancePanel from "../components/assets/AIMaintenancePanel";

export default function Assets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [importing, setImporting] = useState(false);

  // NEW: Use our custom hooks
  const { data: assetsData, isLoading, refetch } = useAssetss({ page: 1, limit: 1000 });
  const assets = assetsData?.data || [];

  const createAssetMutation = useCreateAssets();
  const updateAssetMutation = useUpdateAssets();
  const deleteAssetMutation = useDeleteAssets();

  const handleSave = (data) => {
    if (selectedAsset?.id) {
      updateAssetMutation.mutate(
        { id: selectedAsset.id, data },
        {
          onSuccess: () => {
            setShowDialog(false);
            setSelectedAsset(null);
          },
        }
      );
    } else {
      const assetNumber = `AST-${Date.now().toString().slice(-6)}`;
      createAssetMutation.mutate(
        { ...data, assetNumber },
        {
          onSuccess: () => {
            setShowDialog(false);
            setSelectedAsset(null);
          },
        }
      );
    }
  };

  const handleDelete = (id) => {
    deleteAssetMutation.mutate(id, {
      onSuccess: () => {
        setSelectedAsset(null);
      },
    });
  };

  // TODO: Implement CSV export via backend API endpoint
  const handleExport = async () => {
    try {
      // This will need a backend endpoint like: GET /assets/export/csv
      // For now, we'll do a client-side CSV generation as fallback
      const headers = ['Asset Number', 'Name', 'Brand', 'Model', 'Serial Number', 'Purchase Date', 'Status'];
      const rows = transformedAssets.map(a => [
        a.asset_number || '',
        a.name || '',
        a.brand || '',
        a.model || '',
        a.serial_number || '',
        a.purchase_date || '',
        a.status || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assets_${new Date().toISOString().split('T')[0]}.csv`;
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
      // This will need a backend endpoint like: POST /assets/import/csv
      // For now, just show a message
      alert('CSV Import requires backend API endpoint implementation');
      // const text = await file.text();
      // const response = await apiClient.post('/assets/import/csv', { csvData: text });
      // alert(`Import réussi: ${response.data.created} créés, ${response.data.updated} mis à jour`);
      refetch();
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Transform data to match component expectations (snake_case)
  const transformedAssets = assets.map(asset => ({
    ...asset,
    asset_number: asset.assetNumber,
    serial_number: asset.serialNumber,
    purchase_date: asset.purchaseDate,
    purchase_price: asset.purchasePrice,
    assigned_to: asset.assignedTo,
    assigned_to_name: asset.assignedToName,
    last_maintenance: asset.lastMaintenance,
    next_maintenance: asset.nextMaintenance,
    is_active: asset.isActive,
    created_date: asset.createdAt,
    updated_date: asset.updatedAt,
  }));

  const filteredAssets = transformedAssets.filter(asset => {
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
        assets={transformedAssets}
        onRefresh={refetch}
      />

      <AssetsList
        assets={filteredAssets}
        isLoading={isLoading}
        onAssetClick={(asset) => {
          setSelectedAsset(asset);
          setShowDialog(true);
        }}
        onDelete={handleDelete}
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
