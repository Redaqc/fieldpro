import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// NEW: Import our custom hooks
import { useQuotationss, useCreateQuotations, useUpdateQuotations, useDeleteQuotations } from "@/hooks/useQuotationss";
import { useCustomers } from "@/hooks/useCustomers";
import { useBundless } from "@/hooks/useBundless";
import { usePriceListss } from "@/hooks/usePriceListss";

import QuotationsList from "../components/quotations/QuotationsList";
import QuotationDialog from "../components/quotations/QuotationDialog";
import QuotationStats from "../components/quotations/QuotationStats";

export default function Quotations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // NEW: Use our custom hooks
  const { data: quotationsData, isLoading } = useQuotationss({ page: 1, limit: 1000 });
  const quotations = quotationsData?.data || [];

  const { data: customersData } = useCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.data || [];

  const { data: bundlesData } = useBundless({ page: 1, limit: 1000 });
  const bundles = bundlesData?.data || [];

  const { data: priceListsData } = usePriceListss({ page: 1, limit: 1000 });
  const priceLists = priceListsData?.data || [];

  const createQuoteMutation = useCreateQuotations();
  const updateQuoteMutation = useUpdateQuotations();
  const deleteQuoteMutation = useDeleteQuotations();

  const handleSave = (data) => {
    if (selectedQuote?.id) {
      updateQuoteMutation.mutate(
        { id: selectedQuote.id, data },
        {
          onSuccess: () => {
            setShowDialog(false);
            setSelectedQuote(null);
          },
        }
      );
    } else {
      const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
      createQuoteMutation.mutate(
        { ...data, quoteNumber },
        {
          onSuccess: () => {
            setShowDialog(false);
            setSelectedQuote(null);
          },
        }
      );
    }
  };

  const handleDelete = (id) => {
    deleteQuoteMutation.mutate(id, {
      onSuccess: () => {
        setSelectedQuote(null);
      },
    });
  };

  // Transform data to match component expectations (snake_case)
  const transformedQuotations = quotations.map(quote => {
    // Find associated customer for customer_name
    const customer = customers.find(c => c.id === quote.customerId);

    return {
      ...quote,
      quote_number: quote.quoteNumber,
      customer_id: quote.customerId,
      customer_name: customer?.fullName || quote.customerName || '',
      issue_date: quote.issueDate,
      expiry_date: quote.expiryDate,
      subtotal: quote.subtotal,
      tax_amount: quote.taxAmount,
      discount_amount: quote.discountAmount,
      total_amount: quote.totalAmount,
      created_date: quote.createdAt,
      updated_date: quote.updatedAt,
    };
  });

  const transformedCustomers = customers.map(customer => ({
    ...customer,
    first_name: customer.fullName?.split(' ')[0] || '',
    last_name: customer.fullName?.split(' ').slice(1).join(' ') || '',
    company_name: customer.companyName,
    postal_code: customer.postalCode,
    billing_address: customer.billingAddress,
    is_active: customer.isActive,
  }));

  const transformedBundles = bundles.map(bundle => ({
    ...bundle,
    is_active: bundle.isActive,
    total_price: bundle.totalPrice,
  }));

  const transformedPriceLists = priceLists.map(pl => ({
    ...pl,
    is_active: pl.isActive,
    price_items: pl.priceItems,
  }));

  const filteredQuotations = transformedQuotations.filter(quote => {
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

      <QuotationStats quotations={transformedQuotations} onFilterChange={setStatusFilter} />

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
        onDelete={handleDelete}
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
          customers={transformedCustomers}
          bundles={transformedBundles}
          priceLists={transformedPriceLists}
        />
      )}
    </div>
  );
}
