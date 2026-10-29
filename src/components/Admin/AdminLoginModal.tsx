import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, X, ShieldCheck, Sparkles } from 'lucide-react';
import { adminSignIn, AdminUser } from '../../services/supabase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { user, error } = await adminSignIn(username, password);
      if (error || !user) {
        setErrorMsg(error || 'Invalid administrator credentials');
      } else {
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillThinukaAdmin = () => {
    setUsername('thinuka');
    setPassword('thinuka@123');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-[2px] shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center">
              <Lock className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] text-white">Administrator Access</h3>
            <p className="text-xs text-slate-400">Protected MS CodeQuest portal</p>
          </div>
        </div>

        {/* Demo Credentials Helper Pill */}
        <div className="mb-6 p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-slate-300">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Admin Credentials
            </span>
            <button
              type="button"
              onClick={fillThinukaAdmin}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Click to Auto-Fill (thinuka)
            </button>
          </div>
          <p className="text-slate-300 font-mono text-[11px]">
            User: <strong className="text-white">thinuka</strong> • Pass: <strong className="text-white">thinuka@123</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="thinuka"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Enter Admin Console</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500 mt-5">
          Access is restricted to authorized MS CodeQuest competition arbiters.
        </p>
      </div>
    </div>
  );
};
