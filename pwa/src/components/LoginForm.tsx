'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
         style={{ 
           backgroundImage: `url('data:image/svg+xml;base64,${btoa(`
             <svg width="100%" height="100%" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
               <defs>
                 <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" style="stop-color:#0f766e;stop-opacity:1" />
                   <stop offset="50%" style="stop-color:#134e4a;stop-opacity:1" />
                   <stop offset="100%" style="stop-color:#0f766e;stop-opacity:1" />
                 </linearGradient>
                 <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" style="stop-color:#14b8a6;stop-opacity:0.3" />
                   <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:0.2" />
                 </linearGradient>
               </defs>
               <rect width="100%" height="100%" fill="url(#bgGradient)"/>
               <path d="M0,100 Q300,50 600,100 T1200,100 L1200,200 Q900,150 600,200 T0,200 Z" fill="url(#waveGradient)"/>
               <path d="M0,300 Q400,250 800,300 T1200,300 L1200,400 Q800,350 400,400 T0,400 Z" fill="url(#waveGradient)"/>
               <path d="M0,500 Q200,450 400,500 T800,500 L800,600 Q600,550 400,600 T0,600 Z" fill="url(#waveGradient)"/>
             </svg>
           `)}')`
         }}>
      
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Login Form */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username Field */}
            <div className="relative">
              <input
                type="text"
                placeholder="Email Address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 text-gray-900 placeholder-gray-500 bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-teal-300 focus:ring-opacity-50 focus:border-teal-500 transition-all duration-200 text-lg"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 text-gray-900 placeholder-gray-500 bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-teal-300 focus:ring-opacity-50 focus:border-teal-500 transition-all duration-200 text-lg pr-14"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-center text-sm bg-red-50 border border-red-200 rounded-lg py-2 px-4">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {isLoading ? 'Signing in...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
