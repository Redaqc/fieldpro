import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import QuotationsList from "../components/quotations/QuotationsList";
import QuotationDialog from "../components/quotations/QuotationDialog";
import QuotationStats from "../components/quotations/QuotationStats";

export default function Quotations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => base44.entities.Quotation.list('-created_date'),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => base44.entities.Bundle.list(),
    initialData: [],
  });

  const { data: priceLists = [] } = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => base44.entities.PriceList.list(),
    initialData: [],
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data) => {
      const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
      return base44.entities.Quotation.create({ ...data, quote_number: quoteNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowDialog(false);
      setSelectedQuote(null);
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quotation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowDialog(false);
      setSelectedQuote(null);
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quotation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setSelectedQuote(null);
    },
  });

  const handleSave = (data) => {
    if (selectedQuote?.id) {
      updateQuoteMutation.mutate({ id: selectedQuote.id, data });
    } else {
      createQuoteMutation.mutate(data);
    }
  };

  const filteredQuotations = quotations.filter(quote => {
    const matchesSearch = searchTerm === "" ||
      quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quotations</h1>
          <p className="text-slate-500 mt-1">Create and manage customer quotes</p>
        </div>
        <Button
          onClick={() => {
            setSelectedQuote(null);
            setShowDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      <QuotationStats quotations={quotations} />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <QuotationsList
        quotations={filteredQuotations}
        isLoading={isLoading}
        onQuoteClick={(quote) => {
          setSelectedQuote(quote);
          setShowDialog(true);
        }}
        onDelete={(id) => deleteQuoteMutation.mutate(id)}
      />

      {showDialog && (
        <QuotationDialog
          open={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedQuote(null);
          }}
          onSave={handleSave}
          quotation={selectedQuote}
          customers={customers}
          bundles={bundles}
          priceLists={priceLists}
        />
      )}
    </div>
  );
}