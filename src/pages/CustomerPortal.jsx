import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Briefcase, FileText, MapPin, Clock, DollarSign, Download, Eye } from "lucide-react";
import { format } from "date-fns";

export default function CustomerPortal() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list(),
    initialData: [],
  });

  const currentCustomer = customers.find(c => c.email === currentUser?.email);

  const { data: customerJobs = [] } = useQuery({
    queryKey: ['customerJobs', currentCustomer?.id],
    queryFn: () => base44.entities.Job.filter({ customer_id: currentCustomer?.id }),
    enabled: !!currentCustomer?.id,
    initialData: [],
  });

  const { data: customerInvoices = [] } = useQuery({
    queryKey: ['customerInvoices', currentCustomer?.id],
    queryFn: () => base44.entities.Invoice.filter({ customer_id: currentCustomer?.id }),
    enabled: !!currentCustomer?.id,
    initialData: [],
  });

  if (!currentCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Customer Portal</h2>
          <p className="text-slate-600">No customer profile found for your account. Please contact support.</p>
        </Card>
      </div>
    );
  }

  const statusColors = {
    todo: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-2">Welcome, {currentCustomer.first_name}!</h1>
            <p className="text-blue-100">View your jobs, invoices, and service history</p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Jobs</p>
                  <p className="text-3xl font-bold">
                    {customerJobs.filter(j => j.status === 'in_progress').length}
                  </p>
                </div>
                <Briefcase className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Completed</p>
                  <p className="text-3xl font-bold">
                    {customerJobs.filter(j => j.status === 'completed').length}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Unpaid Invoices</p>
                  <p className="text-3xl font-bold">
                    {customerInvoices.filter(i => i.status !== 'paid').length}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Spent</p>
                  <p className="text-3xl font-bold">
                    ${customerInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0).toFixed(0)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="jobs">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
            <TabsTrigger value="invoices">My Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            {customerJobs.map(job => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        {job.location || job.project_addresses?.[0] || 'No location'}
                      </div>
                      {job.start_date && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          {format(new Date(job.start_date), 'PPP')}
                        </div>
                      )}
                    </div>
                    <Badge className={statusColors[job.status]}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {job.description && (
                    <p className="text-slate-600 mb-4">{job.description}</p>
                  )}

                  {job.technicians?.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Assigned Technicians:</p>
                      <div className="flex gap-2">
                        {job.technicians.map(tech => (
                          <Badge key={tech.id} variant="outline">{tech.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.attachments?.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Documents:</p>
                      <div className="space-y-2">
                        {job.attachments.map((att, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(att.url, '_blank')}
                          >
                            <Eye className="w-3 h-3 mr-2" />
                            {att.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {customerJobs.length === 0 && (
              <Card className="p-12 text-center">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600">No jobs found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            {customerInvoices.map(invoice => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Invoice #{invoice.invoice_number}</h3>
                      <p className="text-sm text-slate-600">
                        Date: {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'PPP') : 'N/A'}
                      </p>
                      {invoice.due_date && (
                        <p className="text-sm text-slate-600">
                          Due: {format(new Date(invoice.due_date), 'PPP')}
                        </p>
                      )}
                    </div>
                    <Badge className={statusColors[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold">${invoice.subtotal?.toFixed(2)}</span>
                    </div>
                    {invoice.tps > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-600">TPS:</span>
                        <span className="font-semibold">${invoice.tps?.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.tvq > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-600">TVQ:</span>
                        <span className="font-semibold">${invoice.tvq?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-lg">${invoice.total?.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            ))}

            {customerInvoices.length === 0 && (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600">No invoices found</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}