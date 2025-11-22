import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";

export default function JobsTable({ jobs, onEditJob }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_date');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedJobs = jobs
    .filter(job => 
      !search || 
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'due_date' || sortField === 'created_date') {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const statusLabels = {
    todo: 'À faire',
    in_progress: 'En cours',
    review: 'En révision',
    completed: 'Terminé',
    archived: 'Archivé',
  };

  const statusColors = {
    todo: 'bg-slate-100 text-slate-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6">
      <Input
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-md"
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-2">
                    Titre
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-2">
                    Statut
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-2">
                    Priorité
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('due_date')}>
                  <div className="flex items-center gap-2">
                    Échéance
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left p-3">Technicien</th>
                <th className="text-left p-3">Labels</th>
                <th className="text-left p-3">Progression</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedJobs.map(job => {
                const allChecklistItems = job.checklist?.flatMap(g => g.items || []) || [];
                const completedItems = allChecklistItems.filter(i => i.completed).length;
                const progress = allChecklistItems.length > 0 
                  ? Math.round((completedItems / allChecklistItems.length) * 100) 
                  : 0;

                return (
                  <tr 
                    key={job.id} 
                    className="border-b hover:bg-slate-50 cursor-pointer"
                    onClick={() => onEditJob(job)}
                  >
                    <td className="p-3">
                      <div className="font-medium">{job.title}</div>
                      {job.description && (
                        <div className="text-sm text-slate-600 line-clamp-1">
                          {job.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge className={statusColors[job.status]}>
                        {statusLabels[job.status]}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={priorityColors[job.priority]}>
                        {job.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {job.due_date ? (
                        <span className={new Date(job.due_date) < new Date() && job.status !== 'completed' ? 'text-red-600 font-semibold' : ''}>
                          {format(new Date(job.due_date), 'dd/MM/yyyy')}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {job.technician_name ? (
                        <Badge variant="outline" className="text-xs">
                          {job.technician_name}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {job.labels?.slice(0, 3).map((label, idx) => (
                          <Badge 
                            key={idx} 
                            className="text-white text-xs"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </Badge>
                        ))}
                        {job.labels?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.labels.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {allChecklistItems.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{progress}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}