import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_CALL_STATUS, PRIORITY } from "@/constants/statuses";

export default function ServiceCallsCalendar({ calls = [], onEditCall, technicians = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterTechnician, setFilterTechnician] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredCalls = calls.filter(call => {
    const techMatch = filterTechnician === "all" || call.technicians?.some(t => t.id === filterTechnician);
    const statusMatch = filterStatus === "all" || call.status === filterStatus;
    return techMatch && statusMatch;
  });

  const getCallsForDay = (day) => {
    return filteredCalls.filter(call => {
      if (!call.due_date) return false;
      return isSameDay(new Date(call.due_date), day);
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      [PRIORITY.LOW]: 'bg-blue-100 text-blue-700',
      [PRIORITY.MEDIUM]: 'bg-yellow-100 text-yellow-700',
      [PRIORITY.HIGH]: 'bg-orange-100 text-orange-700',
      [PRIORITY.URGENT]: 'bg-red-100 text-red-700',
    };
    return colors[priority] || colors[PRIORITY.MEDIUM];
  };

  const getStatusColor = (status) => {
    const colors = {
      [SERVICE_CALL_STATUS.TODO]: 'bg-gray-100 text-gray-700',
      [SERVICE_CALL_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
      [SERVICE_CALL_STATUS.REVIEW]: 'bg-purple-100 text-purple-700',
      [SERVICE_CALL_STATUS.COMPLETED]: 'bg-green-100 text-green-700',
      [SERVICE_CALL_STATUS.ARCHIVED]: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || colors[SERVICE_CALL_STATUS.TODO];
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Aujourd'hui
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={filterTechnician} onValueChange={setFilterTechnician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Technicien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les techniciens</SelectItem>
              {technicians.map(tech => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.first_name} {tech.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value={SERVICE_CALL_STATUS.TODO}>À faire</SelectItem>
              <SelectItem value={SERVICE_CALL_STATUS.IN_PROGRESS}>En cours</SelectItem>
              <SelectItem value={SERVICE_CALL_STATUS.REVIEW}>En révision</SelectItem>
              <SelectItem value={SERVICE_CALL_STATUS.COMPLETED}>Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="bg-slate-50 p-2 text-center font-semibold text-sm">
            {day}
          </div>
        ))}

        {calendarDays.map(day => {
          const daysCalls = getCallsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toString()}
              className={`bg-white p-2 min-h-32 ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {daysCalls.slice(0, 3).map(call => (
                  <Card
                    key={call.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onEditCall(call)}
                  >
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate">{call.title}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge className={`${getStatusColor(call.status)} text-xs`}>
                          {call.status === SERVICE_CALL_STATUS.TODO ? 'À faire' :
                           call.status === SERVICE_CALL_STATUS.IN_PROGRESS ? 'En cours' :
                           call.status === SERVICE_CALL_STATUS.REVIEW ? 'Révision' :
                           call.status === SERVICE_CALL_STATUS.COMPLETED ? 'Terminé' : call.status}
                        </Badge>
                        <Badge className={`${getPriorityColor(call.priority)} text-xs`}>
                          {call.priority === PRIORITY.URGENT ? '🔥' : call.priority === PRIORITY.HIGH ? '⬆️' : ''}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {daysCalls.length > 3 && (
                  <p className="text-xs text-slate-500 pl-1">+{daysCalls.length - 3} plus</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}