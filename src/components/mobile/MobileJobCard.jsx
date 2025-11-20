import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, User, Phone, ChevronDown, ChevronUp, Navigation, CheckCircle, Camera, FileText, PenTool, Plus, MessageSquare, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import OfflineStorage from "./OfflineStorage";

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
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = React.useRef(null);
  const [lastPos, setLastPos] = React.useState({ x: 0, y: 0 });

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
    urgent: 'bg-red-600 text-white',
  };

  const openMaps = () => {
    if (job.location) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location)}`;
      window.open(url, '_blank');
    }
  };

  const callCustomer = () => {
    // In a real app, this would extract phone from customer
    window.location.href = 'tel:+1234567890';
  };

  const updateJobStatus = async (newStatus) => {
    setUpdating(true);
    try {
      if (isOnline) {
        await base44.entities.Job.update(job.id, { status: newStatus });
      } else {
        OfflineStorage.updateJobStatus(job.id, newStatus);
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          data: { id: job.id, status: newStatus },
        });
      }
      job.status = newStatus;
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Erreur lors de la mise à jour. Les données seront synchronisées plus tard.');
    } finally {
      setUpdating(false);
    }
  };

  const addJobNote = async () => {
    if (!note.trim()) return;

    try {
      const comments = job.comments || [];
      comments.push({
        id: `comment_${Date.now()}`,
        text: note,
        created_at: new Date().toISOString(),
        created_by: 'mobile_tech',
        user_name: job.technician_name,
      });

      if (isOnline) {
        await base44.entities.Job.update(job.id, { comments });
      } else {
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          data: { id: job.id, comments },
        });
      }
      setNote('');
      setNoteDialogOpen(false);
      alert('Note ajoutée avec succès');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Erreur lors de l\'ajout. La note sera synchronisée plus tard.');
    }
  };

  const addTimeSpent = async () => {
    if (!timeSpent) return;

    try {
      const hours = parseFloat(timeSpent);
      const totalTime = (job.total_time_spent || 0) + hours;

      if (isOnline) {
        await base44.entities.Job.update(job.id, { total_time_spent: totalTime });
      } else {
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          data: { id: job.id, total_time_spent: totalTime },
        });
      }
      setTimeSpent('');
      setTimeDialogOpen(false);
      alert('Temps ajouté avec succès');
    } catch (error) {
      console.error('Error adding time:', error);
      alert('Erreur lors de l\'ajout. Les données seront synchronisées plus tard.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newPhotos = [...photos, { url: file_url, uploaded_at: new Date().toISOString() }];
      setPhotos(newPhotos);

      if (isOnline) {
        await base44.entities.Job.update(job.id, { photos: newPhotos });
      } else {
        OfflineStorage.addPendingSync({
          method: 'update',
          entity: 'Job',
          data: { id: job.id, photos: newPhotos },
        });
      }
      alert('Photo ajoutée avec succès');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    setIsDrawing(true);
    setLastPos({ x, y });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      try {
        const file = new File([blob], 'signature.png', { type: 'image/png' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setSignature(file_url);

        if (isOnline) {
          await base44.entities.Job.update(job.id, { signature: file_url });
        } else {
          OfflineStorage.addPendingSync({
            method: 'update',
            entity: 'Job',
            data: { id: job.id, signature: file_url },
          });
        }
        setSignatureDialogOpen(false);
        alert('Signature enregistrée avec succès');
      } catch (error) {
        console.error('Error saving signature:', error);
        alert('Erreur lors de l\'enregistrement');
      }
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-1">{job.title}</h3>
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <User className="w-3 h-3" />
              {job.customer_name}
            </p>
          </div>
          <Badge className={statusColors[job.status]}>
            {job.status === 'scheduled' ? 'Planifié' : 
             job.status === 'in_progress' ? 'En cours' : 'Complété'}
          </Badge>
        </div>

        {job.priority && (
          <Badge className={`${priorityColors[job.priority]} mb-2`}>
            Priorité: {job.priority === 'low' ? 'Basse' : 
                      job.priority === 'medium' ? 'Moyenne' : 
                      job.priority === 'high' ? 'Haute' : 'Urgente'}
          </Badge>
        )}

        <div className="space-y-2 text-sm">
          {job.scheduled_date && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              {format(new Date(job.scheduled_date), 'EEEE d MMMM', { locale: fr })}
              {job.scheduled_time && ` à ${job.scheduled_time}`}
            </div>
          )}
          
          {job.location && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span className="flex-1 truncate">{job.location}</span>
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
            {job.description && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">{job.description}</p>
              </div>
            )}
            
            {job.project_addresses && job.project_addresses.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Adresses du projet</label>
                <div className="space-y-1">
                  {job.project_addresses.map((addr, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {addr}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Changer le statut</label>
              <Select value={job.status} onValueChange={updateJobStatus} disabled={updating}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="review">En révision</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {job.checklist && job.checklist.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Checklist</label>
                <div className="bg-slate-50 p-2 rounded space-y-1">
                  {job.checklist.flatMap(g => g.items || []).slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-slate-300 rounded" />
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
              <div className="bg-blue-50 p-2 rounded">
                <label className="text-xs font-medium text-blue-600 mb-1 block">Temps total</label>
                <p className="text-lg font-bold text-blue-700">{job.total_time_spent}h</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setNoteDialogOpen(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Note
              </Button>
              <Button
                onClick={() => setTimeDialogOpen(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Clock className="w-4 h-4 mr-1" />
                Temps
              </Button>
              <Button
                onClick={() => setPhotoDialogOpen(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-1" />
                Photo
              </Button>
              <Button
                onClick={() => setSignatureDialogOpen(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <PenTool className="w-4 h-4 mr-1" />
                Signature
              </Button>
            </div>

            {photos.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Photos ({photos.length})</label>
                <div className="grid grid-cols-3 gap-2">
                  {photos.slice(0, 3).map((photo, idx) => (
                    <img key={idx} src={photo.url} alt="Job photo" className="w-full h-20 object-cover rounded border" />
                  ))}
                </div>
              </div>
            )}

            {signature && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Signature client</label>
                <img src={signature} alt="Signature" className="w-full h-20 object-contain border rounded bg-white" />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-3 flex-wrap">
          {job.location && (
            <Button 
              onClick={openMaps}
              variant="outline" 
              className="flex-1 min-w-[100px]"
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Itinéraire
            </Button>
          )}
          <Button 
            onClick={callCustomer}
            variant="outline" 
            className="flex-1 min-w-[100px]"
            size="sm"
          >
            <Phone className="w-4 h-4 mr-1" />
            Appeler
          </Button>
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="ghost"
            size="sm"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

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
            rows={4}
            className="text-base"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Annuler</Button>
            <Button onClick={addJobNote}>Enregistrer</Button>
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
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              placeholder="Ex: 2.5"
              className="mt-1 text-base"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeDialogOpen(false)}>Annuler</Button>
            <Button onClick={addTimeSpent}>Enregistrer</Button>
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
            <label className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-slate-50">
                <Camera className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">
                  {uploading ? 'Upload en cours...' : 'Prendre ou choisir une photo'}
                </p>
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
                  <img key={idx} src={photo.url} alt="Photo" className="w-full h-20 object-cover rounded border" />
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPhotoDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Signature du client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="border-2 border-slate-300 rounded w-full touch-none"
              style={{ touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <Button onClick={clearSignature} variant="outline" className="w-full">
              Effacer
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveSignature}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}