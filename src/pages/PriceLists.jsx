import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import PriceListCard from "../components/pricelists/PriceListCard";
import PriceListDialog from "../components/pricelists/PriceListDialog";
import BundleDialog from "../components/pricelists/BundleDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function PriceLists() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPriceListDialog, setShowPriceListDialog] = useState(false);
  const [showBundleDialog, setShowBundleDialog] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const queryClient = useQueryClient();

  const { data: priceLists = [], isLoading: loadingPriceLists } = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => base44.entities.PriceList.list('-created_date'),
    initialData: [],
  });

  const { data: bundles = [], isLoading: loadingBundles } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => base44.entities.Bundle.list('-created_date'),
    initialData: [],
  });

  const createPriceListMutation = useMutation({
    mutationFn: (data) => base44.entities.PriceList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
      setShowPriceListDialog(false);
      setSelectedPriceList(null);
    },
  });

  const updatePriceListMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PriceList.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
      setShowPriceListDialog(false);
      setSelectedPriceList(null);
    },
  });

  const deletePriceListMutation = useMutation({
    mutationFn: (id) => base44.entities.PriceList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
      setSelectedPriceList(null);
    },
  });

  const createBundleMutation = useMutation({
    mutationFn: (data) => base44.entities.Bundle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      setShowBundleDialog(false);
      setSelectedBundle(null);
    },
  });

  const updateBundleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bundle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      setShowBundleDialog(false);
      setSelectedBundle(null);
    },
  });

  const deleteBundleMutation = useMutation({
    mutationFn: (id) => base44.entities.Bundle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      setSelectedBundle(null);
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Price Lists & Bundles</h1>
          <p className="text-slate-500 mt-1">Manage pricing and service bundles</p>
        </div>
      </div>

      <Tabs defaultValue="pricelists">
        <TabsList>
          <TabsTrigger value="pricelists">Price Lists</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
        </TabsList>

        <TabsContent value="pricelists" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search price lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-slate-200"
              />
            </div>
            <Button
              onClick={() => {
                setSelectedPriceList(null);
                setShowPriceListDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Price List
            </Button>
          </div>

          <div className="grid gap-4">
            {priceLists.map((priceList) => (
              <PriceListCard
                key={priceList.id}
                priceList={priceList}
                onEdit={() => {
                  setSelectedPriceList(priceList);
                  setShowPriceListDialog(true);
                }}
                onDelete={() => deletePriceListMutation.mutate(priceList.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bundles" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-slate-200"
              />
            </div>
            <Button
              onClick={() => {
                setSelectedBundle(null);
                setShowBundleDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Bundle
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {bundles.map((bundle) => (
              <PriceListCard
                key={bundle.id}
                priceList={bundle}
                isBundle
                onEdit={() => {
                  setSelectedBundle(bundle);
                  setShowBundleDialog(true);
                }}
                onDelete={() => deleteBundleMutation.mutate(bundle.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showPriceListDialog && (
        <PriceListDialog
          open={showPriceListDialog}
          onClose={() => {
            setShowPriceListDialog(false);
            setSelectedPriceList(null);
          }}
          onSave={(data) => {
            if (selectedPriceList?.id) {
              updatePriceListMutation.mutate({ id: selectedPriceList.id, data });
            } else {
              createPriceListMutation.mutate(data);
            }
          }}
          priceList={selectedPriceList}
        />
      )}

      {showBundleDialog && (
        <BundleDialog
          open={showBundleDialog}
          onClose={() => {
            setShowBundleDialog(false);
            setSelectedBundle(null);
          }}
          onSave={(data) => {
            if (selectedBundle?.id) {
              updateBundleMutation.mutate({ id: selectedBundle.id, data });
            } else {
              createBundleMutation.mutate(data);
            }
          }}
          bundle={selectedBundle}
        />
      )}
    </div>
  );
}