import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Camera,
  FileSignature,
  Clock,
  CheckCircle,
  PlayCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PhotoCaptureDialog from "./PhotoCaptureDialog";
import SignatureCaptureDialog from "./SignatureCaptureDialog";
import { useTranslation } from "@/components/shared/translations";
import { JOB_STATUS } from "@/constants/statuses";

export default function MobileJobCard({ job, technician, lang = 'fr', isOnline = true }) {
  const [expanded, setExpanded] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslation(lang);

  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, data }) => {
      if (isOnline) {
        return base44.entities.Job.update(jobId, data);
      } else {
        // Store offline
        const offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        offlineQueue.push({
          type: 'job_status',
          jobId,
          status: data.status,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('offline_queue', JSON.stringify(offlineQueue));
        return Promise.resolve({ data: { ...job, ...data } });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
  });

  const handleNavigate = () => {
    const address = job.project_addresses?.[0] || job.location;
    if (!address) {
      alert(lang === 'fr' ? 'Aucune adresse disponible' : 'No address available');
      return;
    }

    // Open in Google Maps or Apple Maps
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${encodedAddress}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    }
  };

  const handleStatusChange = (newStatus) => {
    updateJobMutation.mutate({
      jobId: job.id,
      data: {
        status: newStatus,
        ...(newStatus === JOB_STATUS.IN_PROGRESS && !job.started_at ? { started_at: new Date().toISOString() } : {}),
        ...(newStatus === JOB_STATUS.COMPLETED ? { completed_at: new Date().toISOString() } : {})
      }
    });
  };

  const getStatusColor = () => {
    switch (job.status) {
      case JOB_STATUS.IN_PROGRESS: return 'bg-blue-500';
      case 'scheduled': return 'bg-orange-500';
      case 'new': return 'bg-slate-500';
      case 'on_hold': return 'bg-yellow-500';
      case JOB_STATUS.REVIEW: return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const getPriorityColor = () => {
    switch (job.priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-slate-100 text-slate-800 border-slate-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <>
      <Card className="shadow-md border-l-4" style={{ borderLeftColor: getStatusColor().replace('bg-', '#') }}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-base text-slate-900 mb-1">
                {job.title}
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                {job.customer_name}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor()}>
                  {t(job.status)}
                </Badge>
                <Badge className={getPriorityColor()} variant="outline">
                  {t(job.priority)}
                </Badge>
                {job.job_number && (
                  <Badge variant="outline" className="text-xs">
                    #{job.job_number}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>

          {/* Address and GPS */}
          {(job.project_addresses?.[0] || job.location) && (
            <div className="mb-3 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700 flex-1">
                  {job.project_addresses?.[0] || job.location}
                </p>
              </div>
              <Button
                onClick={handleNavigate}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 h-11 text-base font-medium"
              >
                <Navigation className="w-5 h-5 mr-2" />
                {lang === 'fr' ? 'Naviguer' : 'Navigate'}
              </Button>
            </div>
          )}

          {/* Quick Actions - Large touch targets */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {job.status !== JOB_STATUS.IN_PROGRESS && job.status !== JOB_STATUS.COMPLETED && (
              <Button
                onClick={() => handleStatusChange(JOB_STATUS.IN_PROGRESS)}
                className="h-12 bg-green-600 hover:bg-green-700 text-base font-medium"
                disabled={!isOnline && job.status !== 'scheduled'}
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                {lang === 'fr' ? 'Démarrer' : 'Start'}
              </Button>
            )}

            {job.status === JOB_STATUS.IN_PROGRESS && (
              <Button
                onClick={() => handleStatusChange(JOB_STATUS.COMPLETED)}
                className="h-12 bg-blue-600 hover:bg-blue-700 text-base font-medium col-span-2"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {lang === 'fr' ? 'Terminer' : 'Complete'}
              </Button>
            )}

            <Button
              onClick={() => setPhotoDialogOpen(true)}
              variant="outline"
              className="h-12 text-base font-medium"
            >
              <Camera className="w-5 h-5 mr-2" />
              {lang === 'fr' ? 'Photo' : 'Photo'}
            </Button>

            <Button
              onClick={() => setSignatureDialogOpen(true)}
              variant="outline"
              className="h-12 text-base font-medium"
            >
              <FileSignature className="w-5 h-5 mr-2" />
              {lang === 'fr' ? 'Signature' : 'Sign'}
            </Button>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="pt-3 border-t space-y-3">
              {job.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    {t('description')}
                  </p>
                  <p className="text-sm text-slate-700">{job.description}</p>
                </div>
              )}

              {job.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">
                    {lang === 'fr' ? 'Échéance: ' : 'Due: '}
                    {new Date(job.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Checklist summary */}
              {job.checklist && job.checklist.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-2">
                    {lang === 'fr' ? 'Checklist' : 'Checklist'}
                  </p>
                  {job.checklist.map((group, gIdx) => {
                    const total = group.items?.length || 0;
                    const completed = group.items?.filter(i => i.completed).length || 0;
                    return (
                      <div key={gIdx} className="text-sm text-blue-800">
                        {group.name}: {completed}/{total}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Photos */}
              {job.attachments && job.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    {lang === 'fr' ? 'Photos' : 'Photos'} ({job.attachments.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {job.attachments.slice(0, 5).map((att, idx) => (
                      <img
                        key={idx}
                        src={att.url}
                        alt={att.name}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Status Change Buttons */}
              {job.status !== JOB_STATUS.COMPLETED && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {job.status !== 'on_hold' && (
                    <Button
                      onClick={() => handleStatusChange('on_hold')}
                      variant="outline"
                      className="h-10"
                      disabled={!isOnline}
                    >
                      {lang === 'fr' ? 'Pause' : 'Pause'}
                    </Button>
                  )}
                  {job.status === 'on_hold' && (
                    <Button
                      onClick={() => handleStatusChange(JOB_STATUS.IN_PROGRESS)}
                      variant="outline"
                      className="h-10"
                      disabled={!isOnline}
                    >
                      {lang === 'fr' ? 'Reprendre' : 'Resume'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Capture Dialog */}
      <PhotoCaptureDialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        job={job}
        isOnline={isOnline}
        lang={lang}
      />

      {/* Signature Capture Dialog */}
      <SignatureCaptureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        job={job}
        isOnline={isOnline}
        lang={lang}
      />
    </>
  );
}