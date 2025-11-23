import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary, { InlineErrorBoundary } from '@/components/shared/ErrorBoundary';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  // LOW P4 #40: Wrap routes with ErrorBoundary to catch component errors
  return (
    <ErrorBoundary title="Application Error">
      <Routes>
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
      </Routes>
    </ErrorBoundary>
  );
};


function App() {
  /**
   * LOW PRIORITY P4 Issue #40 - Error Boundaries
   * Wrap entire app with ErrorBoundary to catch and gracefully handle errors
   * Prevents full app crash when individual components fail
   */
  return (
    <ErrorBoundary title="FieldPro FSM - Critical Error">
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
    </ErrorBoundary>
  )
}

export default App
