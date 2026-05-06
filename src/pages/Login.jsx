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
    <div className="min-h-screen flex flex-col font-inter bg-[#011E26]">
      {/* Navbar */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 z-20 relative bg-[#011E26]">
        <div className="flex items-center space-x-10">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer">
            <span className="text-white text-xl font-bold tracking-tight">
              servicewhy
            </span>
            <div className="w-2 h-2 rounded-full bg-[#81d24f] mb-2" />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-6 text-sm text-gray-200">
            {['Products', 'Industries', 'Learning', 'Support', 'Partners', 'Company', 'Knowledge'].map((item) => (
              <button key={item} className="flex items-center hover:text-white transition-colors">
                {item} <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-6 text-sm">
          <button className="text-gray-200 hover:text-white">
            <Search className="w-4 h-4" />
          </button>
          <button className="text-gray-200 hover:text-white">
            <Globe className="w-4 h-4" />
          </button>
          
          <div className="relative group cursor-pointer text-gray-200 hover:text-white">
            <span>Sign In</span>
            <div className="absolute inset-0 opacity-0 overflow-hidden w-full h-full cursor-pointer">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap
              />
            </div>
          </div>

          <button className="bg-[#62D84E] text-[#011E26] px-5 py-2 rounded-full font-semibold hover:bg-[#52c73e] transition-colors">
            Get Started
          </button>
        </div>
      </nav>

      {/* Banner */}
      <div className="bg-[#0a424e] py-3 px-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm z-20 relative">
        <div className="flex items-center font-bold text-white tracking-tight">
          drinky<span className="text-[#81d24f] ml-0.5">26</span>
        </div>
        <p className="text-white font-medium text-center">
          Keynote speaker may be running late in your timezone, so grab yourself a drink a sit back and relax. Be with you shortly.
        </p>
        <button className="bg-white text-[#0a424e] px-4 py-1.5 rounded-full font-semibold text-xs hover:bg-gray-100 whitespace-nowrap">
          Tune In
        </button>
      </div>

      {/* Main Hero Content */}
      <div className="flex-1 bg-servicewhy-gradient flex flex-col relative overflow-hidden">
        
        {authError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-500/90 text-white rounded-lg text-sm text-center shadow-lg">
            {authError.message}
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full pt-16 px-6 lg:px-12 flex flex-col lg:flex-row justify-between relative z-10">
          
          {/* Left Text */}
          <div className="max-w-2xl">
            <p className="text-gray-300 text-xs tracking-[0.15em] font-semibold mb-4 uppercase">
              MAY 6, 2026 | 9:45 A.M. PT
            </p>
            <h1 className="font-outfit font-bold text-5xl md:text-6xl lg:text-[72px] leading-[1.05] tracking-tight">
              <span className="text-[#81d24f] block mb-1">The Beer Coaster to</span>
              <span className="text-white block text-4xl md:text-5xl lg:text-6xl mt-2">Build Your Own GRC Platform with Agentic AI</span>
            </h1>
          </div>

          {/* Right Text & Buttons */}
          <div className="lg:w-[400px] lg:pt-16 mt-8 lg:mt-0 flex flex-col">
            <p className="text-gray-300 text-[15px] leading-relaxed mb-6">
              Don't miss ServiceWhy President, Claude and special guests Anti-gravity as they dive into how ServiceWhy builds and scales AI platforms for under $200.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-[#81d24f] text-[#011E26] px-6 py-2.5 rounded-full font-semibold hover:bg-[#72c244] transition-colors">
                Add To Calendar
              </button>
              <button className="border border-white text-white px-6 py-2.5 rounded-full font-semibold hover:bg-white/10 transition-colors">
                Discover On Demand
              </button>
            </div>
          </div>
        </div>

        {/* Floating Images Collage */}
        <div className="relative w-full h-[450px] mt-12 mx-auto max-w-[1000px] z-10 mb-20">
          
          {/* Center Main Image */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[380px] h-[400px] rounded-[32px] overflow-hidden shadow-2xl z-20 border-[6px] border-[#011E26]/20">
            <img 
              src="/center_speaker.png" 
              alt="Keynote Speaker" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Left Floating Image */}
          <div className="absolute left-[8%] top-[100px] w-[220px] h-[240px] rounded-[24px] overflow-hidden shadow-xl z-10 transform -rotate-3">
            <div className="absolute -top-6 -left-6 z-30 opacity-90">
              <Sparkles className="w-16 h-16 text-purple-300 fill-purple-300/50" />
            </div>
            <img 
              src="/left_speaker.png" 
              alt="Guest Speaker" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Left Bottom Mini Floating Card (approximating the tiny audience card) */}
          <div className="absolute left-[12%] bottom-[20px] w-[140px] h-[160px] rounded-[20px] overflow-hidden shadow-xl z-30 border-4 border-[#011E26]/50">
            <img 
              src="/audience_tablet.png" 
              alt="Audience" 
              className="w-full h-full object-cover object-left"
            />
          </div>

          {/* Right Floating Image */}
          <div className="absolute right-[8%] top-[120px] w-[280px] h-[180px] rounded-[24px] overflow-hidden shadow-xl z-10">
            <div className="absolute -top-5 -left-5 z-30">
              <span className="text-[#81d24f] font-outfit font-black text-6xl drop-shadow-md transform -rotate-12 inline-block">
                26
              </span>
            </div>
            <img 
              src="/audience_tablet.png" 
              alt="Audience viewing tablet" 
              className="w-full h-full object-cover"
            />
            <div className="absolute -bottom-4 -right-4 z-30 opacity-90">
              <Sparkles className="w-12 h-12 text-teal-200 fill-teal-200/50" />
            </div>
          </div>

        </div>

        {/* Footer Tagline */}
        <div className="pb-16 pt-8 text-center z-10 mt-auto">
          <h2 className="font-outfit font-bold text-3xl md:text-4xl text-white tracking-tight">
            The world drinks with ServiceWhy™
          </h2>
        </div>

      </div>
    </div>
  );
};

export default Login;
