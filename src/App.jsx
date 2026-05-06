import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
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
import Login from './pages/Login';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
    <GoogleOAuthProvider clientId="1073471752477-5j9m1pqq0egalql8qqg21d5ad3eqk35i.apps.googleusercontent.com">
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App