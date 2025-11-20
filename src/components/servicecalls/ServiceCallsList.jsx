import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, AlertCircle, MapPin } from "lucide-react";
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCalls.map(call => {
          const overdue = isOverdue(call);
          
          return (
            <Card 
              key={call.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white"
              onClick={() => onEditCall(call)}
            >
              {/* Header with Call ID */}
              <div className="px-4 pt-3 pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Job ID: {call.call_number || call.id.slice(0, 5)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Client */}
                {call.customer_name && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">CLIENT</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{call.customer_name}</span>
                    </div>
                  </div>
                )}

                {/* Scheduled */}
                {(call.start_date || call.due_date) && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">SCHEDULED</p>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {call.start_date && format(new Date(call.start_date), 'EEE MMM d h:mm a')}
                        {call.start_date && call.due_date && ' - '}
                        {call.due_date && format(new Date(call.due_date), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">STATUS</p>
                  <Badge className={`${
                    call.status === 'in_progress' ? 'bg-orange-500' :
                    call.status === 'completed' ? 'bg-green-500' :
                    call.status === 'review' ? 'bg-purple-500' : 'bg-slate-400'
                  } text-white text-xs font-medium`}>
                    {call.status === 'todo' ? 'À faire' :
                     call.status === 'in_progress' ? 'En cours' :
                     call.status === 'review' ? 'En révision' : 
                     call.status === 'completed' ? 'Terminé' : 'Archivé'}
                  </Badge>
                </div>

                {/* Title */}
                <h4 className="font-bold text-base text-slate-900 line-clamp-2 leading-tight mt-2">
                  {call.title}
                </h4>

                {/* Address */}
                {(call.location || call.project_addresses?.[0]) && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">ADDRESS</p>
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{call.location || call.project_addresses[0]}</span>
                    </div>
                  </div>
                )}

                {/* Assigned Tech */}
                {call.technicians && call.technicians.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">ASSIGNED TECH</p>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{call.technicians.map(t => t.name).join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Labels */}
              {call.labels && call.labels.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1">
                  {call.labels.map((label, idx) => (
                    <Badge 
                      key={idx}
                      className="text-white text-xs font-medium"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}