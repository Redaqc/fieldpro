import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ImportCSVDialog({ open, onClose, onImport }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Upload CSV file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from CSV
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service_name: { type: "string" },
                  description: { type: "string" },
                  unit_price: { type: "number" },
                  unit: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.status === "success" && result.output) {
        const items = result.output.items || [];
        onImport(items);
        onClose();
      } else {
        setError(result.details || "Erreur lors de l'extraction des données");
      }
    } catch (err) {
      setError("Erreur lors du traitement du fichier CSV");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importer CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Format CSV attendu:</p>
                <p className="text-xs">service_name, description, unit_price, unit, category</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <>
                    <Upload className="w-12 h-12 text-blue-500 animate-pulse" />
                    <p className="text-sm text-slate-600">Traitement en cours...</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">
                      Cliquez pour sélectionner un fichier CSV
                    </p>
                    <p className="text-xs text-slate-500">
                      Format: CSV avec en-têtes
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}