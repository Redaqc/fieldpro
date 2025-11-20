import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ServiceCallsList({ calls, onEditCall }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredCalls = calls.filter(call => {
    const matchSearch = !search || 
      call.title?.toLowerCase().includes(search.toLowerCase()) ||
      call.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || call.status === filterStatus;
    const matchPriority = filterPriority === 'all' || call.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const statusColors = {
    todo: 'bg-slate-100 text-slate-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const isOverdue = (call) => {
    if (!call.due_date || call.status === 'completed') return false;
    return new Date(call.due_date) < new Date();
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
            <SelectItem value="todo">À faire</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="review">En révision</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
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
        {filteredCalls.map(call => {
          const overdue = isOverdue(call);
          
          return (
            <Card 
              key={call.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onEditCall(call)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{call.title}</h3>
                    <Badge className={statusColors[call.status]}>
                      {call.status === 'todo' ? 'À faire' :
                       call.status === 'in_progress' ? 'En cours' :
                       call.status === 'review' ? 'En révision' : 'Terminé'}
                    </Badge>
                    <Badge className={priorityColors[call.priority]}>
                      {call.priority}
                    </Badge>
                    {overdue && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        En retard
                      </Badge>
                    )}
                  </div>

                  {call.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {call.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    {call.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                          {format(new Date(call.due_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                    )}

                    {call.technicians && call.technicians.length > 0 && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{call.technicians.length} technicien{call.technicians.length > 1 ? 's' : ''}</span>
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