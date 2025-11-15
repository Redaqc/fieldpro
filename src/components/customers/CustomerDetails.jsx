import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Building2, Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CustomerDetails({ customer, onClose, onEdit, onUpdate, onDelete, jobs }) {
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const totalRevenue = jobs
    .filter(j => j.actual_cost)
    .reduce((sum, j) => sum + j.actual_cost, 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">
                {customer.first_name} {customer.last_name}
              </DialogTitle>
              {customer.company_name && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-4 h-4" />
                  <span>{customer.company_name}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this customer?')) {
                    onDelete();
                    onClose();
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p>{customer.address}</p>
                    {(customer.city || customer.state || customer.zip_code) && (
                      <p className="text-slate-600">
                        {[customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
                <p className="text-sm text-slate-500">Total Jobs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{completedJobs}</p>
                <p className="text-sm text-slate-500">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">${totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-slate-500">Revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{customer.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No jobs yet</p>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 5).map(job => (
                    <Link 
                      key={job.id}
                      to={createPageUrl("Jobs") + "?id=" + job.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{job.title}</p>
                        {job.scheduled_date && (
                          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{format(new Date(job.scheduled_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                      <Badge className={
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}