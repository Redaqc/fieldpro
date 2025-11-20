import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WorkflowOverview() {
  const workflows = [
    {
      name: "Lead to Cash",
      color: "blue",
      steps: [
        { module: "Customer Portal", desc: "Customer inquiry", page: "CustomerPortal" },
        { module: "Service Calls", desc: "Create service call", page: "ServiceCalls" },
        { module: "Quotations", desc: "Create quotation", page: "Quotations" },
        { module: "Jobs", desc: "Convert to job (if approved)", page: "Jobs" },
        { module: "Schedule", desc: "Schedule technicians", page: "Schedule" },
        { module: "Time Tracking", desc: "Track work hours", page: "TimeTracking" },
        { module: "Materials", desc: "Log material usage", page: "Materials" },
        { module: "Invoices", desc: "Generate invoice", page: "Invoices" },
        { module: "Payments", desc: "Record payment", page: "Invoices" }
      ]
    },
    {
      name: "Dispatch & Execution",
      color: "green",
      steps: [
        { module: "Dispatcher Dashboard", desc: "View unassigned work", page: "DispatcherDashboard" },
        { module: "Team", desc: "Check technician availability", page: "Team" },
        { module: "Schedule", desc: "Assign and schedule", page: "Schedule" },
        { module: "GPS Tracking", desc: "Monitor location", page: "GPSTracking" },
        { module: "Mobile Tech", desc: "Technician executes work", page: "TechnicianMobile" },
        { module: "Forms", desc: "Complete safety/inspection forms", page: "Forms" },
        { module: "Documents", desc: "Upload completion photos", page: "Documents" }
      ]
    },
    {
      name: "Asset & Maintenance",
      color: "purple",
      steps: [
        { module: "Assets", desc: "Register equipment", page: "Assets" },
        { module: "Jobs", desc: "Assign to jobs", page: "Jobs" },
        { module: "Maintenance Tracker", desc: "Schedule maintenance", page: "MaintenanceTracker" },
        { module: "Automation Rules", desc: "Auto-create maintenance jobs", page: "AutomationRules" },
        { module: "Advanced Analytics", desc: "Predict failures (AI)", page: "AdvancedReports" }
      ]
    },
    {
      name: "Accounting Integration",
      color: "orange",
      steps: [
        { module: "Customers", desc: "Manage customer data", page: "Customers" },
        { module: "Settings", desc: "Configure Zoho/Sage integration", page: "Settings" },
        { module: "Integration Marketplace", desc: "Connect QuickBooks", page: "IntegrationMarketplace" },
        { module: "Invoices", desc: "Sync invoices", page: "Invoices" },
        { module: "Materials", desc: "Sync inventory items", page: "Materials" }
      ]
    },
    {
      name: "Team Communication",
      color: "pink",
      steps: [
        { module: "Team Chat", desc: "Real-time messaging", page: "TeamChat" },
        { module: "Notifications", desc: "Job assignments & alerts", page: "NotificationCenter" },
        { module: "Mobile Tech", desc: "Push notifications", page: "TechnicianMobile" }
      ]
    },
    {
      name: "Automation & Intelligence",
      color: "indigo",
      steps: [
        { module: "Custom Fields", desc: "Define custom data", page: "CustomFields" },
        { module: "Form Automations", desc: "Trigger actions on submissions", page: "FormAutomations" },
        { module: "Automation Rules", desc: "Schedule recurring jobs", page: "AutomationRules" },
        { module: "Recurring Jobs", desc: "Auto-generate jobs", page: "RecurringJobs" },
        { module: "Webhooks", desc: "Trigger external systems", page: "WebhookManager" },
        { module: "Schedule", desc: "AI schedule optimization", page: "Schedule" }
      ]
    },
    {
      name: "Reporting & Analytics",
      color: "teal",
      steps: [
        { module: "Reports", desc: "Standard reports", page: "Reports" },
        { module: "Advanced Analytics", desc: "Deep insights", page: "AdvancedReports" },
        { module: "BI Dashboard", desc: "Executive dashboards", page: "BIDashboard" },
        { module: "Profitability Reports", desc: "Job profit analysis", page: "ProfitabilityReports" },
        { module: "Costs Management", desc: "Track supplier costs", page: "CostsManagement" },
        { module: "Manager Dashboard", desc: "Management KPIs", page: "ManagerDashboard" }
      ]
    }
  ];

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    pink: "from-pink-500 to-pink-600",
    indigo: "from-indigo-500 to-indigo-600",
    teal: "from-teal-500 to-teal-600"
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Workflow Overview</h1>
        <p className="text-slate-500 mt-1">End-to-end business processes across all modules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">37</p>
                <p className="text-sm text-slate-600">Total Modules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-600" />
              <div>
                <p className="text-2xl font-bold">7</p>
                <p className="text-sm text-slate-600">Key Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <ArrowRight className="w-10 h-10 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-slate-600">Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows */}
      <div className="space-y-6">
        {workflows.map((workflow, idx) => (
          <Card key={idx}>
            <CardHeader className={`bg-gradient-to-r ${colorClasses[workflow.color]} text-white`}>
              <CardTitle className="text-xl">{workflow.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                {workflow.steps.map((step, stepIdx) => (
                  <React.Fragment key={stepIdx}>
                    <Link to={createPageUrl(step.page)}>
                      <div className="cursor-pointer hover:scale-105 transition-transform">
                        <Badge className="bg-white text-slate-900 border-2 px-4 py-2 hover:shadow-lg">
                          <div className="text-center">
                            <p className="font-bold text-sm">{step.module}</p>
                            <p className="text-xs text-slate-500">{step.desc}</p>
                          </div>
                        </Badge>
                      </div>
                    </Link>
                    {stepIdx < workflow.steps.length - 1 && (
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entity Relationships */}
      <Card>
        <CardHeader>
          <CardTitle>Key Entity Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-2">Core Entities:</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• Job → Customer, Technicians, Materials, Assets</li>
                  <li>• ServiceCall → Customer, Quotation, Job</li>
                  <li>• Invoice → Job, Customer, Payments</li>
                  <li>• Quotation → Customer, Job, PriceList, Bundle</li>
                  <li>• TimeEntry → Technician, Job, GPSTracking</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Supporting Entities:</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• Material → Job, ServiceCall (material_usages)</li>
                  <li>• Asset → Job (asset_assignments), Maintenance</li>
                  <li>• FormSubmission → Job, FormAutomation</li>
                  <li>• Notification → User, Job, ServiceCall</li>
                  <li>• Integration → External systems (Zoho, QB, etc.)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Availability Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">Jobs</th>
                  <th className="text-center py-3 px-4">Service Calls</th>
                  <th className="text-center py-3 px-4">Settings</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Checklists</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">Templates in Settings</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Time Tracking</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">-</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Material Usage</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">-</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Asset Assignment</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">-</td>
                  <td className="text-center">-</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Task Dependencies</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">-</td>
                  <td className="text-center">Toggle in Settings</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Milestones</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">-</td>
                  <td className="text-center">Toggle in Settings</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Gantt Chart</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">-</td>
                  <td className="text-center">Toggle in Settings</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Invoicing</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">-</td>
                  <td className="text-center">Toggle in Settings</td>
                </tr>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">Cost Tracking</td>
                  <td className="text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center">-</td>
                  <td className="text-center">Toggle in Settings</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Integration Points */}
      <Card>
        <CardHeader>
          <CardTitle>External Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Accounting Systems</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>✓ Zoho Books (OAuth)</li>
                <li>✓ Sage 50 Canada (CSV)</li>
                <li>✓ QuickBooks Online (via Integration Marketplace)</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Communication</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>✓ Email (SendEmail integration)</li>
                <li>✓ SMS (SendSMS integration)</li>
                <li>✓ Push Notifications (Mobile)</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Calendar & Scheduling</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>✓ Google Calendar (via Integration Marketplace)</li>
                <li>✓ AI Schedule Optimizer</li>
                <li>✓ Route Optimizer</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Payments</h3>
              <ul className="space-y-2 text-slate-600">
                <li>✓ Stripe (Credit cards)</li>
                <li>✓ Manual payment recording</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Module Visibility Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Admin Control:</strong> Go to <Link to={createPageUrl("Settings")} className="underline font-semibold">Settings → Configuration Menu</Link> to toggle which modules appear in the navigation menu for all users.
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-purple-900">
              <strong>Role-Based Access:</strong> Go to <Link to={createPageUrl("RoleManager")} className="underline font-semibold">Role Manager</Link> to configure module permissions per role (technician, dispatcher, manager).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}