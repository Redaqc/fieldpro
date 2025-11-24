import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AddressAutocompleteInput from "../shared/AddressAutocompleteInput";

export default function CustomerDialog({ open, onClose, onSave, customer }) {
  const [formData, setFormData] = useState(customer || {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    logo_url: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
    status: "active",
    price_list_id: "",
    price_list_name: ""
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: priceLists = [] } = useQuery({
    queryKey: ['priceLists'],
    queryFn: () => base44.entities.PriceList.list(),
    initialData: [],
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePriceListSelect = (priceListId) => {
    const priceList = priceLists.find(pl => pl.id === priceListId);
    handleChange('price_list_id', priceListId);
    handleChange('price_list_name', priceList?.name || '');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('logo_url', file_url);
    } catch (error) {
      alert('Erreur lors de l\'upload du logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Logo du Client</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.logo_url && (
                  <div className="w-20 h-20 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button type="button" variant="outline" disabled={uploadingLogo} asChild>
                      <span>
                        {uploadingLogo ? 'Upload...' : <><Upload className="w-4 h-4 mr-2" />Choisir un logo</>}
                      </span>
                    </Button>
                  </label>
                  {formData.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleChange('logo_url', '')}
                      className="ml-2 text-red-600"
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <AddressAutocompleteInput
                label="Address"
                defaultValue={formData.address}
                onAddressSelected={(address) => {
                  handleChange('address', `${address.street_number} ${address.street_name}`.trim());
                  handleChange('city', address.city);
                  handleChange('state', address.province);
                  handleChange('zip_code', address.postal_code);
                }}
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="zip_code">Zip/Postal Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleChange('zip_code', e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="price_list">Price List</Label>
              <Select value={formData.price_list_id || ''} onValueChange={handlePriceListSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price list (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No specific price list</SelectItem>
                  {priceLists.filter(pl => pl.status === 'active').map(priceList => (
                    <SelectItem key={priceList.id} value={priceList.id}>
                      {priceList.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.price_list_name && (
                <p className="text-xs text-slate-500 mt-1">
                  Assigned: {formData.price_list_name}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}