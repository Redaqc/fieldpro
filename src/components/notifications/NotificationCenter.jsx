import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCheck, Trash2, Mail, MapPin, Briefcase, Clock, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function NotificationCenter({ open, onClose, currentUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: currentUser?.email }, '-created_date', 50),
    enabled: !!currentUser,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, {
      read: true,
      read_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => 
        base44.entities.Notification.update(id, {
          read: true,
          read_at: new Date().toISOString(),
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const typeIcons = {
    job_assigned: <Briefcase className="w-4 h-4" />,
    job_status_changed: <Briefcase className="w-4 h-4" />,
    gps_alert: <MapPin className="w-4 h-4" />,
    time_entry: <Clock className="w-4 h-4" />,
    invoice_paid: <FileText className="w-4 h-4" />,
    quotation_accepted: <FileText className="w-4 h-4" />,
    system: <Bell className="w-4 h-4" />,
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const NotificationItem = ({ notification }) => (
    <div
      className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-50/30' : ''
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${priorityColors[notification.priority] || priorityColors.normal}`}>
          {typeIcons[notification.type] || <Bell className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {format(new Date(notification.created_date), 'PPp', { locale: fr })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteNotificationMutation.mutate(notification.id);
              }}
              className="h-6 px-2"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive">{unreadNotifications.length}</Badge>
              )}
            </SheetTitle>
            {unreadNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Tout marquer lu
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="unread" className="flex-1">
              Non lues ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1">
              Toutes ({notifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="mt-4">
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {unreadNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Aucune nouvelle notification</p>
                </div>
              ) : (
                unreadNotifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Aucune notification</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}