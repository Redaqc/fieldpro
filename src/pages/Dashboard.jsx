import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, DollarSign, Bell } from "lucide-react";

import PerformanceDashboard from "../components/dashboard/PerformanceDashboard";
import OperationalCosts from "../components/dashboard/OperationalCosts";
import CustomReports from "../components/dashboard/CustomReports";
import AlertManagement from "../components/dashboard/AlertManagement";
import StatsOverview from "../components/dashboard/StatsOverview";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => base44.entities.TimeEntry.list('-created_date', 500),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Vue d'ensemble et analyses avancées</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="costs" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Coûts
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Rapports
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alertes
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <StatsOverview 
            jobs={jobs}
            technicians={technicians}
            timeEntries={timeEntries}
            invoices={invoices}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceDashboard
            technicians={technicians}
            jobs={jobs}
            timeEntries={timeEntries}
          />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="costs" className="mt-6">
              <OperationalCosts
                technicians={technicians}
                timeEntries={timeEntries}
                jobs={jobs}
              />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <CustomReports
                jobs={jobs}
                technicians={technicians}
                timeEntries={timeEntries}
                invoices={invoices}
              />
            </TabsContent>

            <TabsContent value="alerts" className="mt-6">
              <AlertManagement currentUser={currentUser} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}