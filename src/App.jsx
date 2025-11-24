import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary, { InlineErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app with both public and private routes
  return (
    <ErrorBoundary title="Application Error">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        } />

        {/* Private Routes - Require Authentication */}
        {!isAuthenticated ? (
          // If not authenticated, redirect all routes to login
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : (
          // If authenticated, render app routes
          <>
            <Route path="/" element={
              <LayoutWrapper currentPageName={mainPageKey}>
                <InlineErrorBoundary title="Page Error" message="The main page encountered an error.">
                  <MainPage />
                </InlineErrorBoundary>
              </LayoutWrapper>
            } />
            {Object.entries(Pages).map(([path, Page]) => (
              <Route
                key={path}
                path={`/${path}`}
                element={
                  <LayoutWrapper currentPageName={path}>
                    <InlineErrorBoundary title="Page Error" message={`The ${path} page encountered an error.`}>
                      <Page />
                    </InlineErrorBoundary>
                  </LayoutWrapper>
                }
              />
            ))}
            <Route path="*" element={<PageNotFound />} />
          </>
        )}
      </Routes>
    </ErrorBoundary>
  );
};


function App() {
  /**
   * LOW PRIORITY P4 Issue #40 - Error Boundaries
   * LOW PRIORITY P4 Issue #41 - Dark Mode Support
   * Wrap entire app with ErrorBoundary and ThemeProvider
   */
  return (
    <ErrorBoundary title="FieldPro FSM - Critical Error">
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary title="Authentication Error">
            <QueryClientProvider client={queryClientInstance}>
              <ErrorBoundary title="Application Error">
                <Router>
                  <NavigationTracker />
                  <AuthenticatedApp />
                </Router>
                <Toaster />
                <VisualEditAgent />
              </ErrorBoundary>
            </QueryClientProvider>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
