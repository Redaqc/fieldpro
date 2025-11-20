import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, DollarSign, Users, FileText, MapPin, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const REPORTS = [
  {
    id: 'time_reports',
    name: 'Rapports de Temps',
    description: 'Analyse du temps passé par technicien et projet',
    icon: Clock,
    color: 'bg-blue-500',
    page: 'TimeReports',
  },
  {
    id: 'profitability',
    name: 'Rentabilité',
    description: 'Analyse de rentabilité des projets',
    icon: TrendingUp,
    color: 'bg-green-500',
    page: 'ProfitabilityReports',
  },
  {
    id: 'costs',
    name: 'Gestion des Coûts',
    description: 'Suivi des dépenses et factures fournisseurs',
    icon: DollarSign,
    color: 'bg-orange-500',
    page: 'CostsManagement',
  },
  {
    id: 'team_performance',
    name: 'Performance Équipe',
    description: 'Statistiques de performance des techniciens',
    icon: Users,
    color: 'bg-purple-500',
    page: 'Team',
  },
  {
    id: 'invoices',
    name: 'Facturation',
    description: 'Rapports de facturation et paiements',
    icon: FileText,
    color: 'bg-indigo-500',
    page: 'Invoices',
  },
  {
    id: 'gps_tracking',
    name: 'Suivi GPS',
    description: 'Rapports de localisation et déplacements',
    icon: MapPin,
    color: 'bg-teal-500',
    page: 'GPSTracking',
  },
  {
    id: 'safety_forms',
    name: 'Formulaires Sécurité',
    description: 'Rapports des inspections et incidents',
    icon: AlertTriangle,
    color: 'bg-red-500',
    page: 'Forms',
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Vue d\'ensemble des documents',
    icon: FileText,
    color: 'bg-cyan-500',
    page: 'Documents',
  },
];

export default function Reports() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Centre de Rapports
        </h1>
        <p className="text-slate-500 mt-1">Accédez à tous vos rapports et analyses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {REPORTS.map(report => {
          const Icon = report.icon;
          return (
            <Link key={report.id} to={createPageUrl(report.page)}>
              <Card className="hover:shadow-xl transition-all duration-200 cursor-pointer group h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`${report.color} w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{report.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Export de Données</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-4">
            Tous les rapports peuvent être exportés au format CSV pour une analyse approfondie dans Excel ou d'autres outils.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">Filtres Avancés</p>
              <p className="text-sm text-blue-600">Filtrez par date, statut, technicien, etc.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">Visualisations</p>
              <p className="text-sm text-blue-600">Graphiques interactifs pour mieux comprendre</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">Export CSV</p>
              <p className="text-sm text-blue-600">Téléchargez vos données facilement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}