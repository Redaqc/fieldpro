import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function AIMaintenancePanel({ assets, onRefresh }) {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeAssets = async () => {
    setAnalyzing(true);
    try {
      for (const asset of assets) {
        // Prepare asset data for AI analysis
        const assetData = {
          name: asset.name,
          brand: asset.brand,
          model: asset.model,
          type: asset.type,
          purchase_date: asset.purchase_date,
          last_service_date: asset.last_service_date,
          due_service_date: asset.due_service_date,
          service_interval_days: asset.service_interval_days,
          usage_hours: asset.usage_hours || 0,
          service_history: asset.service_history || [],
          performance_metrics: asset.performance_metrics || [],
          status: asset.status,
          notes: asset.notes
        };

        // Call AI to analyze the asset
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this equipment for maintenance needs and failure risk. 

Equipment Details:
${JSON.stringify(assetData, null, 2)}

Provide:
1. Maintenance suggestions with priority (high/medium/low)
2. Failure risk score (0-100)
3. Recommended next service date
4. Specific concerns or warnings

Return a JSON with this structure:
{
  "suggestions": [{"priority": "high/medium/low", "suggestion": "description", "reason": "why"}],
  "failure_risk_score": 0-100,
  "recommended_service_date": "YYYY-MM-DD",
  "concerns": ["concern1", "concern2"]
}`,
          response_json_schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    priority: { type: "string" },
                    suggestion: { type: "string" },
                    reason: { type: "string" }
                  }
                }
              },
              failure_risk_score: { type: "number" },
              recommended_service_date: { type: "string" },
              concerns: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });

        // Update asset with AI recommendations
        const updatedSuggestions = (analysis.suggestions || []).map(s => ({
          date: new Date().toISOString(),
          priority: s.priority,
          suggestion: s.suggestion,
          reason: s.reason
        }));

        const updateData = {
          ai_maintenance_suggestions: updatedSuggestions,
          failure_risk_score: analysis.failure_risk_score || 0
        };

        // Auto-schedule maintenance if high risk or high priority suggestions
        if (analysis.failure_risk_score > 70 || 
            analysis.suggestions?.some(s => s.priority === 'high')) {
          updateData.due_service_date = analysis.recommended_service_date || 
            format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        }

        // Auto-change status if critical
        if (analysis.failure_risk_score > 85) {
          updateData.status = 'repair_needed';
        }

        await base44.entities.Asset.update(asset.id, updateData);
      }
      
      onRefresh();
      alert('Analyse IA terminée pour tous les équipements!');
    } catch (error) {
      console.error('AI Analysis error:', error);
      alert('Erreur lors de l\'analyse IA');
    } finally {
      setAnalyzing(false);
    }
  };

  // Get high-risk assets
  const highRiskAssets = assets.filter(a => (a.failure_risk_score || 0) > 70);
  const mediumRiskAssets = assets.filter(a => (a.failure_risk_score || 0) > 40 && (a.failure_risk_score || 0) <= 70);

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <CardTitle>Assistant IA - Maintenance Prédictive</CardTitle>
          </div>
          <Button
            onClick={analyzeAssets}
            disabled={analyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {analyzing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyser tous les équipements
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Risque Élevé</p>
                <p className="text-2xl font-bold text-red-700">{highRiskAssets.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Risque Moyen</p>
                <p className="text-2xl font-bold text-yellow-700">{mediumRiskAssets.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Bon État</p>
                <p className="text-2xl font-bold text-green-700">
                  {assets.length - highRiskAssets.length - mediumRiskAssets.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Recent AI Suggestions */}
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Recommandations Récentes
          </h3>
          {assets
            .filter(a => a.ai_maintenance_suggestions && a.ai_maintenance_suggestions.length > 0)
            .slice(0, 5)
            .map((asset) => {
              const latestSuggestion = asset.ai_maintenance_suggestions[asset.ai_maintenance_suggestions.length - 1];
              return (
                <div key={asset.id} className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">{asset.name}</p>
                        <Badge className={
                          latestSuggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                          latestSuggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {latestSuggestion.priority === 'high' ? 'Urgent' :
                           latestSuggestion.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </Badge>
                        {asset.failure_risk_score > 0 && (
                          <Badge variant="outline">
                            Risque: {asset.failure_risk_score}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{latestSuggestion.suggestion}</p>
                      <p className="text-xs text-slate-500 mt-1">{latestSuggestion.reason}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          {assets.filter(a => a.ai_maintenance_suggestions && a.ai_maintenance_suggestions.length > 0).length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              Aucune recommandation IA pour le moment. Cliquez sur "Analyser" pour générer des suggestions.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}