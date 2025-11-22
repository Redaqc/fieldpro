import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function ProfitabilityCard({ record, job }) {
  if (!record) return null;

  const profitColor = record.gross_profit >= 0 ? 'text-green-600' : 'text-red-600';
  const marginColor = 
    record.profit_margin_percent >= 30 ? 'bg-green-500' :
    record.profit_margin_percent >= 15 ? 'bg-yellow-500' :
    record.profit_margin_percent >= 0 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Profitability Analysis</span>
          <Badge className={marginColor}>
            {record.profit_margin_percent.toFixed(1)}% Margin
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue */}
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Revenue</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Quoted:</span>
              <span className="font-medium">${record.quoted_revenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Actual:</span>
              <span className="font-semibold text-green-600">${record.actual_revenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Costs Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Cost Breakdown</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Labor:</span>
              <span className="font-medium">${record.labor_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Materials:</span>
              <span className="font-medium">${record.material_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Equipment:</span>
              <span className="font-medium">${record.equipment_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Overhead (15%):</span>
              <span className="font-medium">${record.overhead_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-1">
              <span>Total Cost:</span>
              <span className="text-red-600">${record.total_cost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Profit */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-600">Gross Profit:</h4>
            <div className="flex items-center gap-2">
              {record.gross_profit >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${profitColor}`}>
                ${Math.abs(record.gross_profit).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Updated timestamp */}
        <p className="text-xs text-slate-400 text-center">
          Calculated {new Date(record.calculated_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}