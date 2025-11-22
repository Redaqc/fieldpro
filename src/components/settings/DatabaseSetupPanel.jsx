import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  FileText
} from 'lucide-react';

/**
 * Database Setup Panel
 *
 * Admin-only component for initializing and verifying database entities
 * Provides one-click setup for critical entities like PushSubscription
 */
export default function DatabaseSetupPanel() {
  const [setupStatus, setSetupStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pushSubStatus, setPushSubStatus] = useState(null);
  const [isPushSubLoading, setIsPushSubLoading] = useState(false);

  // Run full database setup verification
  const handleDatabaseSetup = async () => {
    setIsLoading(true);
    setSetupStatus(null);

    try {
      const result = await base44.functions.invoke('setupDatabase');
      setSetupStatus(result);
    } catch (error) {
      setSetupStatus({
        success: false,
        error: error.message || 'Failed to run database setup'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize PushSubscription entity
  const handleInitializePushSubscription = async () => {
    setIsPushSubLoading(true);
    setPushSubStatus(null);

    try {
      const result = await base44.functions.invoke('initializePushSubscription');
      setPushSubStatus(result);
    } catch (error) {
      setPushSubStatus({
        success: false,
        error: error.message || 'Failed to initialize PushSubscription entity'
      });
    } finally {
      setIsPushSubLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <CardTitle>Database Setup & Verification</CardTitle>
          </div>
          <CardDescription>
            Initialize and verify all required database entities for FieldPro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Database Setup */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">Complete Database Verification</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Check all 45 entities, verify core functionality, and get detailed setup report
                </p>
              </div>
              <Button
                onClick={handleDatabaseSetup}
                disabled={isLoading}
                size="sm"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Run Setup Check
                  </>
                )}
              </Button>
            </div>

            {setupStatus && (
              <Alert className={setupStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-start gap-3">
                  {setupStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <AlertDescription className="text-sm font-medium">
                      {setupStatus.success ? 'Database Setup Complete' : 'Setup Issues Detected'}
                    </AlertDescription>

                    {setupStatus.summary && (
                      <div className="text-xs space-y-1">
                        <div className="flex gap-4">
                          <span>Total Entities: {setupStatus.summary.total_entities}</span>
                          <span>Critical Checked: {setupStatus.summary.critical_entities_checked}</span>
                          {setupStatus.summary.critical_errors > 0 && (
                            <span className="text-red-600 font-semibold">
                              Critical Errors: {setupStatus.summary.critical_errors}
                            </span>
                          )}
                        </div>

                        {setupStatus.core_entities_status && (
                          <div className="flex gap-2 items-center">
                            <span>Core Entities:</span>
                            <Badge variant={setupStatus.core_entities_status.percentage === 100 ? 'success' : 'warning'}>
                              {setupStatus.core_entities_status.percentage}% Verified
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {setupStatus.errors && setupStatus.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-red-700">Errors Found:</p>
                        {setupStatus.errors.map((err, idx) => (
                          <div key={idx} className="text-xs bg-white rounded p-2 border border-red-200">
                            <div className="font-semibold">{err.entity}</div>
                            <div className="text-slate-600">{err.message}</div>
                            {err.action_required && (
                              <div className="text-red-600 mt-1">{err.action_required}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {setupStatus.summary?.recommendations && setupStatus.summary.recommendations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold">Recommendations:</p>
                        <ul className="text-xs space-y-0.5 mt-1">
                          {setupStatus.summary.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </div>

          {/* PushSubscription Initialization */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">PushSubscription Entity</h3>
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Required for web push notifications in mobile app
                </p>
              </div>
              <Button
                onClick={handleInitializePushSubscription}
                disabled={isPushSubLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPushSubLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Initialize Entity
                  </>
                )}
              </Button>
            </div>

            {pushSubStatus && (
              <Alert className={pushSubStatus.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
                <div className="flex items-start gap-3">
                  {pushSubStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : pushSubStatus.manual_creation_required ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <AlertDescription className="text-sm font-medium">
                      {pushSubStatus.message || pushSubStatus.error}
                    </AlertDescription>

                    {pushSubStatus.status && (
                      <div className="text-xs">
                        <Badge variant={
                          pushSubStatus.status === 'exists' || pushSubStatus.status === 'created' ? 'success' :
                          pushSubStatus.status === 'manual_creation_required' ? 'warning' : 'default'
                        }>
                          {pushSubStatus.status}
                        </Badge>
                      </div>
                    )}

                    {pushSubStatus.steps_completed && pushSubStatus.steps_completed.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold">Steps Completed:</p>
                        <ul className="text-xs space-y-0.5 mt-1">
                          {pushSubStatus.steps_completed.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pushSubStatus.next_steps && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-green-700">Next Steps:</p>
                        <ul className="text-xs space-y-0.5 mt-1">
                          {pushSubStatus.next_steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pushSubStatus.manual_creation_required && pushSubStatus.instructions && (
                      <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                        <p className="text-xs font-semibold text-amber-800 mb-2">
                          {pushSubStatus.instructions.title}
                        </p>
                        <p className="text-xs text-slate-600 mb-3">
                          {pushSubStatus.instructions.message}
                        </p>

                        <div className="space-y-2">
                          {pushSubStatus.instructions.steps.slice(0, 4).map((step, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-semibold">{step.step}. {step.action}</span>
                              {step.value && <span className="text-blue-600 ml-1">"{step.value}"</span>}
                            </div>
                          ))}
                          <p className="text-xs text-slate-500 italic">
                            ... and {pushSubStatus.instructions.steps.length - 4} more steps
                          </p>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <a
                            href="https://base44.app/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Open Base44 Dashboard
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </div>

          {/* Documentation Links */}
          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentation
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="/DATABASE_SCHEMA.md"
                target="_blank"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Database Schema
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="/SETUP.md"
                target="_blank"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Setup Guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
