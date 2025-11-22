import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Home Page - Redirects to Dashboard
 * This page serves as the entry point and automatically redirects users to the Dashboard
 */
export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Dashboard on mount
    navigate(createPageUrl('Dashboard'), { replace: true });
  }, [navigate]);

  // Show loading state while redirecting
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading FieldPro...</p>
      </div>
    </div>
  );
}
