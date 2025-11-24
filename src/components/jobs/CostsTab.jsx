import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, DollarSign, TrendingDown, Package, Clock, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";

export default function CostsTab({ job, formData, setFormData }) {
  const [fixedCosts, setFixedCosts] = useState(formData.costs?.fixed_costs || []);
  const [materialCosts, setMaterialCosts] = useState(formData.costs?.material_costs || []);
  const [hourlyRate, setHourlyRate] = useState(formData.costs?.hourly_rate || 0);

  const { data: supplierInvoices = [] } = useQuery({
    queryKey: ['supplierInvoices', job?.id],
    queryFn: () => job ? base44.entities.SupplierInvoice.filter({ job_id: job.id }) : [],
    enabled: !!job,
    initialData: [],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const currentTech = technicians.find(t => t.email === currentUser?.email);
  const isAdminOrManager = currentUser?.role === 'admin' || currentTech?.role === 'admin' || currentTech?.role === 'manager';

  if (!isAdminOrManager) {
    return (
      <div className="text-center py-8 text-slate-400">
        <DollarSign className="w-12 h-12 mx-auto mb-2 text-slate-300" />
        <p>Accès réservé aux administrateurs et gestionnaires</p>
      </div>
    );
  }

  const addFixedCost = () => {
    const newCost = { description: "", amount: 0, category: "other" };
    const updated = [...fixedCosts, newCost];
    setFixedCosts(updated);
    updateCosts({ fixed_costs: updated });
  };

  const updateFixedCost = (index, field, value) => {
    const updated = [...fixedCosts];
    updated[index] = { ...updated[index], [field]: value };
    setFixedCosts(updated);
    updateCosts({ fixed_costs: updated });
  };

  const removeFixedCost = (index) => {
    const updated = fixedCosts.filter((_, i) => i !== index);
    setFixedCosts(updated);
    updateCosts({ fixed_costs: updated });
  };

  const addMaterialCost = () => {
    const newCost = { description: "", quantity: 1, unit_cost: 0, total: 0 };
    const updated = [...materialCosts, newCost];
    setMaterialCosts(updated);
    updateCosts({ material_costs: updated });
  };

  const updateMaterialCost = (index, field, value) => {
    const updated = [...materialCosts];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_cost') {
      updated[index].total = (updated[index].quantity || 0) * (updated[index].unit_cost || 0);
    }
    
    setMaterialCosts(updated);
    updateCosts({ material_costs: updated });
  };

  const removeMaterialCost = (index) => {
    const updated = materialCosts.filter((_, i) => i !== index);
    setMaterialCosts(updated);
    updateCosts({ material_costs: updated });
  };

  const updateHourlyRate = (value) => {
    setHourlyRate(value);
    updateCosts({ hourly_rate: value });
  };

  const updateCosts = (updates) => {
    const currentCosts = formData.costs || {};
    const updatedCosts = { ...currentCosts, ...updates };

    // Calculer les totaux
    const totalFixed = (updatedCosts.fixed_costs || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalMaterials = (updatedCosts.material_costs || []).reduce((sum, c) => sum + (c.total || 0), 0);
    const totalLabor = (formData.total_time_spent || 0) * (updatedCosts.hourly_rate || 0);
    const totalVariable = totalLabor;
    
    // Ajouter les factures fournisseurs
    const supplierTotal = supplierInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    const totalCost = totalFixed + totalMaterials + totalLabor + supplierTotal;

    updatedCosts.total_fixed = parseFloat(totalFixed.toFixed(2));
    updatedCosts.total_materials = parseFloat(totalMaterials.toFixed(2));
    updatedCosts.total_labor = parseFloat(totalLabor.toFixed(2));
    updatedCosts.total_variable = parseFloat(totalVariable.toFixed(2));
    updatedCosts.total_cost = parseFloat(totalCost.toFixed(2));

    setFormData(prev => ({ ...prev, costs: updatedCosts }));
  };

  const totalRevenue = formData.invoice_total || 0;
  const totalCost = formData.costs?.total_cost || 0;
  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Revenus</p>
                <p className="text-xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Coûts totaux</p>
                <p className="text-xl font-bold text-red-600">${totalCost.toFixed(2)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Profit</p>
                <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profit.toFixed(2)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Marge</p>
                <p className={`text-xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
              <TrendingDown className={`w-8 h-8 ${profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coûts fixes */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Coûts fixes
          </h3>
          <Button size="sm" onClick={addFixedCost}>
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {fixedCosts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aucun coût fixe</p>
          ) : (
            fixedCosts.map((cost, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  value={cost.description}
                  onChange={(e) => updateFixedCost(index, 'description', e.target.value)}
                  placeholder="Description..."
                  className="col-span-6 h-9"
                />
                <Select 
                  value={cost.category || 'other'} 
                  onValueChange={(value) => updateFixedCost(index, 'category', value)}
                >
                  <SelectTrigger className="col-span-3 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">Équipement</SelectItem>
                    <SelectItem value="permits">Permis</SelectItem>
                    <SelectItem value="insurance">Assurance</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={cost.amount || ''}
                  onChange={(e) => updateFixedCost(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="Montant"
                  className="col-span-2 h-9"
                  step="0.01"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFixedCost(index)}
                  className="col-span-1 h-9"
                >
                  <Minus className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))
          )}
        </div>
        {fixedCosts.length > 0 && (
          <div className="mt-3 pt-3 border-t flex justify-between font-semibold">
            <span>Total coûts fixes:</span>
            <span>${(formData.costs?.total_fixed || 0).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Coût de la main d'œuvre */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Main d'œuvre
        </h3>
        <div className="space-y-3">
          <div>
            <Label>Taux horaire ($)</Label>
            <Input
              type="number"
              value={hourlyRate}
              onChange={(e) => updateHourlyRate(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="mt-1"
              step="0.01"
            />
          </div>
          <div className="bg-slate-50 rounded p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Heures travaillées:</span>
              <span className="font-semibold">{formData.total_time_spent || 0}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Taux horaire:</span>
              <span className="font-semibold">${hourlyRate.toFixed(2)}/h</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total main d'œuvre:</span>
              <span>${(formData.costs?.total_labor || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coûts matériaux */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            Matériaux
          </h3>
          <Button size="sm" onClick={addMaterialCost}>
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {materialCosts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aucun coût matériau</p>
          ) : (
            materialCosts.map((cost, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  value={cost.description}
                  onChange={(e) => updateMaterialCost(index, 'description', e.target.value)}
                  placeholder="Description..."
                  className="col-span-5 h-9"
                />
                <Input
                  type="number"
                  value={cost.quantity || ''}
                  onChange={(e) => updateMaterialCost(index, 'quantity', parseFloat(e.target.value) || 0)}
                  placeholder="Qté"
                  className="col-span-2 h-9"
                />
                <Input
                  type="number"
                  value={cost.unit_cost || ''}
                  onChange={(e) => updateMaterialCost(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                  placeholder="Prix unit."
                  className="col-span-2 h-9"
                  step="0.01"
                />
                <div className="col-span-2 text-right font-semibold text-sm">
                  ${(cost.total || 0).toFixed(2)}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeMaterialCost(index)}
                  className="col-span-1 h-9"
                >
                  <Minus className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))
          )}
        </div>
        {materialCosts.length > 0 && (
          <div className="mt-3 pt-3 border-t flex justify-between font-semibold">
            <span>Total matériaux:</span>
            <span>${(formData.costs?.total_materials || 0).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Factures fournisseurs */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Factures fournisseurs ({supplierInvoices.length})
          </h3>
        </div>
        {supplierInvoices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            Aucune facture fournisseur liée à ce projet
          </p>
        ) : (
          <div className="space-y-2">
            {supplierInvoices.map(invoice => (
              <div key={invoice.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-sm">{invoice.supplier_name}</p>
                  <p className="text-xs text-slate-500">
                    {invoice.invoice_number} - {invoice.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${invoice.amount.toFixed(2)}</p>
                  <p className={`text-xs ${
                    invoice.status === 'paid' ? 'text-green-600' : 
                    invoice.status === 'overdue' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {invoice.status === 'paid' ? 'Payé' : 
                     invoice.status === 'overdue' ? 'En retard' : 'En attente'}
                  </p>
                </div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t flex justify-between font-semibold">
              <span>Total fournisseurs:</span>
              <span>${supplierInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Total général */}
      <div className="bg-slate-100 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Coûts fixes:</span>
            <span className="font-semibold">${(formData.costs?.total_fixed || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Main d'œuvre:</span>
            <span className="font-semibold">${(formData.costs?.total_labor || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Matériaux:</span>
            <span className="font-semibold">${(formData.costs?.total_materials || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Factures fournisseurs:</span>
            <span className="font-semibold">${supplierInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
            <span>TOTAL COÛTS:</span>
            <span className="text-red-600">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}