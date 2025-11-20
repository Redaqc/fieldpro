import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Plus, Edit, Trash2, Users, Lock } from "lucide-react";

const PERMISSION_LABELS = {
  dashboard: "Tableau de bord",
  jobs: "Jobs",
  schedule: "Horaire",
  calendar: "Calendrier",
  customers: "Clients",
  team: "Équipe",
  time_tracking: "Suivi du temps",
  documents: "Documents",
  forms: "Formulaires",
  reports: "Rapports",
  quotations: "Soumissions",
  invoices: "Factures",
  assets: "Équipements",
  price_lists: "Listes de prix",
  materials: "Matériaux",
  gps_tracking: "Suivi GPS",
  settings: "Paramètres",
  automations: "Automatisations",
  profitability: "Rentabilité",
  costs: "Gestion des coûts",
  can_view_prices: "Voir les prix (factures, soumissions, jobs)",
};

export default function RoleManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: Object.keys(PERMISSION_LABELS).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.Role.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Technician.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: Object.keys(PERMISSION_LABELS).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
    });
    setEditingRole(null);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const togglePermission = (key) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key],
      },
    });
  };

  const getRoleUserCount = (roleId) => {
    return technicians.filter(t => t.role_id === roleId).length;
  };

  const assignRoleToTechnician = (technicianId, roleId) => {
    const role = roles.find(r => r.id === roleId);
    updateTechnicianMutation.mutate({
      id: technicianId,
      data: {
        role_id: roleId,
        role_name: role?.name,
        visible_modules: Object.keys(role?.permissions || {}).filter(key => role?.permissions[key]),
      },
    });
  };

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-16">
            <Lock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Accès Restreint</h3>
            <p className="text-slate-500">Vous devez être administrateur pour accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Gestion des Rôles
          </h1>
          <p className="text-slate-500 mt-1">Définissez les permissions pour chaque rôle</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Rôle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Rôles</p>
            <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Rôles Actifs</p>
            <p className="text-2xl font-bold text-slate-900">{roles.filter(r => r.active).length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Utilisateurs</p>
            <p className="text-2xl font-bold text-slate-900">{technicians.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {roles.map(role => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {role.is_system && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Système</Badge>
                  )}
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {getRoleUserCount(role.id)}
                  </Badge>
                  {!role.is_system && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(role)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Supprimer ce rôle ?')) {
                            deleteRoleMutation.mutate(role.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(role.permissions || {})
                  .filter(([_, allowed]) => allowed)
                  .map(([key]) => (
                    <Badge key={key} className="bg-blue-100 text-blue-700">
                      {PERMISSION_LABELS[key] || key}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {roles.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucun Rôle</h3>
              <p className="text-slate-500 mb-4">Créez votre premier rôle personnalisé</p>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un Rôle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigner des Rôles aux Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {technicians.map(tech => (
              <div key={tech.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: tech.color || '#64748b' }}
                  >
                    {tech.first_name[0]}{tech.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{tech.first_name} {tech.last_name}</p>
                    <p className="text-xs text-slate-500">{tech.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {tech.role_name && (
                    <Badge className="bg-purple-100 text-purple-700">{tech.role_name}</Badge>
                  )}
                  <select
                    value={tech.role_id || ''}
                    onChange={(e) => assignRoleToTechnician(tech.id, e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Aucun rôle</option>
                    {roles.filter(r => r.active).map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du Rôle *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Manager, Technicien Senior..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du rôle..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Permissions</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={formData.permissions[key] || false}
                      onCheckedChange={() => togglePermission(key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                {editingRole ? 'Sauvegarder' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}