import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Briefcase, DollarSign, Package, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";

const statusColors = {
  available: "bg-green-100 text-green-700",
  busy: "bg-yellow-100 text-yellow-700",
  off_duty: "bg-gray-100 text-gray-700"
};

export default function TechnicianDetails({ open, onClose, technician, onEdit }) {
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    enabled: !!technician,
    staleTime: 30000,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
    enabled: !!technician,
    staleTime: 30000,
  });

  if (!technician) return null;

  const techJobs = jobs.filter(j => j.technician_id === technician.id);
  const activeJobs = techJobs.filter(j => j.status === 'scheduled' || j.status === 'in_progress');
  const completedJobs = techJobs.filter(j => j.status === 'completed');
  const assignedAssets = assets.filter(a => a.assigned_to === technician.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {technician.avatar_url ? (
                <img 
                  src={technician.avatar_url} 
                  alt={`${technician.first_name} ${technician.last_name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: technician.color || '#64748b' }}
                >
                  {technician.first_name[0]}{technician.last_name[0]}
                </div>
              )}
              <div>
                <DialogTitle className="text-2xl">
                  {technician.first_name} {technician.last_name}
                </DialogTitle>
                <Badge className={statusColors[technician.status || 'available']}>
                  {technician.status === 'available' ? 'Disponible' :
                   technician.status === 'busy' ? 'Occupé' : 'Hors service'}
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Info */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Informations de Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              {technician.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium">{technician.email}</p>
                  </div>
                </div>
              )}
              {technician.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Téléphone</p>
                    <p className="font-medium">{technician.phone}</p>
                  </div>
                </div>
              )}
              {technician.hourly_rate > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Taux horaire</p>
                    <p className="font-medium">${technician.hourly_rate}/h</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Specializations */}
          {technician.specialization && technician.specialization.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3">Spécialisations</h3>
              <div className="flex flex-wrap gap-2">
                {technician.specialization.map(spec => (
                  <Badge key={spec} variant="outline" className="text-sm">
                    {spec.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{activeJobs.length}</p>
              <p className="text-sm text-slate-600">Jobs actifs</p>
            </Card>
            <Card className="p-4 text-center">
              <Briefcase className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{completedJobs.length}</p>
              <p className="text-sm text-slate-600">Jobs complétés</p>
            </Card>
            <Card className="p-4 text-center">
              <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{assignedAssets.length}</p>
              <p className="text-sm text-slate-600">Équipements</p>
            </Card>
          </div>

          {/* Assigned Assets */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Équipements Assignés
            </h3>
            {assignedAssets.length > 0 ? (
              <div className="space-y-2">
                {assignedAssets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {asset.photos && asset.photos.length > 0 ? (
                        <img 
                          src={asset.photos[0]} 
                          alt={asset.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{asset.name}</p>
                        {asset.brand && asset.model && (
                          <p className="text-xs text-slate-500">{asset.brand} - {asset.model}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={
                      asset.status === 'available' ? 'bg-green-100 text-green-800' :
                      asset.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                      asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      asset.status === 'repair_needed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {asset.status === 'available' && 'Disponible'}
                      {asset.status === 'in_use' && 'En utilisation'}
                      {asset.status === 'maintenance' && 'Maintenance'}
                      {asset.status === 'repair_needed' && 'Réparation'}
                      {asset.status === 'retired' && 'Retiré'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Aucun équipement assigné
              </p>
            )}
          </Card>

          {/* Recent Jobs */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Jobs Récents</h3>
            {activeJobs.length > 0 ? (
              <div className="space-y-2">
                {activeJobs.slice(0, 5).map(job => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-xs text-slate-500">{job.customer_name}</p>
                    </div>
                    <Badge className={
                      job.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {job.status === 'scheduled' && 'Planifié'}
                      {job.status === 'in_progress' && 'En cours'}
                      {job.status === 'completed' && 'Complété'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Aucun job actif
              </p>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}