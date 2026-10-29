import React from 'react';
import { 
  Trophy, 
  ShieldCheck, 
  RefreshCw, 
  Lock, 
  LogOut, 
  Radio, 
  ExternalLink,
  Sparkles,
  Database
} from 'lucide-react';
import { AdminUser, isSupabaseConfigured } from '../services/supabase';

interface NavbarProps {
  currentView: 'student' | 'admin';
  setCurrentView: (view: 'student' | 'admin') => void;
  adminUser: AdminUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastPublished: string | null;
  isDemoData: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  adminUser,
  onOpenLogin,
  onLogout,
  onRefresh,
  isRefreshing,
  lastPublished,
  isDemoData,
}) => {
  const formatTimeAgo = (isoString: string | null) => {
    if (!isoString) return 'Not yet published';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return 'Recently';
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-950/60 bg-navy-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div 
          onClick={() => setCurrentView('student')}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-navy-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-['Outfit'] tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                MS <span className="text-gradient-brand">CodeQuest</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                2026
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Annual Collegiate Algorithm Championship
            </p>
          </div>
        </div>

        {/* Center / Status Indicators */}
        <div className="hidden md:flex items-center gap-3">
          {/* Live Sync Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-medium text-emerald-400">Live Sync</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Updated:</span>
            <span className="font-mono text-slate-200">{formatTimeAgo(lastPublished)}</span>
          </div>

          {/* Database indicator */}
          <div 
            title="MongoDB Atlas Database & Persistent Store"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] font-medium hidden lg:inline">
              MongoDB Storage
            </span>
          </div>

          {/* Demo Data badge */}
          {isDemoData && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-950/60 text-violet-300 border border-violet-500/30">
              <Sparkles className="w-3 h-3 text-violet-400" />
              Demo Data
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Leaderboard"
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* View Switcher / Admin Button */}
          {adminUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView(currentView === 'admin' ? 'student' : 'admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  currentView === 'admin'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                    : 'bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-200 border-indigo-700/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{currentView === 'admin' ? 'View Public Board' : 'Admin Panel'}</span>
              </button>

              <button
                onClick={onLogout}
                title="Sign Out of Admin"
                className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 hover:text-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              id="admin-login-button"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/50 text-slate-200 hover:text-indigo-200 transition-all group"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Admin Login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
