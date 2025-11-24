import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/components/shared/translations";

export default function SignatureCaptureDialog({ open, onClose, job, isOnline, lang = 'fr' }) {
  const [signerName, setSignerName] = useState('');
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const queryClient = useQueryClient();
  const t = useTranslation(lang);

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      
      // Set drawing style
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [open]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getCoordinates(e);
    lastPos.current = pos;
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = async () => {
    if (!signerName.trim()) {
      alert(lang === 'fr' ? 'Veuillez entrer le nom du signataire' : 'Please enter signer name');
      return;
    }

    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL('image/png');

      let attachment = {
        name: `Signature - ${signerName}`,
        uploaded_at: new Date().toISOString(),
        uploaded_by: signerName,
        type: 'signature'
      };

      if (isOnline) {
        // Convert data URL to blob
        const blob = await fetch(signatureDataUrl).then(r => r.blob());
        const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' });

        // Upload to server
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        attachment.url = file_url;

        // Update job
        await base44.entities.Job.update(job.id, {
          attachments: [...(job.attachments || []), attachment]
        });
      } else {
        // Store offline
        attachment.url = signatureDataUrl;
        attachment.offline = true;

        const offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        offlineQueue.push({
          type: 'signature_upload',
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
      alert(lang === 'fr' ? 'Erreur lors de la sauvegarde' : 'Save error');
      console.error('[SignatureCapture] Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    clearSignature();
    setSignerName('');
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {lang === 'fr' ? 'Signature du client' : 'Customer Signature'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Signer name */}
          <div>
            <Input
              placeholder={lang === 'fr' ? 'Nom du signataire' : 'Signer name'}
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          {/* Canvas for signature */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-64 touch-none cursor-crosshair"
              style={{ touchAction: 'none' }}
            />
          </div>

          <p className="text-xs text-slate-500 text-center">
            {lang === 'fr' ? 'Signez avec votre doigt ou stylet' : 'Sign with your finger or stylus'}
          </p>

          {/* Offline warning */}
          {!isOnline && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              {lang === 'fr' 
                ? 'Mode hors ligne: La signature sera uploadée lors de la prochaine connexion' 
                : 'Offline mode: Signature will upload when back online'}
            </div>
          )}

          {/* Action buttons - Large for touch */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="h-12 text-base"
              disabled={saving}
            >
              <X className="w-5 h-5 mr-2" />
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>

            <Button
              onClick={clearSignature}
              variant="outline"
              className="h-12 text-base"
              disabled={saving}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {lang === 'fr' ? 'Effacer' : 'Clear'}
            </Button>

            <Button
              onClick={handleSave}
              className="h-12 bg-green-600 hover:bg-green-700 text-base"
              disabled={!signerName.trim() || saving}
            >
              {saving ? (
                <>
                  <Upload className="w-5 h-5 mr-2 animate-pulse" />
                  ...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {lang === 'fr' ? 'OK' : 'OK'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}