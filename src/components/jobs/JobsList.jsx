import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, CheckSquare, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { JOB_STATUS } from "@/constants/statuses";

export default function JobsList({ jobs, onEditJob }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredJobs = jobs.filter(job => {
    const matchSearch = !search || 
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchPriority = filterPriority === 'all' || job.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const statusColors = {
    [JOB_STATUS.TODO]: 'bg-slate-100 text-slate-800',
    [JOB_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [JOB_STATUS.REVIEW]: 'bg-purple-100 text-purple-800',
    [JOB_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
    [JOB_STATUS.ARCHIVED]: 'bg-gray-100 text-gray-800',
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const isOverdue = (job) => {
    if (!job.due_date || job.status === JOB_STATUS.COMPLETED) return false;
    return new Date(job.due_date) < new Date();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value={JOB_STATUS.TODO}>À faire</SelectItem>
            <SelectItem value={JOB_STATUS.IN_PROGRESS}>En cours</SelectItem>
            <SelectItem value={JOB_STATUS.REVIEW}>En révision</SelectItem>
            <SelectItem value={JOB_STATUS.COMPLETED}>Terminé</SelectItem>
            <SelectItem value={JOB_STATUS.ARCHIVED}>Archivé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="low">Basse</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredJobs.map(job => {
          const overdue = isOverdue(job);
          
          return (
            <Card 
              key={job.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onEditJob(job)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    {job.labels && job.labels.length > 0 && (
                      <div className="flex gap-1">
                        {job.labels.map((label, idx) => (
                          <Badge 
                            key={idx} 
                            className="text-white text-xs"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Badge className={statusColors[job.status]}>
                      {job.status === JOB_STATUS.TODO ? 'À faire' :
                       job.status === JOB_STATUS.IN_PROGRESS ? 'En cours' :
                       job.status === JOB_STATUS.REVIEW ? 'En révision' :
                       job.status === JOB_STATUS.COMPLETED ? 'Terminé' : 'Archivé'}
                    </Badge>
                    <Badge className={priorityColors[job.priority]}>
                      {job.priority}
                    </Badge>
                    {overdue && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        En retard
                      </Badge>
                    )}
                  </div>

                  {job.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    {job.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                          {format(new Date(job.due_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                    )}

                    {job.technician_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{job.technician_name}</span>
                      </div>
                    )}

                    {job.checklist && job.checklist.length > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckSquare className="w-4 h-4" />
                        <span>
                          {job.checklist.flatMap(g => g.items || []).filter(i => i.completed).length}/
                          {job.checklist.flatMap(g => g.items || []).length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}