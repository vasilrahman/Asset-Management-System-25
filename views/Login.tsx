import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { navigate } = useApp();
  const { login: authLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loggedUser = await authLogin(username, password);
      if (loggedUser.role === 'ADMIN') {
        navigate('/dashboard');
      } else if (loggedUser.role === 'STAFF') {
        navigate('/staff/home');
      }
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Left Side - Image */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900">
        <img 
            // src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Architecture" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-slate-900/90" />
        <div className="relative z-10 flex flex-col justify-between p-16 h-full text-white">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <span className="text-xl font-medium tracking-wide">AMS</span>
            </div>
            
            <div className="max-w-md">
                <h1 className="text-5xl font-light leading-tight mb-6">Manage assets with <span className="font-semibold text-[#afc9ff]">precision</span>.</h1>
                <p className="text-lg text-slate-300 font-light leading-relaxed">
                    Streamline your inventory, track lifecycles, and ensure compliance with our modern enterprise solution.
                </p>
            </div>

            <div className="text-sm text-slate-400 font-light">
                © 2024 Asset Management System. All rights reserved.
            </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="inline-block p-4 rounded-full bg-indigo-50 mb-6 lg:hidden">
                 <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500 font-light">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
                <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 font-medium mb-2">Username</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <UserIcon size={18} />
                    </div>
                    <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    />
                </div>
                </div>

                <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 font-medium mb-2">Password</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock size={18} />
                    </div>
                    <input
                    type="password"
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>
                </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center justify-center border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-4 px-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};