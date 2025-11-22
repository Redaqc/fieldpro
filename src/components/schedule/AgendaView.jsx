import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { JOB_STATUS, SERVICE_CALL_STATUS, PRIORITY } from "@/constants/statuses";

export default function AgendaView({ events, onEventClick, startDate }) {
  // Sort events by start date
  const sortedEvents = [...events]
    .filter(e => new Date(e.start) >= startDate)
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  // Group by date
  const groupedByDate = sortedEvents.reduce((acc, event) => {
    const dateKey = format(new Date(event.start), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case JOB_STATUS.COMPLETED: return 'bg-green-100 text-green-800';
      case JOB_STATUS.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case JOB_STATUS.TODO: return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto">
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No upcoming events scheduled</p>
        </div>
      ) : (
        Object.entries(groupedByDate).map(([dateKey, dateEvents]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-bold text-slate-900">{getDateLabel(dateKey)}</h3>
              <Badge variant="outline">{dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}</Badge>
            </div>

            <div className="space-y-3">
              {dateEvents.map(event => (
                <Card
                  key={event.id}
                  onClick={() => onEventClick && onEventClick(event)}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all border-l-4"
                  style={{ 
                    borderLeftColor: event.type === 'job' ? '#3b82f6' : '#10b981'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-slate-900">{event.title}</h4>
                        <Badge className={event.type === 'job' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                          {event.type === 'job' ? 'Job' : 'Service Call'}
                        </Badge>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace('_', ' ')}
                        </Badge>
                        {event.priority === PRIORITY.URGENT && (
                          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Urgent
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                          </span>
                        </div>

                        {event.client_name && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{event.client_name}</span>
                          </div>
                        )}

                        {event.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{event.address}</span>
                          </div>
                        )}

                        {event.technicians.length > 0 && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{event.technicians.map(t => t.name).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}