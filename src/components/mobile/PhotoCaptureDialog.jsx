import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/components/shared/translations";

export default function PhotoCaptureDialog({ open, onClose, job, isOnline, lang = 'fr' }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const queryClient = useQueryClient();
  const t = useTranslation(lang);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage({
        data: event.target.result,
        file: file,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!capturedImage) return;

    setUploading(true);
    try {
      let attachment = {
        name: description || capturedImage.name,
        uploaded_at: new Date().toISOString(),
        uploaded_by: job.technicians?.find(t => t.id)?.name || 'Technician'
      };

      if (isOnline) {
        // Upload to server
        const { file_url } = await base44.integrations.Core.UploadFile({ 
          file: capturedImage.file 
        });
        attachment.url = file_url;

        // Update job with new attachment
        await base44.entities.Job.update(job.id, {
          attachments: [...(job.attachments || []), attachment]
        });
      } else {
        // Store offline - save to localStorage
        attachment.url = capturedImage.data; // Base64 data URL for offline
        attachment.offline = true;

        const offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        offlineQueue.push({
          type: 'photo_upload',
          jobId: job.id,
          attachment: attachment,
          existingAttachments: job.attachments || [],
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('offline_queue', JSON.stringify(offlineQueue));
      }

      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      handleClose();
    } catch (error) {
      alert(lang === 'fr' ? 'Erreur lors de l\'upload' : 'Upload error');
      console.error('[PhotoCapture] Error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    setDescription('');
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {lang === 'fr' ? 'Ajouter une photo' : 'Add Photo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!capturedImage ? (
            <div className="space-y-3">
              {/* Camera capture button - mobile optimized */}
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full h-24 bg-blue-600 hover:bg-blue-700 text-lg"
              >
                <Camera className="w-8 h-8 mr-3" />
                {lang === 'fr' ? 'Prendre une photo' : 'Take Photo'}
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* File upload button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-16 text-base"
              >
                <Upload className="w-6 h-6 mr-3" />
                {lang === 'fr' ? 'Choisir depuis galerie' : 'Choose from Gallery'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="relative">
                <img
                  src={capturedImage.data}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <Button
                  onClick={() => setCapturedImage(null)}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Description */}
              <div>
                <Input
                  placeholder={lang === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              {/* Offline warning */}
              {!isOnline && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                  {lang === 'fr' 
                    ? 'Mode hors ligne: La photo sera uploadée lors de la prochaine connexion' 
                    : 'Offline mode: Photo will upload when back online'}
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="h-12 text-base"
                  disabled={uploading}
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSave}
                  className="h-12 bg-green-600 hover:bg-green-700 text-base"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Upload className="w-5 h-5 mr-2 animate-pulse" />
                      {lang === 'fr' ? 'Upload...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {lang === 'fr' ? 'Sauvegarder' : 'Save'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}