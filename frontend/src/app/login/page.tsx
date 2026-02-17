'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Shield, User, Lock, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'admin' | 'adm'>('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setIsLoading(true);
    try {
      await login(user, pass);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0B1120 0%, #111827 50%, #0F172A 100%)' }}>

      {/* Background decorations */}
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/3 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">Axis Max Life</h1>
              <p className="text-xs text-gray-500 tracking-wider uppercase">ADM Activation Platform</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Sign in to manage agent activation and performance
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Role tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-white/[0.03] rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'admin'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/20 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
            <button
              onClick={() => setActiveTab('adm')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'adm'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              ADM Login
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'admin' : 'Enter ADM username'}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick login buttons */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-gray-500 text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Demo Quick Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('admin', 'admin123')}
                disabled={isLoading}
                className="py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all disabled:opacity-50"
              >
                Admin Login
              </button>
              <button
                onClick={() => quickLogin('rakesh', 'demo123')}
                disabled={isLoading}
                className="py-2 px-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all disabled:opacity-50"
              >
                ADM: Rajiv M.
              </button>
              <button
                onClick={() => quickLogin('priyanka', 'demo123')}
                disabled={isLoading}
                className="py-2 px-3 rounded-lg bg-purple-500/5 border border-purple-500/10 text-xs text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all disabled:opacity-50"
              >
                ADM: Priyanka K.
              </button>
              <button
                onClick={() => quickLogin('suresh', 'demo123')}
                disabled={isLoading}
                className="py-2 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all disabled:opacity-50"
              >
                ADM: Suresh V.
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          ADM Agent Activation Platform &bull; Axis Max Life Insurance
        </p>
      </div>
    </div>
  );
}
