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
    <div className="p-6 space-y-6">
      <div className="flex gap-4 mb-6 flex-wrap">
        <Input
          placeholder="🔍 Rechercher un appel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-11 text-base shadow-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52 h-11 shadow-sm">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">📋 Tous les statuts</SelectItem>
            <SelectItem value="todo">⚪ À faire</SelectItem>
            <SelectItem value="in_progress">🔵 En cours</SelectItem>
            <SelectItem value="review">🟣 En révision</SelectItem>
            <SelectItem value="completed">🟢 Terminé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-52 h-11 shadow-sm">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🎯 Toutes priorités</SelectItem>
            <SelectItem value="low">🔵 Basse</SelectItem>
            <SelectItem value="medium">🟡 Moyenne</SelectItem>
            <SelectItem value="high">🟠 Haute</SelectItem>
            <SelectItem value="urgent">🔴 Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredCalls.map(call => {
          const overdue = isOverdue(call);
          
          return (
            <Card 
              key={call.id} 
              className="p-5 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-[1.01] border-l-4 bg-gradient-to-r from-white to-slate-50/30"
              style={{ borderLeftColor: call.work_type_color || '#0074D9' }}
              onClick={() => onEditCall(call)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {call.work_type_name && (
                      <Badge 
                        className="text-white text-xs font-medium shadow-sm"
                        style={{ backgroundColor: call.work_type_color || '#0074D9' }}
                      >
                        {call.work_type_name}
                      </Badge>
                    )}
                    <h3 className="font-bold text-xl text-slate-900">{call.title}</h3>
                  </div>

                  {call.customer_name && (
                    <p className="text-sm text-slate-700 font-medium">
                      👤 {call.customer_name}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${statusColors[call.status]} font-medium shadow-sm`}>
                      {call.status === 'todo' ? '⚪ À faire' :
                       call.status === 'in_progress' ? '🔵 En cours' :
                       call.status === 'review' ? '🟣 En révision' : '🟢 Terminé'}
                    </Badge>
                    <Badge className={`${priorityColors[call.priority]} font-medium shadow-sm`}>
                      {call.priority === 'low' ? '🔵 Basse' : 
                       call.priority === 'medium' ? '🟡 Moyenne' : 
                       call.priority === 'high' ? '🟠 Haute' : '🔴 Urgente'}
                    </Badge>
                    {overdue && (
                      <Badge className="bg-red-500 text-white font-medium shadow-sm">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        En retard
                      </Badge>
                    )}
                  </div>

                  {call.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {call.description}
                    </p>
                  )}

                  <div className="flex items-center gap-6 text-sm">
                    {call.due_date && (
                      <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                        <Calendar className="w-4 h-4" />
                        {format(new Date(call.due_date), 'dd MMM yyyy')}
                      </div>
                    )}

                    {call.technicians && call.technicians.length > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{call.technicians.length} technicien{call.technicians.length > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {call.total_time_spent > 0 && (
                      <div className="flex items-center gap-1.5 text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                        ⏱️ {call.total_time_spent}h
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  #{call.call_number || call.id.slice(0, 8)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}