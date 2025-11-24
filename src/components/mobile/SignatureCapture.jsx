import { useRef, useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen, Trash2, Check } from "lucide-react";

export default function SignatureCapture({ open, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hasSignature, setHasSignature] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open && canvasRef.current) {
      clearSignature();
      setSignerName('');
      setHasSignature(false);
    }
  }, [open]);

  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    setLastPos(coords);
    setIsDrawing(true);
    setHasSignature(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [getCoordinates]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    setLastPos(coords);
  }, [isDrawing, getCoordinates]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
  }, []);

  const saveSignature = useCallback(async () => {
    if (!signerName.trim()) {
      alert('Veuillez entrer le nom du signataire');
      return;
    }

    if (!hasSignature) {
      alert('Veuillez signer avant d\'enregistrer');
      return;
    }

    setSaving(true);
    try {
      const canvas = canvasRef.current;
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => 
        canvas.toBlob(resolve, 'image/png', 1.0)
      );
      
      // Upload signature
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' })
      });

      onSave({
        signature_url: file_url,
        signer_name: signerName,
        signed_at: new Date().toISOString()
      });

      setSignerName('');
      clearSignature();
    } catch (error) {
      console.error('[SignatureCapture] Error:', error);
      alert('Erreur lors de l\'enregistrement: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [signerName, hasSignature, onSave, clearSignature]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Signature du client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-base">Nom du client *</Label>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Entrez le nom du client..."
              className="mt-2 h-12 text-base"
            />
          </div>

          <div className="border-2 rounded-lg overflow-hidden bg-white">
            <div className="bg-slate-50 p-3 border-b flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-2 font-medium">
                <Pen className="w-4 h-4" />
                Signez ci-dessous
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearSignature}
                className="touch-manipulation"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Effacer
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair touch-none w-full"
              style={{ 
                touchAction: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 text-base touch-manipulation"
            >
              Annuler
            </Button>
            <Button 
              onClick={saveSignature} 
              disabled={saving || !signerName.trim() || !hasSignature}
              className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700 touch-manipulation active:scale-95 transition-transform"
            >
              {saving ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}