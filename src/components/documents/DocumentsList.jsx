import React from "react";
import { FileText, Download, Eye, Trash2, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DocumentsList({ documents, onPreview, onDelete, jobs, customers }) {
  const getCategoryColor = (category) => {
    const colors = {
      contract: 'bg-green-100 text-green-700',
      invoice: 'bg-purple-100 text-purple-700',
      report: 'bg-blue-100 text-blue-700',
      certificate: 'bg-yellow-100 text-yellow-700',
      safety: 'bg-red-100 text-red-700',
      inspection: 'bg-orange-100 text-orange-700',
      other: 'bg-slate-100 text-slate-700',
    };
    return colors[category] || colors.other;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {documents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucun document</h3>
          <p className="text-slate-500">Uploadez votre premier document</p>
        </div>
      ) : (
        documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-lg shadow border p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{doc.name}</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onPreview(doc)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {doc.description && (
                  <p className="text-sm text-slate-600 mb-2">{doc.description}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getCategoryColor(doc.category)}>
                    {doc.category}
                  </Badge>
                  {doc.file_size && (
                    <Badge variant="outline">{formatFileSize(doc.file_size)}</Badge>
                  )}
                  {doc.created_date && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(doc.created_date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  )}
                  {doc.expiry_date && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Expire: {format(new Date(doc.expiry_date), 'dd MMM yyyy', { locale: fr })}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}