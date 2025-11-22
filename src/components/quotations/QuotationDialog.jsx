import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, List, FileText, Heading, Copy, Minus, GripVertical, FileDown } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { addDays, format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useTaxCalculation } from "@/components/shared/useTaxCalculation";

export default function QuotationDialog({ open, onClose, onSave, quotation, customers, bundles, priceLists }) {
  const [formData, setFormData] = useState(quotation || {
    customer_id: "",
    customer_name: "",
    project_name: "",
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    expiry_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    auto_expire_enabled: true,
    auto_expire_days: 30,
    work_start_date: "",
    sent_date: "",
    accepted_date: "",
    status: "draft",
    line_items: [],
    submission_items: [],
    bundles: [],
    subtotal: 0,
    submission_subtotal: 0,
    tax_rate: 5,
    tax_rate_2: 9.975,
    tax_amount: 0,
    tax_amount_2: 0,
    total_amount: 0,
    notes: "",
    terms: "",
    submission_body: ""
  });

  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [showPriceListDialog, setShowPriceListDialog] = useState(false);
  const [showBundleSelector, setShowBundleSelector] = useState(false);
  const [showBundleCreator, setShowBundleCreator] = useState(false);
  const [newBundleName, setNewBundleName] = useState("");
  const [newBundleDescription, setNewBundleDescription] = useState("");
  const [showAllVariables, setShowAllVariables] = useState(false);
  const [itemsFrozen, setItemsFrozen] = useState(false);
  const [showSubtotalsOnly, setShowSubtotalsOnly] = useState(false);
  const [showGrandTotalOnly, setShowGrandTotalOnly] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list(),
    initialData: [],
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      handleChange('customer_id', customerId);
      handleChange('customer_name', `${customer.first_name} ${customer.last_name}`);
      handleChange('customer_price_list_id', customer.price_list_id);
    }
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: "", quantity: 1, unit_price: 0, total: 0, type: "item" }]
    }));
  };

  const addItemFromPriceList = (priceListItem) => {
    const newItem = {
      description: priceListItem.service_name,
      quantity: 1,
      unit_price: priceListItem.unit_price,
      total: priceListItem.unit_price,
      type: "item"
    };
    const newItems = [...formData.line_items, newItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems, formData.bundles);
    setShowPriceListDialog(false);
  };

  const addTitle = () => {
    const titleItem = {
      description: "Title Section",
      quantity: 0,
      unit_price: 0,
      total: 0,
      type: "title"
    };
    const newItems = selectedItemIndex !== null 
      ? [...formData.line_items.slice(0, selectedItemIndex + 1), titleItem, ...formData.line_items.slice(selectedItemIndex + 1)]
      : [...formData.line_items, titleItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const addDescription = () => {
    const descItem = {
      description: "Description text...",
      quantity: 0,
      unit_price: 0,
      total: 0,
      type: "description"
    };
    const newItems = selectedItemIndex !== null 
      ? [...formData.line_items.slice(0, selectedItemIndex + 1), descItem, ...formData.line_items.slice(selectedItemIndex + 1)]
      : [...formData.line_items, descItem];
    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const addBundleItems = (bundleId) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle || !bundle.items) return;
    
    const bundleItems = bundle.items.map(item => ({
      description: item.service_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      type: "item"
    }));
    
    const newItems = [...formData.line_items, ...bundleItems];
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems, formData.bundles);
    setShowBundleSelector(false);
  };

  const toggleItemSelection = (index) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter(i => i !== index));
    } else {
      setSelectedItems([...selectedItems, index]);
    }
  };

  const createBundleFromItems = async () => {
    if (!newBundleName.trim()) {
      alert("Entrez un nom pour le bundle");
      return;
    }
    
    if (selectedItems.length === 0) {
      alert("Sélectionnez au moins un item");
      return;
    }

    const itemsForBundle = selectedItems
      .map(index => formData.line_items[index])
      .filter(item => item.type === "item" && item.total > 0);
    
    if (itemsForBundle.length === 0) {
      alert("Aucun item valide sélectionné");
      return;
    }

    const bundleItems = itemsForBundle.map(item => ({
      service_name: item.description,
      description: "",
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const originalPrice = itemsForBundle.reduce((sum, item) => sum + item.total, 0);
    const bundlePrice = originalPrice * 0.9;

    try {
      await base44.entities.Bundle.create({
        name: newBundleName,
        description: newBundleDescription,
        items: bundleItems,
        bundle_price: bundlePrice,
        original_price: originalPrice,
        discount_percentage: 10,
        status: "active"
      });
      
      alert("Bundle créé avec succès!");
      setShowBundleCreator(false);
      setNewBundleName("");
      setNewBundleDescription("");
      setSelectedItems([]);
    } catch (error) {
      alert("Échec de la création du bundle");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.line_items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFormData(prev => ({ ...prev, line_items: items }));
  };



  const generatePDF = async () => {
    const customer = customers.find(c => c.id === formData.customer_id);
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Soumission ${formData.quote_number || 'DRAFT'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .company-info { text-align: right; }
    .title { font-size: 32px; font-weight: bold; margin: 20px 0; }
    .subtitle { font-size: 14px; color: #666; margin-bottom: 30px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #333; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .section-header { background: #f5f5f5; font-weight: bold; padding: 8px; }
    .totals { margin-top: 30px; text-align: right; }
    .totals-row { display: flex; justify-content: flex-end; margin: 5px 0; }
    .totals-label { width: 200px; text-align: right; margin-right: 20px; }
    .totals-value { width: 150px; text-align: right; font-weight: bold; }
    .total-final { font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin: 0; color: #4A90E2;">Novatel Inc.</h1>
    </div>
    <div class="company-info">
      <p style="margin: 2px 0;">1755 Boucault</p>
      <p style="margin: 2px 0;">Longueuil (Québec) J4M 1V1</p>
      <p style="margin: 2px 0;">info@company.com</p>
      <p style="margin: 2px 0;">(514) 974-0864</p>
    </div>
  </div>

  <div class="title">SOUMISSION</div>
  <div class="subtitle">Soumission #${formData.quote_number || 'DRAFT'}, ${format(new Date(formData.issue_date), 'dd MMMM yyyy')}</div>

  <table style="border: none; margin-bottom: 30px;">
    <tr>
      <td style="border: none; width: 33%; vertical-align: top;">
        <div class="section-title">Soumission pour:</div>
        <div><strong>${customer?.company_name || formData.customer_name}</strong></div>
        <div>${customer?.email || ''}</div>
        <div>${customer?.phone || ''}</div>
        <div>${customer?.address || ''}</div>
        <div>${customer?.city || ''} ${customer?.state || ''}</div>
        <div>${customer?.zip_code || ''}</div>
      </td>
      <td style="border: none; width: 33%; vertical-align: top;">
        <div class="section-title">Projet:</div>
        <div>${formData.project_name || '-'}</div>
        ${formData.work_start_date ? `<div style="margin-top: 10px;">Date de début: ${format(new Date(formData.work_start_date), 'dd MMM yyyy')}</div>` : ''}
      </td>
      <td style="border: none; width: 33%; vertical-align: top;">
        <div class="section-title">Statut:</div>
        <div style="color: ${formData.status === 'accepted' ? 'green' : '#666'};">
          ${formData.status === 'accepted' ? 'Soumission approuvée' : formData.status === 'sent' ? 'Envoyée' : 'Brouillon'}
        </div>
      </td>
    </tr>
  </table>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align: center;">Quantité</th>
        <th style="text-align: right;">Coût unitaire</th>
        <th style="text-align: right;">Coût total</th>
      </tr>
    </thead>
    <tbody>
      ${formData.submission_items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${item.unit_price.toFixed(2)}$</td>
          <td style="text-align: right;">${item.total.toFixed(2)}$</td>
        </tr>
      `).join('')}
      <tr>
        <td colspan="3" style="text-align: right; font-weight: bold;">Sous-total</td>
        <td style="text-align: right; font-weight: bold;">${formData.submission_subtotal.toFixed(2)}$</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <div class="totals-label">Total avant taxes</div>
      <div class="totals-value">${formData.submission_subtotal.toFixed(2)}$</div>
    </div>
    <div class="totals-row">
      <div class="totals-label">TVQ (${formData.tax_rate_2}%)</div>
      <div class="totals-value">${formData.tax_amount_2.toFixed(2)}$</div>
    </div>
    <div class="totals-row">
      <div class="totals-label">TPS (${formData.tax_rate}%)</div>
      <div class="totals-value">${formData.tax_amount.toFixed(2)}$</div>
    </div>
    <div class="totals-row total-final">
      <div class="totals-label">Total</div>
      <div class="totals-value">${formData.total_amount.toFixed(2)}$</div>
    </div>
  </div>

  <div style="margin-top: 40px; font-size: 12px; color: #666;">
    Soumission valide pour 30 jours
  </div>
</body>
</html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    await handleSubmit(submitEvent);
  };

  const sendQuotationEmail = async () => {
    const customer = customers.find(c => c.id === formData.customer_id);
    if (!customer?.email) {
      alert('Customer email not found');
      return;
    }

    const emailBody = `
Bonjour ${formData.customer_name},

Voici votre soumission ${formData.quote_number}
${formData.project_name ? `Projet: ${formData.project_name}` : ''}

Articles:
${formData.submission_items.map(item => 
  `${item.description} - Quantité: ${item.quantity} - Prix unitaire: $${item.unit_price} - Total: $${item.total.toFixed(2)}`
).join('\n')}

Sous-total: $${formData.submission_subtotal.toFixed(2)}
TPS (${formData.tax_rate}%): $${formData.tax_amount.toFixed(2)}
TVQ (${formData.tax_rate_2}%): $${formData.tax_amount_2.toFixed(2)}
TOTAL: $${formData.total_amount.toFixed(2)}

Merci de votre confiance.
    `;

    try {
      await base44.integrations.Core.SendEmail({
        to: customer.email,
        subject: `Soumission ${formData.quote_number} - ${formData.project_name || 'Votre projet'}`,
        body: emailBody
      });
      
      handleChange('status', 'sent');
      if (!formData.sent_date) {
        handleChange('sent_date', format(new Date(), 'yyyy-MM-dd'));
      }
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      await handleSubmit(submitEvent);
      alert('Email envoyé avec succès!');
    } catch (error) {
      alert('Erreur lors de l\'envoi de l\'email');
    }
  };

  const scheduleLater = async () => {
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    await handleSubmit(submitEvent);
  };

  const copyToSubmission = () => {
    const itemsToCopy = formData.line_items.filter(item => item.type === "item").map(item => ({...item}));
    setFormData(prev => ({ 
      ...prev, 
      submission_items: itemsToCopy
    }));
    calculateSubmissionTotals(itemsToCopy);
  };

  const addSubmissionItem = () => {
    const newItems = [...formData.submission_items, { description: "", quantity: 1, unit_price: 0, total: 0, type: "item" }];
    setFormData(prev => ({ ...prev, submission_items: newItems }));
  };

  const updateSubmissionItem = (index, field, value) => {
    const newItems = [...formData.submission_items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    
    setFormData(prev => ({ ...prev, submission_items: newItems }));
    calculateSubmissionTotals(newItems);
  };

  const removeSubmissionItem = (index) => {
    const newItems = formData.submission_items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, submission_items: newItems }));
    calculateSubmissionTotals(newItems);
  };

  const submissionSubtotal = formData.submission_items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  const { taxes: submissionTaxes, total: submissionTotal } = useTaxCalculation(submissionSubtotal, formData.customer_province);

  const calculateSubmissionTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    
    setFormData(prev => ({
      ...prev,
      submission_subtotal: subtotal
    }));
  };



  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }
    
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems, formData.bundles);
  };

  const removeLineItem = (index) => {
    const newItems = formData.line_items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, line_items: newItems }));
    calculateTotals(newItems, formData.bundles);
  };

  const addBundle = (bundleId) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;
    
    const newBundle = {
      bundle_id: bundle.id,
      bundle_name: bundle.name,
      quantity: 1,
      total: bundle.bundle_price
    };
    
    const newBundles = [...formData.bundles, newBundle];
    setFormData(prev => ({ ...prev, bundles: newBundles }));
    calculateTotals(formData.line_items, newBundles);
  };

  const updateBundleQty = (index, quantity) => {
    const newBundles = [...formData.bundles];
    const bundle = bundles.find(b => b.id === newBundles[index].bundle_id);
    newBundles[index].quantity = quantity;
    newBundles[index].total = quantity * bundle.bundle_price;
    
    setFormData(prev => ({ ...prev, bundles: newBundles }));
    calculateTotals(formData.line_items, newBundles);
  };

  const removeBundle = (index) => {
    const newBundles = formData.bundles.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, bundles: newBundles }));
    calculateTotals(formData.line_items, newBundles);
  };

  const subtotalValue = formData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
  const { taxes, total: calculatedTotal, showTaxesInQuotes } = useTaxCalculation(subtotalValue, formData.customer_province);

  const calculateTotals = (items, bundleItems) => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const bundlesTotal = bundleItems?.reduce((sum, bundle) => sum + (bundle.total || 0), 0) || 0;
    const subtotal = itemsTotal + bundlesTotal;
    
    setFormData(prev => ({
      ...prev,
      subtotal
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation ? 'Edit Quotation' : 'Create New Quotation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Row 1 */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-semibold">Customer *</Label>
              <Select value={formData.customer_id} onValueChange={handleCustomerSelect} required>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Numéro de Facture</Label>
              <Input
                value={formData.quote_number || ''}
                onChange={(e) => handleChange('quote_number', e.target.value)}
                placeholder="Auto-généré"
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Numéro de PO</Label>
              <Input
                value={formData.po_number || ''}
                onChange={(e) => handleChange('po_number', e.target.value)}
                placeholder="Numéro PO"
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Date de Début des Travaux</Label>
              <Input
                type="date"
                value={formData.work_start_date}
                onChange={(e) => handleChange('work_start_date', e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Header Row 2 */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-semibold">Nom du Projet</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => handleChange('project_name', e.target.value)}
                placeholder="Nom du projet"
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Issue Date *</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleChange('issue_date', e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Sent Date</Label>
              <Input
                type="date"
                value={formData.sent_date}
                onChange={(e) => handleChange('sent_date', e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Auto-Expire Options */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="auto_expire"
                checked={formData.auto_expire_enabled}
                onChange={(e) => {
                  handleChange('auto_expire_enabled', e.target.checked);
                  if (e.target.checked && formData.issue_date) {
                    handleChange('expiry_date', format(addDays(new Date(formData.issue_date), formData.auto_expire_days || 30), 'yyyy-MM-dd'));
                  }
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="auto_expire" className="text-sm font-semibold cursor-pointer">
                Auto-expire estimate after specified days
              </Label>
            </div>
            {formData.auto_expire_enabled && (
              <div>
                <Label className="text-xs font-semibold">Days until expiration</Label>
                <Input
                  type="number"
                  value={formData.auto_expire_days}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 30;
                    handleChange('auto_expire_days', days);
                    if (formData.issue_date) {
                      handleChange('expiry_date', format(addDays(new Date(formData.issue_date), days), 'yyyy-MM-dd'));
                    }
                  }}
                  min="1"
                  className="h-9"
                  placeholder="30"
                />
              </div>
            )}
          </div>

          {/* Cost Calculator Section */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-slate-900">My Cost Calculator</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAllVariables(!showAllVariables)}>
                  <span className="text-xs font-bold">{showAllVariables ? 'Hide' : 'Show'} Variables</span>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setItemsFrozen(!itemsFrozen)}>
                  <span className="text-xs font-bold">{itemsFrozen ? 'Unfreeze' : 'Freeze'} Items</span>
                </Button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={addLineItem} disabled={itemsFrozen}>
                <Plus className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Add</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPriceListDialog(true)} disabled={itemsFrozen}>
                <List className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Items</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addTitle} disabled={itemsFrozen}>
                <Heading className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Title</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addDescription} disabled={itemsFrozen}>
                <FileText className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Description</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowBundleSelector(true)} disabled={itemsFrozen}>
                <Package className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Choose from Bundle</span>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowBundleCreator(true)} 
                disabled={itemsFrozen || selectedItems.length === 0}
                className={selectedItems.length > 0 ? 'bg-blue-50 border-blue-300' : ''}
              >
                <Package className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Create Bundle {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowMaterialSelector(true)} disabled={itemsFrozen}>
                <Package className="w-3 h-3 mr-1" />
                <span className="font-bold text-xs">Matériaux</span>
              </Button>
            </div>

            {/* Items Table Header */}
            <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-slate-600">
              <div className="col-span-1 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedItems.length === formData.line_items.filter(i => i.type === 'item').length && selectedItems.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(formData.line_items.map((_, idx) => idx).filter(idx => formData.line_items[idx].type === 'item'));
                    } else {
                      setSelectedItems([]);
                    }
                  }}
                  className="w-3 h-3"
                />
              </div>
              <div className="col-span-5">Item</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Items List with Drag & Drop */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="line-items">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="space-y-1 mb-4 max-h-64 overflow-y-auto"
                  >
                    {formData.line_items.map((item, index) => (
                      <Draggable key={`item-${index}`} draggableId={`item-${index}`} index={index} isDragDisabled={itemsFrozen}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? 'opacity-50' : ''}
                          >
                            {(() => {
                              if (item.type === "title") {
                                return (
                                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                                    </div>
                                    <Input
                                      placeholder="Title"
                                      value={item.description}
                                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                      className="font-bold border-0 bg-transparent h-8"
                                      disabled={itemsFrozen}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-7 w-7" disabled={itemsFrozen}>
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                );
                              }
                              
                              if (item.type === "description") {
                                return (
                                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                                    </div>
                                    <Textarea
                                      placeholder="Description"
                                      value={item.description}
                                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                      className="text-xs border-0 bg-transparent min-h-[60px]"
                                      disabled={itemsFrozen}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-7 w-7" disabled={itemsFrozen}>
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                );
                              }

                              return (
                                <div className="grid grid-cols-12 gap-2 p-2 hover:bg-slate-50 rounded items-center">
                                  <div className="col-span-1 flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedItems.includes(index)}
                                      onChange={() => toggleItemSelection(index)}
                                      className="w-3 h-3"
                                    />
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                                    </div>
                                  </div>
                                  <div className="col-span-5">
                                    <Input
                                      placeholder="Item description"
                                      value={item.description}
                                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                      className="h-8 text-sm"
                                      disabled={itemsFrozen}
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="h-8 text-sm"
                                      disabled={itemsFrozen}
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <Input
                                      type="number"
                                      value={item.unit_price}
                                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                      step="0.01"
                                      className="h-8 text-sm"
                                      disabled={itemsFrozen}
                                    />
                                  </div>
                                  <div className="col-span-1 text-right">
                                    <span className="font-semibold text-sm">${(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="col-span-1 flex justify-center">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-7 w-7" disabled={itemsFrozen}>
                                      <Minus className="w-3 h-3 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Totals */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-end">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total:</span>
                    <span className="font-semibold">${subtotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {showTaxesInQuotes && taxes.map((tax, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{tax.name} ({tax.rate}%):</span>
                      <span className="font-semibold">${tax.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Content Section */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-slate-900">Submission Content</h3>
              <Button type="button" size="sm" onClick={copyToSubmission} className="bg-blue-500 hover:bg-blue-600">
                <Copy className="w-3 h-3 mr-1" />
                <span className="text-xs font-bold">Copy to Submission</span>
              </Button>
            </div>

            {/* Items Table Header */}
            <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-slate-600">
              <div className="col-span-6">Item</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Action Buttons for Submission */}
            <div className="flex gap-2 mb-3">
              <Button type="button" variant="outline" size="sm" onClick={addSubmissionItem}>
                <Plus className="w-3 h-3 mr-1" />
                <span className="text-xs font-bold">Add Item</span>
              </Button>
            </div>

            {/* Editable Submission Items */}
            <div className="space-y-1 mb-4 min-h-[100px] max-h-48 overflow-y-auto bg-slate-50 rounded p-2">
              {formData.submission_items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Click "Copy to Submission" to add items</p>
              ) : (
                formData.submission_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center p-1 hover:bg-slate-100 rounded">
                    <div className="col-span-5">
                      <Input
                        value={item.description}
                        onChange={(e) => updateSubmissionItem(index, 'description', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateSubmissionItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateSubmissionItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs font-semibold">${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSubmissionItem(index)} className="h-6 w-6">
                        <Minus className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Provincial Tax Inputs */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Provincial Tax Title:</Label>
                <Input className="w-48 h-8 text-sm" placeholder="TPS (5%)" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Federal Tax Title:</Label>
                <Input className="w-48 h-8 text-sm" placeholder="TVQ (9.975%)" />
              </div>
            </div>

            {/* Summary Totals */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Sous-total:</span>
                <span className="font-semibold">${submissionSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {submissionTaxes.map((tax, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span>{tax.name} ({tax.rate}%):</span>
                  <span className="font-semibold">${tax.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total:</span>
                <span>${submissionTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Display Options */}
            <div className="flex gap-4 mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSubtotalsOnly(!showSubtotalsOnly)} className={showSubtotalsOnly ? 'bg-blue-100' : ''}>
                <span className="text-xs font-bold">Subtotals and Grand Total</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowGrandTotalOnly(!showGrandTotalOnly)} className={showGrandTotalOnly ? 'bg-blue-100' : ''}>
                <span className="text-xs font-bold">Grand Total Only</span>
              </Button>
            </div>

            {/* Profit Section */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Profit on this cost:</span>
                <span className="font-bold text-green-600">${(formData.submission_subtotal - formData.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <Label className="text-sm mb-1">Additional Information</Label>
            <Textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={2}
              placeholder="Add project details, notes, or attachments..."
              className="text-sm"
            />
          </div>

          {/* Price List Items Dialog */}
          {showPriceListDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPriceListDialog(false)}>
              <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Select Item from Customer's Price List</h3>
                <div className="space-y-2">
                  {(() => {
                    const customer = customers.find(c => c.id === formData.customer_id);
                    const customerPriceList = priceLists.find(pl => pl.id === customer?.price_list_id);
                    
                    if (!customer?.price_list_id || !customerPriceList) {
                      return <p className="text-sm text-slate-500">No price list assigned to this customer. Using all price lists.</p>;
                    }
                    
                    const itemsToShow = customerPriceList ? customerPriceList.items || [] : priceLists.flatMap(pl => pl.items || []);
                    
                    return itemsToShow.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer" onClick={() => addItemFromPriceList(item)}>
                        <div>
                          <p className="font-medium">{item.service_name}</p>
                          <p className="text-sm text-slate-500">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${item.unit_price}</p>
                          <p className="text-xs text-slate-500">{item.unit}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                <Button type="button" className="mt-4 w-full" onClick={() => setShowPriceListDialog(false)}>Close</Button>
              </div>
            </div>
          )}

          {/* Bundle Selector Dialog */}
          {showBundleSelector && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBundleSelector(false)}>
              <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Choose Bundle</h3>
                <div className="space-y-2">
                  {bundles.filter(b => b.status === 'active').map(bundle => (
                    <div 
                      key={bundle.id} 
                      className="flex justify-between items-center p-3 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer" 
                      onClick={() => addBundleItems(bundle.id)}
                    >
                      <div>
                        <p className="font-medium">{bundle.name}</p>
                        <p className="text-sm text-slate-500">{bundle.description}</p>
                        <p className="text-xs text-slate-400">{bundle.items?.length || 0} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${bundle.bundle_price}</p>
                        {bundle.discount_percentage > 0 && (
                          <p className="text-xs text-green-600">{bundle.discount_percentage}% off</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" className="mt-4 w-full" onClick={() => setShowBundleSelector(false)}>Close</Button>
              </div>
            </div>
          )}

          {/* Bundle Creator Dialog */}
          {showBundleCreator && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBundleCreator(false)}>
              <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Créer Bundle avec Items Sélectionnés</h3>
                
                {/* Show selected items */}
                <div className="mb-4 p-3 bg-slate-50 rounded max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Items sélectionnés ({selectedItems.length}):</p>
                  {selectedItems.map(idx => {
                    const item = formData.line_items[idx];
                    return (
                      <div key={idx} className="text-xs text-slate-700 py-1">
                        • {item.description} - Qty: {item.quantity} - ${item.total?.toFixed(2)}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Nom du Bundle</Label>
                    <Input
                      value={newBundleName}
                      onChange={(e) => setNewBundleName(e.target.value)}
                      placeholder="Entrez le nom du bundle"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newBundleDescription}
                      onChange={(e) => setNewBundleDescription(e.target.value)}
                      placeholder="Entrez la description du bundle"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={createBundleFromItems}>
                      Créer Bundle
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowBundleCreator(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Material Selector Dialog */}
          {showMaterialSelector && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMaterialSelector(false)}>
              <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Sélectionner Matériel</h3>
                <div className="space-y-2">
                  {materials.filter(m => m.status === 'active').map((material) => (
                    <div
                      key={material.id}
                      className="flex justify-between items-center p-3 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer"
                      onClick={() => {
                        const newItem = {
                          description: material.name,
                          quantity: 1,
                          unit_price: material.unit_price,
                          total: material.unit_price,
                          type: "item"
                        };
                        const newItems = [...formData.line_items, newItem];
                        setFormData(prev => ({ ...prev, line_items: newItems }));
                        calculateTotals(newItems, formData.bundles);
                        setShowMaterialSelector(false);
                      }}
                    >
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-slate-500">{material.code} - {material.description}</p>
                        <p className="text-xs text-slate-400">Stock: {material.quantity_in_stock || 0} {material.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${material.unit_price}</p>
                        <p className="text-xs text-slate-500">per {material.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" className="mt-4 w-full" onClick={() => setShowMaterialSelector(false)}>Fermer</Button>
              </div>
            </div>
          )}

          {/* Status & Action Buttons */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-center gap-3">
              <Button 
                type="button" 
                variant={formData.status === 'sent' ? 'default' : 'outline'}
                onClick={() => {
                  handleChange('status', 'sent');
                  if (!formData.sent_date) {
                    handleChange('sent_date', format(new Date(), 'yyyy-MM-dd'));
                  }
                }}
                className="flex-1"
              >
                Envoyée
              </Button>
              <Button 
                type="button" 
                variant={formData.status === 'accepted' ? 'default' : 'outline'}
                onClick={() => {
                  handleChange('status', 'accepted');
                  if (!formData.accepted_date) {
                    handleChange('accepted_date', format(new Date(), 'yyyy-MM-dd'));
                  }
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                Gagner
              </Button>
              <Button 
                type="button" 
                variant={formData.status === 'declined' ? 'default' : 'outline'}
                onClick={() => handleChange('status', 'declined')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Perdu
              </Button>
            </div>

            {formData.status === 'accepted' && (
              <div className="flex justify-center gap-3 p-4 bg-green-50 rounded-lg">
                <Button 
                  type="button" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    if (!formData.customer_id) {
                      alert('Please select a customer first');
                      return;
                    }

                    const jobData = {
                      title: formData.project_name || `Job for ${formData.customer_name}`,
                      customer_id: formData.customer_id,
                      customer_name: formData.customer_name,
                      description: `Created from quotation ${formData.quote_number}`,
                      status: "scheduled",
                      start_date: formData.work_start_date || null,
                      priority: "medium",
                      quotation_id: quotation?.id || null,
                      invoice_items: formData.submission_items || [],
                      invoice_subtotal: formData.submission_subtotal || 0,
                      invoice_tps: formData.tax_amount || 0,
                      invoice_tvq: formData.tax_amount_2 || 0,
                      invoice_total: formData.total_amount || 0,
                      activity_log: [{
                        timestamp: new Date().toISOString(),
                        user: 'System',
                        action: 'created_from_quotation',
                        details: `Job created from approved quotation #${formData.quote_number}`
                      }]
                    };
                    
                    try {
                      const newJob = await base44.entities.Job.create(jobData);
                      
                      if (quotation?.id) {
                        await base44.entities.Quotation.update(quotation.id, {
                          job_id: newJob.id,
                          status: 'approved'
                        });
                      }
                      
                      alert('Job created successfully from quotation!');
                      onClose();
                    } catch (error) {
                      alert('Failed to create job: ' + error.message);
                    }
                  }}
                >
                  Accept & Create Job
                </Button>
                <Button 
                  type="button" 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={async () => {
                    const invoiceData = {
                      customer_id: formData.customer_id,
                      customer_name: formData.customer_name,
                      invoice_date: new Date().toISOString(),
                      status: "draft",
                      line_items: (formData.submission_items || []).map(item => ({
                        ...item,
                        source: 'quoted'
                      })),
                      subtotal: formData.submission_subtotal || 0,
                      tps: formData.tax_amount || 0,
                      tvq: formData.tax_amount_2 || 0,
                      total: formData.total_amount || 0
                    };
                    try {
                      await base44.entities.Invoice.create(invoiceData);
                      alert('Invoice created!');
                    } catch (error) {
                      alert('Failed to create invoice: ' + error.message);
                    }
                  }}
                >
                  Créer une Facture
                </Button>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={scheduleLater}>
                  Schedule Later
                </Button>
              </div>
              <div className="flex gap-2">
                <Button type="button" className="bg-blue-500 hover:bg-blue-600" onClick={generatePDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Create PDF and Save
                </Button>
                <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={sendQuotationEmail}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}