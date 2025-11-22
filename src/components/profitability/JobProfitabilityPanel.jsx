import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function JobProfitabilityPanel({ job }) {
  const { data: profitRecord, isLoading, refetch } = useQuery({
    queryKey: ['profitability', job.id],
    queryFn: async () => {
      const records = await base44.entities.ProfitabilityRecord.filter({ job_id: job.id });
      return records[0] || null;
    },
    enabled: !!job?.id,
  });

  const handleRecalculate = async () => {
    try {
      await base44.functions.invoke('calculateProfitability', { job_id: job.id });
      refetch();
    } catch (error) {
      alert('Failed to calculate profitability: ' + error.message);
    }
  };

  if (!job || job.status === 'new') {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-6 text-center">
          <p className="text-slate-500">Loading profitability data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!profitRecord) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">Profitability Analysis</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-slate-500 mb-3">No profitability data yet</p>
          <Button size="sm" onClick={handleRecalculate} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Calculate Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const profitColor = profitRecord.gross_profit >= 0 ? 'text-green-600' : 'text-red-600';
  const marginColor = 
    profitRecord.profit_margin_percent >= 30 ? 'bg-green-500' :
    profitRecord.profit_margin_percent >= 15 ? 'bg-yellow-500' :
    profitRecord.profit_margin_percent >= 0 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Profitability</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={marginColor}>
              {profitRecord.profit_margin_percent.toFixed(1)}% Margin
            </Badge>
            <Button size="sm" variant="ghost" onClick={handleRecalculate}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Revenue vs Cost */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Revenue</p>
            <p className="text-lg font-bold text-green-700">
              ${profitRecord.actual_revenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Total Cost</p>
            <p className="text-lg font-bold text-red-700">
              ${profitRecord.total_cost?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="text-xs space-y-1 bg-slate-50 p-2 rounded">
          <div className="flex justify-between">
            <span>Labor:</span>
            <span className="font-medium">${profitRecord.labor_cost?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span>Materials:</span>
            <span className="font-medium">${profitRecord.material_cost?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span>Equipment:</span>
            <span className="font-medium">${profitRecord.equipment_cost?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span>Overhead:</span>
            <span className="font-medium">${profitRecord.overhead_cost?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Profit */}
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Gross Profit:</span>
            <div className="flex items-center gap-1">
              {profitRecord.gross_profit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-lg font-bold ${profitColor}`}>
                ${Math.abs(profitRecord.gross_profit || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}