import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, User, Phone, ChevronDown, ChevronUp, Navigation, CheckCircle, Camera, PenTool, Plus, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import OfflineStorage from "./OfflineStorage";
import SignatureCapture from "./SignatureCapture";

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  review: 'bg-purple-100 text-purple-800',
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
  urgent: 'bg-red-600 text-white',
};

export default function MobileJobCard({ job, currentPosition, isOnline }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [photos, setPhotos] = useState(job.photos || []);
  const [signature, setSignature] = useState(job.signature || null);

  // Open navigation app to job location
  const openNavigation = useCallback(() => {
    const addresses = job.project_addresses || (job.location ? [job.location] : []);
    if (addresses.length === 0) {
      alert('Aucune adresse disponible');
      return;
    }

    const destination = encodeURIComponent(addresses[0]);
    
    // Detect device and open appropriate navigation app
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let url;
    if (currentPosition) {
      const { latitude, longitude } = currentPosition;
      if (isIOS) {
        url = `maps://maps.apple.com/?daddr=${destination}&saddr=${latitude},${longitude}`;
      } else if (isAndroid) {
        url = `google.navigation:q=${destination}`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}`;
      }
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }

    window.open(url, '_blank');
  }, [job.project_addresses, job.location, currentPosition]);

  // Call customer phone
  const callCustomer = useCallback(() => {
    const phone = job.customer_phone || '+1234567890';
    window.location.href = `tel:${phone}`;
  }, [job.customer_phone]);

  // Update job status with offline support
  const updateJobStatus = useCallback(async (newStatus) => {
    setUpdating(true);
    try {
      const updateData = { 
        status: newStatus,
        ...(newStatus === 'completed' && { completed_at: new Date().toISOString() }),
        ...(newStatus === 'in_progress' && !job.started_at && { started_at: new Date().toISOString() })
      };

      if (isOnline) {
        await base44.entities.Job.update(job.id, updateData);
      } else {
        OfflineStorage.updateJobStatus(job.id, newStatus);
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          entityId: job.id,
          data: updateData,
          timestamp: Date.now(),
        });
      }
      
      job.status = newStatus;
      alert(isOnline ? 'Statut mis à jour' : 'Statut mis à jour (sera synchronisé)');
    } catch (error) {
      console.error('[MobileJobCard] Error updating status:', error);
      alert('Erreur. Les données seront synchronisées plus tard.');
    } finally {
      setUpdating(false);
    }
  }, [job, isOnline]);

  // Add note with offline support
  const addJobNote = useCallback(async () => {
    if (!note.trim()) return;

    try {
      const comments = job.comments || [];
      const newComment = {
        id: `comment_${Date.now()}`,
        text: note,
        created_at: new Date().toISOString(),
        created_by: 'mobile_tech',
        user_name: job.technician_name || 'Technicien',
      };
      comments.push(newComment);

      if (isOnline) {
        await base44.entities.Job.update(job.id, { comments });
      } else {
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          entityId: job.id,
          data: { comments },
          timestamp: Date.now(),
        });
      }
      
      setNote('');
      setNoteDialogOpen(false);
      alert(isOnline ? 'Note ajoutée' : 'Note ajoutée (sera synchronisée)');
    } catch (error) {
      console.error('[MobileJobCard] Error adding note:', error);
      alert('Note sauvegardée localement');
    }
  }, [note, job, isOnline]);

  // Add time spent
  const addTimeSpent = useCallback(async () => {
    if (!timeSpent) return;

    try {
      const hours = parseFloat(timeSpent);
      if (isNaN(hours) || hours <= 0) {
        alert('Entrez un nombre valide');
        return;
      }

      const totalTime = (job.total_time_spent || 0) + hours;

      if (isOnline) {
        await base44.entities.Job.update(job.id, { total_time_spent: totalTime });
      } else {
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          entityId: job.id,
          data: { total_time_spent: totalTime },
          timestamp: Date.now(),
        });
      }
      
      setTimeSpent('');
      setTimeDialogOpen(false);
      alert(isOnline ? 'Temps ajouté' : 'Temps ajouté (sera synchronisé)');
    } catch (error) {
      console.error('[MobileJobCard] Error adding time:', error);
      alert('Données sauvegardées localement');
    }
  }, [timeSpent, job, isOnline]);

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newPhoto = { 
        url: file_url, 
        uploaded_at: new Date().toISOString() 
      };
      const newPhotos = [...photos, newPhoto];
      setPhotos(newPhotos);

      if (isOnline) {
        await base44.entities.Job.update(job.id, { photos: newPhotos });
      } else {
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          entityId: job.id,
          data: { photos: newPhotos },
          timestamp: Date.now(),
        });
      }
      
      alert('Photo ajoutée');
    } catch (error) {
      console.error('[MobileJobCard] Error uploading photo:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [photos, job, isOnline]);

  // Handle signature save
  const handleSignatureSave = useCallback(async (signatureData) => {
    try {
      setSignature(signatureData.signature_url);

      if (isOnline) {
        await base44.entities.Job.update(job.id, { 
          signature: signatureData.signature_url,
          signature_data: signatureData 
        });
      } else {
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          entityId: job.id,
          data: { 
            signature: signatureData.signature_url,
            signature_data: signatureData 
          },
          timestamp: Date.now(),
        });
      }
      
      alert(isOnline ? 'Signature enregistrée' : 'Signature enregistrée (sera synchronisée)');
    } catch (error) {
      console.error('[MobileJobCard] Error saving signature:', error);
      alert('Signature sauvegardée localement');
    }
  }, [job, isOnline]);

  return (
    <>
      <Card className="overflow-hidden touch-manipulation active:scale-[0.98] transition-transform">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-3">
              <h3 className="font-semibold text-lg leading-tight mb-1">{job.title}</h3>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <User className="w-3 h-3 flex-shrink-0" />
                {job.customer_name}
              </p>
            </div>
            <Badge className={STATUS_COLORS[job.status] || 'bg-slate-100'}>
              {job.status === 'scheduled' ? 'Planifié' : 
               job.status === 'in_progress' ? 'En cours' : 
               job.status === 'completed' ? 'Terminé' : job.status}
            </Badge>
          </div>

          {job.priority && (
            <Badge className={`${PRIORITY_COLORS[job.priority]} mb-3`}>
              Priorité: {job.priority === 'low' ? 'Basse' : 
                        job.priority === 'medium' ? 'Moyenne' : 
                        job.priority === 'high' ? 'Haute' : 'Urgente'}
            </Badge>
          )}

          <div className="space-y-2 text-sm">
            {job.scheduled_date && (
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 flex-shrink-0" />
                {format(new Date(job.scheduled_date), 'EEEE d MMMM', { locale: fr })}
                {job.scheduled_time && ` à ${job.scheduled_time}`}
              </div>
            )}
            
            {(job.location || (job.project_addresses && job.project_addresses[0])) && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">
                  {job.project_addresses?.[0] || job.location}
                </span>
              </div>
            )}
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              {job.description && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">{job.description}</p>
                </div>
              )}
              
              {job.project_addresses && job.project_addresses.length > 1 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Adresses du projet</label>
                  <div className="space-y-2">
                    {job.project_addresses.map((addr, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded">
                        <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="flex-1">{addr}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
                            window.open(url, '_blank');
                          }}
                          className="h-7 px-2"
                        >
                          <Navigation className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Changer le statut</label>
                <Select value={job.status} onValueChange={updateJobStatus} disabled={updating}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Planifié</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="review">En révision</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {job.checklist && job.checklist.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Checklist</label>
                  <div className="bg-slate-50 p-3 rounded space-y-2">
                    {job.checklist.flatMap(g => g.items || []).slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm touch-manipulation active:bg-slate-100 p-1 rounded">
                        {item.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-300 rounded flex-shrink-0" />
                        )}
                        <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-700'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {job.total_time_spent > 0 && (
                <div className="bg-blue-50 p-3 rounded">
                  <label className="text-xs font-medium text-blue-600 mb-1 block">Temps total</label>
                  <p className="text-2xl font-bold text-blue-700">{job.total_time_spent}h</p>
                </div>
              )}

              {/* Action Grid - Touch Optimized */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setNoteDialogOpen(true)}
                  variant="outline"
                  className="h-14 touch-manipulation active:scale-95 transition-transform"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Note
                </Button>
                <Button
                  onClick={() => setTimeDialogOpen(true)}
                  variant="outline"
                  className="h-14 touch-manipulation active:scale-95 transition-transform"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Temps
                </Button>
                <Button
                  onClick={() => setPhotoDialogOpen(true)}
                  variant="outline"
                  className="h-14 touch-manipulation active:scale-95 transition-transform"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Photo
                </Button>
                <Button
                  onClick={() => setSignatureDialogOpen(true)}
                  variant="outline"
                  className="h-14 touch-manipulation active:scale-95 transition-transform"
                >
                  <PenTool className="w-5 h-5 mr-2" />
                  Signature
                </Button>
              </div>

              {photos.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Photos ({photos.length})</label>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(0, 6).map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={photo.url} 
                          alt="Job photo" 
                          className="w-full h-24 object-cover rounded border cursor-pointer"
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                  {photos.length > 6 && (
                    <p className="text-xs text-slate-500 mt-1">+{photos.length - 6} autres</p>
                  )}
                </div>
              )}

              {signature && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Signature client</label>
                  <img 
                    src={signature} 
                    alt="Signature" 
                    className="w-full h-24 object-contain border rounded bg-white cursor-pointer"
                    onClick={() => window.open(signature, '_blank')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions - Touch Optimized */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {(job.location || (job.project_addresses && job.project_addresses.length > 0)) && (
              <Button 
                onClick={openNavigation}
                variant="outline" 
                className="flex-1 min-w-[120px] h-12 touch-manipulation active:scale-95 transition-transform font-medium"
              >
                <Navigation className="w-5 h-5 mr-2" />
                GPS
              </Button>
            )}
            <Button 
              onClick={callCustomer}
              variant="outline" 
              className="flex-1 min-w-[120px] h-12 touch-manipulation active:scale-95 transition-transform font-medium"
            >
              <Phone className="w-5 h-5 mr-2" />
              Appeler
            </Button>
            <Button
              onClick={() => setExpanded(!expanded)}
              variant="ghost"
              className="h-12 px-3 touch-manipulation"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter une note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Saisir votre note..."
            rows={5}
            className="text-base resize-none"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={addJobNote} className="flex-1 bg-blue-600">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Dialog */}
      <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter du temps</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Heures travaillées</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder="Ex: 2.5"
              className="mt-1 text-lg h-12"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTimeDialogOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={addTimeSpent} className="flex-1 bg-blue-600">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter une photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="cursor-pointer touch-manipulation active:scale-95 transition-transform block">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-slate-50 active:bg-slate-100">
                <Camera className="w-16 h-16 mx-auto mb-3 text-slate-400" />
                <p className="text-base text-slate-600 font-medium">
                  {uploading ? 'Upload en cours...' : 'Prendre une photo'}
                </p>
                <p className="text-xs text-slate-500 mt-1">ou choisir de la galerie</p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, idx) => (
                  <img 
                    key={idx} 
                    src={photo.url} 
                    alt="Photo" 
                    className="w-full h-20 object-cover rounded border cursor-pointer"
                    onClick={() => window.open(photo.url, '_blank')}
                  />
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPhotoDialogOpen(false)} className="w-full">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <SignatureCapture
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onSave={handleSignatureSave}
      />
    </>
  );
}