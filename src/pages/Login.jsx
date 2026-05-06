import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const { login, isAuthenticated, authError } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSuccess = (credentialResponse) => {
    login(credentialResponse);
  };

  const handleError = () => {
    console.error('Login Failed');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white w-8 h-8">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">ServiceWhy</CardTitle>
          <CardDescription className="text-slate-500 text-base">
            Sign in to access your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-10 space-y-4">
          {authError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100 mb-4">
              {authError.message}
            </div>
          )}
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            theme="outline"
            size="large"
            shape="pill"
          />
        </CardContent>
      </Card>
      
      <div className="mt-8 text-sm text-slate-400">
        &copy; {new Date().getFullYear()} ServiceWhy. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
