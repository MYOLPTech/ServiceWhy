import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { Search, Globe, ChevronDown, Sparkles } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, authError } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

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
    <div className="min-h-screen flex flex-col font-inter bg-[#011E26] text-white">
      {/* Navbar */}
      <nav className="h-24 flex items-center px-8 z-20">
        <div className="flex items-center space-x-2 cursor-pointer">
          <span className="text-white text-2xl font-bold tracking-tight">
            servicewhy
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-[#81d24f] mb-2" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10 -mt-24">
        {authError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-500/90 text-white rounded-lg text-sm text-center shadow-lg">
            {authError.message}
          </div>
        )}

        <h1 className="font-outfit font-bold text-4xl md:text-5xl lg:text-7xl leading-tight max-w-5xl tracking-tight mb-16">
          I built my own Platform<br />in 2 days and <br /><span className="text-[#81d24f]">$200 bucks of Claude!</span>
        </h1>

        <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
          <p className="text-gray-300 mb-6 text-lg">Sign in to access your platform</p>
          <div className="flex justify-center">
            <div className="relative inline-block group">
              <button className="bg-[#81d24f] text-[#011E26] px-10 py-3.5 rounded-full font-bold text-lg hover:bg-[#72c244] transition-colors shadow-[0_0_20px_rgba(129,210,79,0.3)] group-hover:shadow-[0_0_30px_rgba(129,210,79,0.5)]">
                Sign In
              </button>
              <div className="absolute inset-0 opacity-0 overflow-hidden w-full h-full cursor-pointer z-10 flex items-center justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  useOneTap
                  size="large"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 pt-4 text-center z-10 text-white/40 text-sm">
        &copy; {new Date().getFullYear()} ServiceWhy. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
