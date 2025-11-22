import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, XCircle, Upload } from "lucide-react";

export default function PhotoRequirements({ job }) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const defaultRequirements = [
    { id: 'before', label: 'Before Work', required: true, completed: false },
    { id: 'progress', label: 'Work in Progress', required: false, completed: false },
    { id: 'after', label: 'After Work', required: true, completed: false },
    { id: 'equipment', label: 'Equipment Used', required: false, completed: false },
  ];

  const photoReqs = job?.photo_requirements || defaultRequirements;

  const completedPhotos = (job?.attachments || []).filter(att => 
    att.type && ['before', 'progress', 'after', 'equipment'].includes(att.type)
  );

  const updatePhotosMutation = useMutation({
    mutationFn: ({ attachments, requirements }) => 
      base44.entities.Job.update(job.id, { 
        attachments, 
        photo_requirements: requirements 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handlePhotoUpload = async (e, reqId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newAttachment = {
        name: file.name,
        url: file_url,
        type: reqId,
        uploaded_at: new Date().toISOString(),
        uploaded_by: (await base44.auth.me()).email
      };

      const updatedAttachments = [...(job.attachments || []), newAttachment];
      const updatedReqs = photoReqs.map(req => 
        req.id === reqId ? { ...req, completed: true } : req
      );

      updatePhotosMutation.mutate({ 
        attachments: updatedAttachments, 
        requirements: updatedReqs 
      });
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const allRequiredComplete = photoReqs
    .filter(req => req.required)
    .every(req => req.completed);

  return (
    <Card className={allRequiredComplete ? 'border-green-200' : 'border-orange-200'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photo Requirements
          </span>
          {allRequiredComplete ? (
            <Badge className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          ) : (
            <Badge className="bg-orange-500">Incomplete</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {photoReqs.map(req => {
          const photos = completedPhotos.filter(p => p.type === req.id);
          
          return (
            <div key={req.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {req.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-300" />
                  )}
                  <span className="font-medium">{req.label}</span>
                  {req.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
                <label>
                  <Button size="sm" variant="outline" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, req.id)}
                    className="hidden"
                  />
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        onClick={() => window.open(photo.url, '_blank')}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {!allRequiredComplete && (
          <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm text-orange-700">
            ⚠️ Required photos must be uploaded before completing this job
          </div>
        )}
      </CardContent>
    </Card>
  );
}