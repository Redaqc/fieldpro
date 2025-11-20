import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

export default function DocumentPreview({ open, onClose, document }) {
  if (!document) return null;

  const isImage = document.file_type?.startsWith('image/');
  const isPDF = document.file_type === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{document.name}</DialogTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(document.file_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const a = window.document.createElement('a');
                  a.href = document.file_url;
                  a.download = document.name;
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 max-h-[70vh] overflow-auto">
          {isImage && (
            <img src={document.file_url} alt={document.name} className="w-full rounded-lg" />
          )}
          {isPDF && (
            <iframe
              src={document.file_url}
              className="w-full h-[70vh] rounded-lg border"
              title={document.name}
            />
          )}
          {!isImage && !isPDF && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <p className="text-slate-600 mb-4">Aperçu non disponible pour ce type de fichier</p>
              <Button onClick={() => window.open(document.file_url, '_blank')}>
                Ouvrir dans un nouvel onglet
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}