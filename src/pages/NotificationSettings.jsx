import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import NotificationSettingsComponent from "../components/notifications/NotificationSettings";

export default function NotificationSettingsPage() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Paramètres de notification</h1>
        <p className="text-slate-500 mt-1">Gérez vos préférences de notification</p>
      </div>

      <NotificationSettingsComponent currentUser={currentUser} />
    </div>
  );
}