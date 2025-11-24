import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wrench, AlertTriangle, Clock, TrendingUp, Calendar, Zap } from "lucide-react";
import { format } from "date-fns";

export default function MaintenanceTracker() {
  const [predicting, setPredicting] = useState(null);
  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
    initialData: [],
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['maintenanceSchedules'],
    queryFn: () => base44.entities.MaintenanceSchedule.list(),
    initialData: [],
  });

  const dueSchedules = schedules.filter(s => s.status === 'due' || s.status === 'overdue');
  const upcomingSchedules = schedules.filter(s => s.status === 'scheduled');

  const handlePredict = async (assetId) => {
    setPredicting(assetId);
    try {
      await base44.functions.invoke('predictMaintenance', { asset_id: assetId });
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] });
      alert('AI prediction completed!');
    } catch (error) {
      alert('Prediction failed: ' + error.message);
    } finally {
      setPredicting(null);
    }
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    due: 'bg-orange-100 text-orange-700',
    overdue: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Maintenance Tracker</h1>
          <p className="text-slate-500 mt-1">AI-powered predictive maintenance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">
                  {schedules.filter(s => s.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Due Soon</p>
                <p className="text-3xl font-bold text-orange-600">
                  {schedules.filter(s => s.status === 'due').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Scheduled</p>
                <p className="text-3xl font-bold text-blue-600">
                  {schedules.filter(s => s.status === 'scheduled').length}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Assets</p>
                <p className="text-3xl font-bold text-purple-600">{assets.length}</p>
              </div>
              <Wrench className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="due">
        <TabsList>
          <TabsTrigger value="due">Due & Overdue</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="due" className="space-y-4">
          {dueSchedules.map(schedule => {
            const asset = assets.find(a => a.id === schedule.asset_id);
            return (
              <Card key={schedule.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{schedule.asset_name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{schedule.maintenance_type}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={statusColors[schedule.status]}>
                          {schedule.status}
                        </Badge>
                        <Badge variant="outline">
                          Due: {schedule.next_due ? format(new Date(schedule.next_due), 'MMM d, yyyy') : 'Not set'}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm">Schedule Now</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {dueSchedules.length === 0 && (
            <Card className="p-12 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">No maintenance due</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingSchedules.map(schedule => (
            <Card key={schedule.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{schedule.asset_name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{schedule.maintenance_type}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Next: {schedule.next_due ? format(new Date(schedule.next_due), 'MMM d, yyyy') : 'Not scheduled'}
                    </p>
                  </div>
                  <Badge className={statusColors[schedule.status]}>
                    {schedule.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {assets.map(asset => {
            const assetSchedules = schedules.filter(s => s.asset_id === asset.id);
            const prediction = assetSchedules[0]?.ai_prediction;
            
            return (
              <Card key={asset.id} className={prediction?.failure_risk > 70 ? 'border-red-300' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{asset.name}</h3>
                      {prediction ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium">
                              Failure Risk: {prediction.failure_risk}%
                            </span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-yellow-500 to-red-600"
                                style={{ width: `${prediction.failure_risk}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-slate-600">{prediction.recommended_action}</p>
                          <p className="text-xs text-slate-500">
                            Predicted date: {prediction.predicted_date ? format(new Date(prediction.predicted_date), 'MMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mt-2">No prediction available</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePredict(asset.id)}
                      disabled={predicting === asset.id}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      {predicting === asset.id ? 'Analyzing...' : 'AI Predict'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}