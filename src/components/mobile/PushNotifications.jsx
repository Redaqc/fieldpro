import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

/**
 * AUDIT FIX: Critical Issue #1 (Frontend)
 * - Added proper error handling
 * - Added user_email to subscription payload
 * - Added loading and error states
 * - Added user-friendly error messages
 */

export default function PushNotifications() {
  const [permission, setPermission] = useState('default');
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!supported) {
      setError('Push notifications are not supported on this device/browser');
      return;
    }

    if (!user?.email) {
      setError('User not authenticated. Please log in to enable notifications.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');

          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
            )
          });

          // Save subscription to backend with user email
          const response = await base44.functions.invoke('savePushSubscription', {
            subscription: subscription.toJSON(),
            user_email: user.email
          });

          if (!response.success) {
            throw new Error(response.error || 'Failed to save subscription');
          }

          setError(null);
        }
      } else if (result === 'denied') {
        setError('Notification permission was denied. Please enable in browser settings.');
      }
    } catch (err) {
      console.error('[PushNotifications] Failed to enable notifications:', err);
      setError(
        err.message ||
        'Failed to enable push notifications. Please try again or contact support.'
      );
    } finally {
      setLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!supported) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {permission === 'granted' ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <p className="font-medium text-sm">Push Notifications</p>
                <p className="text-xs text-slate-500">
                  {permission === 'granted' ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            {permission !== 'granted' && (
              <Button
                size="sm"
                onClick={requestPermission}
                disabled={loading || !user}
              >
                {loading ? 'Enabling...' : 'Enable'}
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}