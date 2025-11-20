import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

export default function DocumentPreview({ open, onClose, document }) {
  if (!document) return null;

  const isImage = document.file_type?.startsWith('image/');
  const isPDF = document.file_type === 'application/pdf';
  const isVideo = document.file_type?.startsWith('video/');
  const isAudio = document.file_type?.startsWith('audio/');
  const isText = document.file_type?.startsWith('text/') || 
                 document.file_type === 'application/json' ||
                 document.name.endsWith('.txt') ||
                 document.name.endsWith('.json') ||
                 document.name.endsWith('.csv');

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
          {isVideo && (
            <video controls className="w-full rounded-lg">
              <source src={document.file_url} type={document.file_type} />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}
          {isAudio && (
            <div className="flex items-center justify-center py-16">
              <audio controls className="w-full max-w-lg">
                <source src={document.file_url} type={document.file_type} />
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          )}
          {isText && (
            <iframe
              src={document.file_url}
              className="w-full h-[70vh] rounded-lg border bg-white"
              title={document.name}
            />
          )}
          {!isImage && !isPDF && !isVideo && !isAudio && !isText && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <p className="text-slate-600 mb-4">Aperçu non disponible pour ce type de fichier</p>
              <p className="text-sm text-slate-500 mb-4">Type: {document.file_type}</p>
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