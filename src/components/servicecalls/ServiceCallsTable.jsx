import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUp, ArrowDown, Eye, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ServiceCallsTable({ calls = [], onEditCall, technicians = [], customers = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortField, setSortField] = useState("created_date");
  const [sortDirection, setSortDirection] = useState("desc");

  const filteredAndSortedCalls = calls
    .filter(call => {
      const matchesSearch = call.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           call.call_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           call.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || call.status === filterStatus;
      const matchesPriority = filterPriority === "all" || call.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'created_date' || sortField === 'due_date') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      todo: 'bg-slate-100 text-slate-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      archived: 'bg-slate-200 text-slate-700',
    };
    const labels = {
      todo: '⚪ À faire',
      in_progress: '🔵 En cours',
      review: '🟣 Révision',
      completed: '🟢 Terminé',
      archived: '⚫ Archivé',
    };
    return <Badge className={`${colors[status]} font-medium shadow-sm`}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-500 text-white',
    };
    const labels = {
      low: '🔵 Basse',
      medium: '🟡 Moyenne',
      high: '🟠 Haute',
      urgent: '🔴 Urgente',
    };
    return <Badge className={`${colors[priority]} font-medium shadow-sm`}>{labels[priority]}</Badge>;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowDown className="w-3 h-3 opacity-0 group-hover:opacity-30" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3 h-3" /> : 
      <ArrowDown className="w-3 h-3" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="🔍 Rechercher un appel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 shadow-sm"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 h-11 shadow-sm">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">📋 Tous statuts</SelectItem>
            <SelectItem value="todo">⚪ À faire</SelectItem>
            <SelectItem value="in_progress">🔵 En cours</SelectItem>
            <SelectItem value="review">🟣 Révision</SelectItem>
            <SelectItem value="completed">🟢 Terminé</SelectItem>
            <SelectItem value="archived">⚫ Archivé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48 h-11 shadow-sm">
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

      <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead 
                className="cursor-pointer group hover:bg-slate-100 font-semibold"
                onClick={() => handleSort('call_number')}
              >
                <div className="flex items-center gap-2">
                  📋 Numéro
                  <SortIcon field="call_number" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer group hover:bg-slate-100 font-semibold"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  📝 Titre
                  <SortIcon field="title" />
                </div>
              </TableHead>
              <TableHead className="font-semibold">👤 Client</TableHead>
              <TableHead className="font-semibold">👷 Techniciens</TableHead>
              <TableHead 
                className="cursor-pointer group hover:bg-slate-100 font-semibold"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  📊 Statut
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer group hover:bg-slate-100 font-semibold"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-2">
                  🎯 Priorité
                  <SortIcon field="priority" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer group hover:bg-slate-100 font-semibold"
                onClick={() => handleSort('due_date')}
              >
                <div className="flex items-center gap-2">
                  📅 Échéance
                  <SortIcon field="due_date" />
                </div>
              </TableHead>
              <TableHead className="font-semibold">⏱️ Temps</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCalls.map(call => (
              <TableRow key={call.id} className="hover:bg-blue-50 transition-colors">
                <TableCell className="font-mono text-sm font-semibold text-slate-700">
                  {call.call_number || `#${call.id.slice(0, 8)}`}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">{call.title}</TableCell>
                <TableCell className="text-slate-700">{call.customer_name || '-'}</TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {(call.technicians || []).slice(0, 3).map(tech => {
                      const fullTech = technicians.find(t => t.id === tech.id);
                      if (!fullTech) return null;
                      return (
                        <div
                          key={tech.id}
                          className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: fullTech.color || '#64748b' }}
                          title={`${fullTech.first_name} ${fullTech.last_name}`}
                        >
                          {fullTech.first_name[0]}{fullTech.last_name[0]}
                        </div>
                      );
                    })}
                    {(call.technicians || []).length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-medium">
                        +{call.technicians.length - 3}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(call.status)}</TableCell>
                <TableCell>{getPriorityBadge(call.priority)}</TableCell>
                <TableCell>
                  {call.due_date ? (
                    <span className={new Date(call.due_date) < new Date() && call.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                      {format(new Date(call.due_date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {call.total_time_spent > 0 ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-3" />
                      {call.total_time_spent}h
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditCall(call)}
                    className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedCalls.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Aucun appel de service trouvé
        </div>
      )}
    </div>
  );
}