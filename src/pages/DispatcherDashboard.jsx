import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Navigation,
  Zap,
  Search
} from "lucide-react";
import { format } from "date-fns";

export default function DispatcherDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
    initialData: [],
  });

  const { data: serviceCalls = [] } = useQuery({
    queryKey: ['serviceCalls'],
    queryFn: () => base44.entities.ServiceCall.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  const { data: gpsData = [] } = useQuery({
    queryKey: ['gpsTracking'],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      return await base44.entities.GPSTracking.filter({ 
        timestamp: { $gte: oneHourAgo } 
      });
    },
    refetchInterval: 30000, // Refresh every 30s
    initialData: [],
  });

  // Unassigned work items
  const unassignedWork = useMemo(() => {
    const unassignedJobs = jobs.filter(j => 
      !j.technicians?.length && 
      j.status !== 'completed' && 
      j.status !== 'cancelled'
    ).map(j => ({ ...j, type: 'job' }));

    const unassignedCalls = serviceCalls.filter(c => 
      !c.technicians?.length && 
      c.status !== 'completed' && 
      c.status !== 'cancelled' &&
      c.status !== 'converted'
    ).map(c => ({ ...c, type: 'service_call' }));

    return [...unassignedJobs, ...unassignedCalls].sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [jobs, serviceCalls]);

  // Today's scheduled work
  const todayWork = useMemo(() => {
    const today = format(selectedDate, 'yyyy-MM-dd');
    
    const todayJobs = jobs.filter(j => 
      j.start_date && 
      j.start_date.startsWith(today)
    ).map(j => ({ ...j, type: 'job' }));

    const todayCalls = serviceCalls.filter(c => 
      c.start_date && 
      c.start_date.startsWith(today) &&
      c.status !== 'converted'
    ).map(c => ({ ...c, type: 'service_call' }));

    return [...todayJobs, ...todayCalls];
  }, [jobs, serviceCalls, selectedDate]);

  // Technician status with live GPS
  const technicianStatus = useMemo(() => {
    return technicians.map(tech => {
      const assignedWork = todayWork.filter(w => 
        w.technicians?.some(t => t.id === tech.id)
      );
      
      const latestGPS = gpsData
        .filter(g => g.technician_id === tech.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      const activeWork = assignedWork.find(w => w.status === 'in_progress');

      return {
        ...tech,
        assignedCount: assignedWork.length,
        activeWork,
        lastLocation: latestGPS,
        status: activeWork ? 'busy' : tech.status || 'available'
      };
    });
  }, [technicians, todayWork, gpsData]);

  // Quick assign mutation
  const assignWorkMutation = useMutation({
    mutationFn: async ({ workItem, technicianId }) => {
      const tech = technicians.find(t => t.id === technicianId);
      const updatedTechs = [
        ...(workItem.technicians || []),
        {
          id: tech.id,
          name: `${tech.first_name} ${tech.last_name}`,
          time_spent: 0,
          time_logs: []
        }
      ];

      const updateData = {
        technicians: updatedTechs,
        status: 'scheduled'
      };

      if (workItem.type === 'job') {
        await base44.entities.Job.update(workItem.id, updateData);
      } else {
        await base44.entities.ServiceCall.update(workItem.id, updateData);
      }

      // Send notification
      await base44.functions.invoke('sendNotification', {
        type: 'assignment',
        event_id: workItem.id,
        event_type: workItem.type,
        technician_ids: [technicianId]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['serviceCalls'] });
    },
  });

  const urgentWork = unassignedWork.filter(w => w.priority === 'urgent');
  const overdueWork = todayWork.filter(w => {
    if (!w.due_date) return false;
    return new Date(w.due_date) < new Date() && w.status !== 'completed';
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dispatcher Command Center</h1>
          <p className="text-slate-500 mt-1">Manage assignments, schedules, and field operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-40"
          />
        </div>
      </div>

      {/* Alert Bar */}
      {(urgentWork.length > 0 || overdueWork.length > 0) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Attention Required</p>
              <p className="text-sm text-red-700">
                {urgentWork.length} urgent assignments, {overdueWork.length} overdue items
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Unassigned Work */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Unassigned Work</span>
              <Badge>{unassignedWork.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {unassignedWork.map(item => (
              <div 
                key={item.id}
                className={`p-3 border-2 rounded-lg ${
                  item.priority === 'urgent' ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className={item.type === 'job' ? 'bg-blue-500' : 'bg-green-500'}>
                      {item.type === 'job' ? 'Job' : 'Call'}
                    </Badge>
                    {item.priority === 'urgent' && (
                      <Badge className="ml-1 bg-red-500">URGENT</Badge>
                    )}
                  </div>
                </div>
                <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-slate-600 mb-2">{item.customer_name}</p>
                {item.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </div>
                )}
                
                <div className="flex gap-1 flex-wrap mt-2">
                  {technicianStatus.filter(t => t.status === 'available').slice(0, 3).map(tech => (
                    <Button
                      key={tech.id}
                      size="sm"
                      variant="outline"
                      onClick={() => assignWorkMutation.mutate({ workItem: item, technicianId: tech.id })}
                      disabled={assignWorkMutation.isPending}
                      className="text-xs h-7"
                    >
                      Assign → {tech.first_name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            {unassignedWork.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>All work assigned!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Center: Today's Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today's Schedule</span>
              <Badge>{todayWork.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {todayWork.map(item => (
              <div key={item.id} className="p-3 border rounded-lg bg-white">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={item.type === 'job' ? 'bg-blue-500' : 'bg-green-500'}>
                    {item.type === 'job' ? 'Job' : 'Call'}
                  </Badge>
                  <Badge className={
                    item.status === 'completed' ? 'bg-green-500' :
                    item.status === 'in_progress' ? 'bg-orange-500' : 'bg-slate-400'
                  }>
                    {item.status}
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-slate-600 mb-2">{item.customer_name}</p>
                
                {item.start_date && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(item.start_date), 'h:mm a')}
                  </div>
                )}

                {item.technicians?.map(t => (
                  <div key={t.id} className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                    <User className="w-3 h-3" />
                    {t.name}
                  </div>
                ))}
              </div>
            ))}

            {todayWork.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No work scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Technician Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Technician Status</span>
              <Badge>{technicians.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {technicianStatus.map(tech => (
              <div 
                key={tech.id}
                className={`p-3 border rounded-lg ${
                  tech.status === 'busy' ? 'bg-orange-50 border-orange-200' :
                  tech.status === 'available' ? 'bg-green-50 border-green-200' :
                  'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: tech.color || '#64748b' }}
                    >
                      {tech.first_name[0]}{tech.last_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{tech.first_name} {tech.last_name}</p>
                      <p className="text-xs text-slate-500">{tech.assignedCount} jobs today</p>
                    </div>
                  </div>
                  <Badge className={
                    tech.status === 'busy' ? 'bg-orange-500' :
                    tech.status === 'available' ? 'bg-green-500' : 'bg-slate-400'
                  }>
                    {tech.status}
                  </Badge>
                </div>

                {tech.activeWork && (
                  <div className="text-xs bg-white p-2 rounded border mb-2">
                    <p className="font-medium text-slate-900">{tech.activeWork.title}</p>
                    <p className="text-slate-600">{tech.activeWork.customer_name}</p>
                  </div>
                )}

                {tech.lastLocation && (
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <MapPin className="w-3 h-3" />
                    <span>
                      Last seen {Math.round((Date.now() - new Date(tech.lastLocation.timestamp)) / 60000)} min ago
                    </span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Unassigned</p>
                <p className="text-2xl font-bold text-red-600">{unassignedWork.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {todayWork.filter(w => w.status === 'in_progress').length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {todayWork.filter(w => w.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Available Techs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {technicianStatus.filter(t => t.status === 'available').length}
                </p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}