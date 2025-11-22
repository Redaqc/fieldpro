import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download, User, Calendar, FileText, Image as ImageIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SubmissionDetailDialog({ open, onClose, submission, formTemplates }) {
  if (!submission) return null;

  const template = formTemplates.find(t => t.id === submission.form_template_id);

  const renderFieldValue = (field, value) => {
    if (!value && value !== 0 && value !== false) return <span className="text-slate-400">N/A</span>;

    switch (field.type) {
      case 'checkbox':
        return value ? <CheckCircle className="w-5 h-5 text-green-600" /> : <span className="text-slate-400">Non coché</span>;
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} className={star <= value ? 'text-yellow-500' : 'text-slate-300'}>★</span>
            ))}
          </div>
        );
      case 'date':
        return format(new Date(value), 'dd MMMM yyyy', { locale: fr });
      case 'photo':
        return (
          <div className="flex gap-2 flex-wrap">
            {Array.isArray(value) ? value.map((url, idx) => (
              <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="w-32 h-32 object-cover rounded border" />
            )) : <img src={value} alt="Photo" className="w-32 h-32 object-cover rounded border" />}
          </div>
        );
      case 'multiselect':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'textarea':
        return <p className="whitespace-pre-wrap">{value}</p>;
      default:
        return <span>{String(value)}</span>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'reviewed': return 'bg-purple-100 text-purple-700';
      case 'approved': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{submission.form_name}</DialogTitle>
            <div className="flex gap-2">
              <Badge className={getStatusColor(submission.status)}>
                {submission.status === 'draft' ? 'Brouillon' :
                 submission.status === 'submitted' ? 'Soumis' :
                 submission.status === 'reviewed' ? 'Révisé' :
                 submission.status === 'approved' ? 'Approuvé' : submission.status}
              </Badge>
              {submission.pdf_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(submission.pdf_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger PDF
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Submission Info */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Soumis par:</span>
                <span>{submission.submitted_by_name || submission.submitted_by}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Date:</span>
                <span>
                  {submission.submission_date && format(new Date(submission.submission_date), 'PPPp', { locale: fr })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Form Data */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Données du formulaire
            </h3>
            {template?.fields && submission.data ? (
              <div className="space-y-4">
                {template.fields.map(field => {
                  // Skip title and description types as they're not data fields
                  if (field.type === 'text' && !field.required && !submission.data[field.id]) {
                    return null;
                  }

                  return (
                    <Card key={field.id} className="bg-slate-50">
                      <CardContent className="p-4">
                        <p className="font-medium text-slate-700 mb-2">{field.label}</p>
                        <div className="text-slate-900">
                          {renderFieldValue(field, submission.data[field.id])}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <pre className="text-sm bg-white p-4 rounded border overflow-auto">
                    {JSON.stringify(submission.data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Signature */}
          {submission.signature && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Signature</h3>
              <Card>
                <CardContent className="p-4">
                  <img src={submission.signature} alt="Signature" className="max-w-xs border rounded" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Photos */}
          {submission.photos && submission.photos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Photos ({submission.photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {submission.photos.map((photo, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-2">
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}