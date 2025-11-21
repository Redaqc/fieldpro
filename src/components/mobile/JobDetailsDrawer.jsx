import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  User,
  FileText,
  Camera,
  CheckSquare,
  MessageSquare,
  Navigation
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/components/shared/translations";
import TouchOptimizedSelect from "./TouchOptimizedSelect";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function JobDetailsDrawer({ open, onClose, job, lang = 'fr', isOnline }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();
  const t = useTranslation(lang);

  const addCommentMutation = useMutation({
    mutationFn: async (commentText) => {
      const comment = {
        id: `comment_${Date.now()}`,
        text: commentText,
        created_at: new Date().toISOString(),
        created_by: job.technicians?.[0]?.name || 'Technician'
      };

      return base44.entities.Job.update(job.id, {
        comments: [...(job.comments || []), comment]
      });
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ groupIdx, itemIdx }) => {
      const updatedChecklist = [...(job.checklist || [])];
      const item = updatedChecklist[groupIdx].items[itemIdx];
      item.completed = !item.completed;
      item.completed_at = item.completed ? new Date().toISOString() : null;
      item.completed_by = item.completed ? job.technicians?.[0]?.name : null;

      return base44.entities.Job.update(job.id, {
        checklist: updatedChecklist
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    },
  });

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">{job.title}</DialogTitle>
          <p className="text-sm text-slate-600">{job.customer_name}</p>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="text-base">
              {lang === 'fr' ? 'Info' : 'Info'}
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-base">
              {lang === 'fr' ? 'Checklist' : 'Checklist'}
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-base">
              {lang === 'fr' ? 'Notes' : 'Notes'}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="info" className="space-y-4 mt-0">
              {/* Description */}
              {job.description && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    {t('description')}
                  </p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    {job.description}
                  </p>
                </div>
              )}

              {/* Address */}
              {(job.project_addresses?.[0] || job.location) && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    {t('address')}
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        {job.project_addresses?.[0] || job.location}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                {job.start_date && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">
                      {lang === 'fr' ? 'Début' : 'Start'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {format(new Date(job.start_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
                {job.due_date && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">
                      {lang === 'fr' ? 'Échéance' : 'Due'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {format(new Date(job.due_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {/* Technicians */}
              {job.technicians && job.technicians.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    {t('assignedTechnicians')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.technicians.map((tech, idx) => (
                      <Badge key={idx} variant="outline">
                        <User className="w-3 h-3 mr-1" />
                        {tech.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {job.attachments && job.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    {lang === 'fr' ? 'Photos et fichiers' : 'Photos & Files'} ({job.attachments.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {job.attachments.map((att, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        {att.type === 'signature' && (
                          <FileSignature className="absolute top-1 right-1 w-4 h-4 text-white bg-blue-600 rounded p-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="space-y-3 mt-0">
              {job.checklist && job.checklist.length > 0 ? (
                job.checklist.map((group, gIdx) => (
                  <div key={gIdx} className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">{group.name}</h3>
                    <div className="space-y-2">
                      {group.items?.map((item, iIdx) => (
                        <button
                          key={iIdx}
                          onClick={() => toggleChecklistItem.mutate({ groupIdx: gIdx, itemIdx: iIdx })}
                          disabled={!isOnline}
                          className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border hover:bg-slate-50 transition-colors text-left touch-manipulation"
                        >
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            item.completed 
                              ? 'bg-green-600 border-green-600' 
                              : 'border-slate-300'
                          }`}>
                            {item.completed && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${item.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {item.text}
                            </p>
                            {item.completed && item.completed_at && (
                              <p className="text-xs text-green-600 mt-1">
                                {format(new Date(item.completed_at), 'dd/MM/yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>{lang === 'fr' ? 'Aucune checklist' : 'No checklist'}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-3 mt-0">
              {/* Add comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder={lang === 'fr' ? 'Ajouter une note...' : 'Add a note...'}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] text-base resize-none"
                />
                <Button
                  onClick={() => addCommentMutation.mutate(newComment)}
                  disabled={!newComment.trim() || !isOnline || addCommentMutation.isPending}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {lang === 'fr' ? 'Ajouter' : 'Add'}
                </Button>
              </div>

              {/* Comments list */}
              {job.comments && job.comments.length > 0 ? (
                <div className="space-y-2">
                  {job.comments.map((comment, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-sm text-slate-900">{comment.text}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>{comment.created_by || comment.user_name}</span>
                        <span>•</span>
                        <span>{format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>{lang === 'fr' ? 'Aucune note' : 'No notes'}</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="pt-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-12 text-base"
          >
            {lang === 'fr' ? 'Fermer' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}