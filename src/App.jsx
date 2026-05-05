import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Controls from './pages/Controls';
import Evidence from './pages/Evidence';
import Risks from './pages/Risks';
import Policies from './pages/Policies';
import Tasks from './pages/Tasks';
import AuditReadiness from './pages/AuditReadiness';
import ObligationRegister from './pages/ObligationRegister';
import Cmdb from './pages/Cmdb';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import Incidents from './pages/Incidents';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/controls" element={<Controls />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/risks" element={<Risks />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/audit" element={<AuditReadiness />} />
        <Route path="/obligations" element={<ObligationRegister />} />
        <Route path="/cmdb" element={<Cmdb />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/incidents" element={<Incidents />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App