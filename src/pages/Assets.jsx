import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import AssetsList from "../components/assets/AssetsList";
import AssetDialog from "../components/assets/AssetDialog";

export default function Assets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list('-created_date'),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
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
      asset.customer_name?.toLowerCase().includes(search) ||
      asset.serial_number?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assets</h1>
          <p className="text-slate-500 mt-1">Track customer equipment and assets</p>
        </div>
        <Button
          onClick={() => {
            setSelectedAsset(null);
            setShowDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search assets by name, number, customer, or serial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-slate-200"
        />
      </div>

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
          customers={customers}
        />
      )}
    </div>
  );
}