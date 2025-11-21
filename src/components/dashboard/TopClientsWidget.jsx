import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import { useTranslation } from "@/components/shared/translations";

export default function TopClientsWidget({ customers, invoices, lang = 'fr' }) {
  const t = useTranslation(lang);
  const customerRevenue = customers.map(customer => {
    const customerInvoices = invoices.filter(inv => 
      inv.customer_id === customer.id && 
      inv.status === 'paid'
    );
    const totalRevenue = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    return {
      ...customer,
      revenue: totalRevenue,
      invoiceCount: customerInvoices.length
    };
  }).filter(c => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const top3 = customerRevenue.slice(0, 3);
  const remaining = customerRevenue.slice(3, 5);

  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold text-slate-800">
          {t('topClients')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Top 3 - Style podium */}
        <div className="grid grid-cols-3 gap-4">
          {/* 1er place - centre */}
          {top3[0] && (
            <div className="order-2">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-center text-white shadow-lg">
                <p className="text-3xl font-bold mb-2">${top3[0].revenue.toFixed(2)}</p>
                <Badge className="bg-blue-500 text-white mb-3">{top3[0].invoiceCount} {t('salesCount')}</Badge>
                <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                  {top3[0].logo_url ? (
                    <img src={top3[0].logo_url} alt={top3[0].company_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-purple-600">1</span>
                  )}
                </div>
                <p className="font-bold text-sm">{top3[0].first_name} {top3[0].last_name}</p>
                <p className="text-xs opacity-90">{top3[0].company_name}</p>
              </div>
            </div>
          )}

          {/* 2ème place - gauche */}
          {top3[1] && (
            <div className="order-1">
              <div className="bg-white rounded-2xl p-4 text-center border shadow-sm">
                <p className="text-2xl font-bold mb-2">${top3[1].revenue.toFixed(2)}</p>
                <Badge variant="outline" className="mb-3">{top3[1].invoiceCount} {t('salesCount')}</Badge>
                <div className="w-14 h-14 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden">
                  {top3[1].logo_url ? (
                    <img src={top3[1].logo_url} alt={top3[1].company_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-slate-600">2</span>
                  )}
                </div>
                <p className="font-bold text-sm text-slate-900">{top3[1].first_name} {top3[1].last_name}</p>
                <p className="text-xs text-slate-500">{top3[1].company_name}</p>
              </div>
            </div>
          )}

          {/* 3ème place - droite */}
          {top3[2] && (
            <div className="order-3">
              <div className="bg-white rounded-2xl p-4 text-center border shadow-sm">
                <p className="text-2xl font-bold mb-2">${top3[2].revenue.toFixed(2)}</p>
                <Badge variant="outline" className="mb-3">{top3[2].invoiceCount} {t('salesCount')}</Badge>
                <div className="w-14 h-14 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden">
                  {top3[2].logo_url ? (
                    <img src={top3[2].logo_url} alt={top3[2].company_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-slate-600">3</span>
                  )}
                </div>
                <p className="font-bold text-sm text-slate-900">{top3[2].first_name} {top3[2].last_name}</p>
                <p className="text-xs text-slate-500">{top3[2].company_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Clients 4 et 5 - Liste */}
        {remaining.length > 0 && (
          <div className="space-y-2 pt-2">
            {remaining.map((customer, idx) => (
              <div key={customer.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {customer.logo_url ? (
                    <img src={customer.logo_url} alt={customer.company_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-blue-600">{idx + 4}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900">{customer.first_name} {customer.last_name}</p>
                  <p className="text-xs text-slate-500 truncate">{customer.company_name}</p>
                </div>
                <div className="text-sm text-slate-600">{customer.invoiceCount} {t('salesCount')}</div>
                <div className="text-sm font-bold text-slate-900">${customer.revenue.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {customerRevenue.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>{t('noCustomersWithRevenue')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}