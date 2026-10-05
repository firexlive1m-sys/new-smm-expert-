import React, { useState } from 'react';
import { loginAdmin } from '../../lib/adminAuth';
import { Shield, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToSite,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the admin password');
      return;
    }

    const success = loginAdmin(password, remember);
    if (success) {
      setError('');
      onLoginSuccess();
    } else {
      setError('Incorrect admin password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        {/* Top Header */}
        <div className="text-center mb-6">
          <img
            src="https://i.ibb.co/dsQxmK1G/file-0000000085c881f4b687018bdb77e122.png"
            alt="SkyRocket"
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow-lg shadow-pink-500/20"
          />
          <h1 className="text-xl font-black text-white tracking-tight">SkyRocket Admin Panel</h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            SkyRocket Management Console
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-[#F72585] focus:ring-1 focus:ring-[#F72585] transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-700 text-[#F72585] focus:ring-0"
              />
              <span>Remember session</span>
            </label>
            <span className="text-slate-500 text-[11px]">Authorized personnel only</span>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F72585] to-[#FF4FA0] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>Unlock Admin Panel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
          <button
            onClick={onBackToSite}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Website</span>
          </button>
        </div>
      </div>
    </div>
  );
};
