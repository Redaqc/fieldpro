import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen, Trash2, Save } from "lucide-react";

export default function SignatureCapture({ open, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [saving, setSaving] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.beginPath();
    ctx.moveTo(
      e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left,
      e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    );
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.lineTo(
      e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left,
      e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    );
    ctx.stroke();
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
    if (!signerName.trim()) {
      alert('Please enter signer name');
      return;
    }

    setSaving(true);
    try {
      const canvas = canvasRef.current;
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      // Upload signature
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' })
      });

      onSave({
        signature_url: file_url,
        signer_name: signerName,
        signed_at: new Date().toISOString()
      });

      onClose();
    } catch (error) {
      alert('Failed to save signature: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Signature</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Customer Name *</Label>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter customer name..."
              className="mt-1"
            />
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="bg-slate-50 p-2 border-b flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Pen className="w-4 h-4" />
                Sign below
              </span>
              <Button size="sm" variant="ghost" onClick={clearSignature}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair touch-none"
              style={{ width: '100%', height: '300px' }}
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={saveSignature} 
              disabled={saving || !signerName.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Signature'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}