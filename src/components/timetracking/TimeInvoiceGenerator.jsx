import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTaxCalculation } from "@/components/shared/useTaxCalculation";
import { INVOICE_STATUS, TIME_ENTRY_STATUS } from "@/constants/statuses";

export default function TimeInvoiceGenerator({ entries, technicians, jobs, lang = 'fr' }) {
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  // Filter entries based on selection
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      /**
       * AUDIT FIX: High Priority Issue #11 - Time Entry Invoice Tracking
       * Filter out entries that have already been invoiced to prevent double billing
       */
      const matchesJob = !selectedJob || entry.job_id === selectedJob;
      const matchesTech = !selectedTechnician || entry.technician_id === selectedTechnician;
      const isCompleted = entry.status === TIME_ENTRY_STATUS.COMPLETED || entry.status === TIME_ENTRY_STATUS.APPROVED;
      const notInvoiced = !entry.invoice_id; // CRITICAL: Prevent double billing
      return matchesJob && matchesTech && isCompleted && notInvoiced;
    });
  }, [entries, selectedJob, selectedTechnician]);

  // Count already invoiced entries for information
  const invoicedEntriesCount = useMemo(() => {
    return entries.filter(entry => {
      const matchesJob = !selectedJob || entry.job_id === selectedJob;
      const matchesTech = !selectedTechnician || entry.technician_id === selectedTechnician;
      const isInvoiced = !!entry.invoice_id;
      return matchesJob && matchesTech && isInvoiced;
    }).length;
  }, [entries, selectedJob, selectedTechnician]);

  // Calculate totals
  const { totalHours, totalAmount, lineItems } = useMemo(() => {
    const selectedEntriesArray = filteredEntries.filter(e => selectedEntries.has(e.id));
    const hours = selectedEntriesArray.reduce((sum, e) => sum + (e.total_hours || 0), 0);
    
    // Group by technician for line items
    const technicianGroups = {};
    selectedEntriesArray.forEach(entry => {
      if (!technicianGroups[entry.technician_id]) {
        const tech = technicians.find(t => t.id === entry.technician_id);
        technicianGroups[entry.technician_id] = {
          name: entry.technician_name,
          hours: 0,
          rate: parseFloat(hourlyRate) || tech?.hourly_rate || 0
        };
      }
      technicianGroups[entry.technician_id].hours += entry.total_hours || 0;
    });

    const items = Object.values(technicianGroups).map(group => ({
      description: `${lang === 'fr' ? 'Main-d\'œuvre' : 'Labor'} - ${group.name}`,
      quantity: group.hours,
      unit_price: group.rate,
      total: group.hours * group.rate,
      type: 'item'
    }));

    const amount = items.reduce((sum, item) => sum + item.total, 0);

    return { totalHours: hours, totalAmount: amount, lineItems: items };
  }, [filteredEntries, selectedEntries, technicians, hourlyRate, lang]);

  const taxData = useTaxCalculation(totalAmount);
  const { taxes, subtotal, total } = taxData;

  const toggleEntry = (entryId) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredEntries.map(e => e.id)));
    }
  };

  const generateInvoice = async () => {
    if (lineItems.length === 0) {
      alert(lang === 'fr' ? 'Sélectionnez au moins une entrée' : 'Select at least one entry');
      return;
    }

    const job = jobs.find(j => j.id === selectedJob);
    if (!job) {
      alert(lang === 'fr' ? 'Sélectionnez un projet' : 'Select a project');
      return;
    }

    setGenerating(true);
    try {
      // Create invoice
      const invoice = await base44.entities.Invoice.create({
        job_id: job.id,
        customer_id: job.customer_id,
        customer_name: job.customer_name,
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        line_items: lineItems,
        subtotal: subtotal,
        tps: taxes.find(t => t.name.includes('TPS') || t.name.includes('GST'))?.amount || 0,
        tvq: taxes.find(t => t.name.includes('TVQ') || t.name.includes('QST'))?.amount || 0,
        total: total,
        status: INVOICE_STATUS.DRAFT,
        notes: `${lang === 'fr' ? 'Facture générée depuis' : 'Invoice generated from'} ${selectedEntries.size} ${lang === 'fr' ? 'entrées de temps' : 'time entries'}`
      });

      /**
       * AUDIT FIX: High Priority Issue #11 - Time Entry Invoice Tracking
       * Mark time entries as invoiced by setting invoice_id to prevent double billing
       */
      // Update time entries as invoiced
      const user = await base44.auth.me();
      for (const entryId of selectedEntries) {
        const entry = entries.find(e => e.id === entryId);
        await base44.entities.TimeEntry.update(entryId, {
          status: TIME_ENTRY_STATUS.APPROVED,
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number || invoice.id,
          invoiced_at: new Date().toISOString(),
          notes: entry.notes ? `${entry.notes}\n${lang === 'fr' ? 'Facturé' : 'Invoiced'} - ${invoice.invoice_number || invoice.id}` : `${lang === 'fr' ? 'Facturé' : 'Invoiced'} - ${invoice.invoice_number || invoice.id}`,
          activity_log: [
            ...(entry.activity_log || []),
            {
              timestamp: new Date().toISOString(),
              action: 'invoiced',
              details: `Time entry added to invoice ${invoice.invoice_number || invoice.id}`,
              user: user.email
            }
          ]
        });
      }

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });

      alert(lang === 'fr' 
        ? `Facture créée avec succès! Total: ${total.toFixed(2)}$` 
        : `Invoice created successfully! Total: ${total.toFixed(2)}$`);
      
      setSelectedEntries(new Set());
    } catch (error) {
      alert(lang === 'fr' ? 'Erreur lors de la création' : 'Error creating invoice');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {lang === 'fr' ? 'Générateur de Facture depuis Temps' : 'Time to Invoice Generator'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{lang === 'fr' ? 'Projet' : 'Project'}</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={lang === 'fr' ? 'Sélectionner' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  {jobs
                    .filter(j => entries.some(e => e.job_id === j.id))
                    .map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.job_number ? `#${job.job_number} - ` : ''}{job.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{lang === 'fr' ? 'Technicien (optionnel)' : 'Technician (optional)'}</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={lang === 'fr' ? 'Tous' : 'All'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>{lang === 'fr' ? 'Tous' : 'All'}</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{lang === 'fr' ? 'Taux horaire ($)' : 'Hourly Rate ($)'}</Label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder={lang === 'fr' ? 'Ex: 85' : 'Ex: 85'}
                className="mt-1"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {lang === 'fr' ? 'Sélectionner les entrées à facturer' : 'Select Entries to Invoice'}
              </CardTitle>
              {/* AUDIT FIX: High Priority Issue #11 - Show invoiced entries count */}
              {invoicedEntriesCount > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {invoicedEntriesCount} {lang === 'fr' ? 'entrée(s) déjà facturée(s) (masquée(s))' : 'entry/entries already invoiced (hidden)'}
                </p>
              )}
            </div>
            <Button onClick={toggleAll} variant="outline" size="sm">
              {selectedEntries.size === filteredEntries.length
                ? (lang === 'fr' ? 'Tout désélectionner' : 'Deselect All')
                : (lang === 'fr' ? 'Tout sélectionner' : 'Select All')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">
                {lang === 'fr' 
                  ? 'Aucune entrée de temps disponible pour ce projet' 
                  : 'No time entries available for this project'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEntries.map(entry => {
                const tech = technicians.find(t => t.id === entry.technician_id);
                const rate = parseFloat(hourlyRate) || tech?.hourly_rate || 0;
                const amount = (entry.total_hours || 0) * rate;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleEntry(entry.id)}
                  >
                    <Checkbox
                      checked={selectedEntries.has(entry.id)}
                      onCheckedChange={() => toggleEntry(entry.id)}
                    />
                    <div className="flex-1 grid grid-cols-5 gap-3 items-center">
                      <div>
                        <p className="text-sm font-medium">{format(new Date(entry.clock_in), 'dd/MM/yyyy')}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(entry.clock_in), 'HH:mm')} - 
                          {entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : '...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">{entry.technician_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{entry.total_hours?.toFixed(1) || 0}h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">{rate}$/h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{amount.toFixed(2)}$</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      {selectedEntries.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {lang === 'fr' ? 'Aperçu de la facture' : 'Invoice Preview'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Line Items */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-3">{lang === 'fr' ? 'Items de la facture' : 'Invoice Items'}</h4>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <div className="text-right">
                      <span className="text-slate-600">{item.quantity.toFixed(1)}h × {item.unit_price}$</span>
                      <span className="font-semibold ml-4">{item.total.toFixed(2)}$</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white rounded-lg p-4 border space-y-2">
              <div className="flex justify-between text-sm">
                <span>{lang === 'fr' ? 'Sous-total' : 'Subtotal'}:</span>
                <span className="font-semibold">{subtotal.toFixed(2)}$</span>
              </div>
              {taxes.map((tax, idx) => (
                <div key={idx} className="flex justify-between text-sm text-slate-600">
                  <span>{tax.name} ({tax.rate}%):</span>
                  <span>{tax.amount.toFixed(2)}$</span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>{lang === 'fr' ? 'Total' : 'Total'}:</span>
                <span className="text-green-600">{total.toFixed(2)}$</span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</p>
                <p className="text-xs text-slate-500">
                  {selectedEntries.size} {lang === 'fr' ? 'entrées sélectionnées' : 'selected entries'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{total.toFixed(2)}$</p>
                <p className="text-xs text-slate-500">
                  {lang === 'fr' ? 'Montant total' : 'Total amount'}
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateInvoice}
              disabled={generating || selectedEntries.size === 0 || !selectedJob}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
            >
              {generating ? (
                <>
                  <FileText className="w-5 h-5 mr-2 animate-pulse" />
                  {lang === 'fr' ? 'Génération...' : 'Generating...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {lang === 'fr' ? 'Générer la Facture' : 'Generate Invoice'}
                </>
              )}
            </Button>

            {!selectedJob && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded">
                <AlertCircle className="w-4 h-4" />
                {lang === 'fr' 
                  ? 'Veuillez sélectionner un projet pour générer la facture' 
                  : 'Please select a project to generate the invoice'}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}