import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Clock,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

import StatsCard from "../components/dashboard/StatsCard";
import RecentJobs from "../components/dashboard/RecentJobs";
import TechnicianStatus from "../components/dashboard/TechnicianStatus";
import RevenueChart from "../components/dashboard/RevenueChart";

export default function Dashboard() {
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date'),
    initialData: [],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
    initialData: [],
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
    initialData: [],
  });

  // Calculate stats
  const todayJobs = jobs.filter(job => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return job.scheduled_date === today;
  });

  const activeJobs = jobs.filter(job => 
    job.status === 'scheduled' || job.status === 'in_progress'
  );

  const completedJobs = jobs.filter(job => job.status === 'completed');

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  return (
    <div className="p-6 space-y-6 bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back!</h1>
          <p className="text-slate-500 mt-1">Here's what's happening today</p>
        </div>
        <Link to={createPageUrl("Jobs") + "?action=new"}>
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Jobs"
          value={todayJobs.length}
          icon={Briefcase}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          trend={`${activeJobs.length} active`}
        />
        <StatsCard
          title="Total Customers"
          value={customers.length}
          icon={Users}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          trend={`${customers.filter(c => c.status === 'active').length} active`}
        />
        <StatsCard
          title="Revenue (Paid)"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          trend={`${invoices.filter(i => i.status === 'paid').length} invoices`}
        />
        <StatsCard
          title="Completion Rate"
          value={`${jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0}%`}
          icon={TrendingUp}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          trend={`${completedJobs.length} completed`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentJobs jobs={jobs.slice(0, 8)} />
          <RevenueChart invoices={invoices} />
        </div>

        <div className="space-y-6">
          <TechnicianStatus technicians={technicians} jobs={jobs} />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={createPageUrl("Jobs") + "?action=new"}>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Job
                </Button>
              </Link>
              <Link to={createPageUrl("Customers") + "?action=new"}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
              <Link to={createPageUrl("Schedule")}>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  View Schedule
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}