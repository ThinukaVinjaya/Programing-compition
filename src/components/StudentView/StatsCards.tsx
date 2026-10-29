import React from 'react';
import { LeaderboardStats } from '../../types';
import { 
  Users, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  Target,
  Clock
} from 'lucide-react';

interface StatsCardsProps {
  stats: LeaderboardStats;
  maxScore: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, maxScore }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
      
      {/* Total Participants */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Participants
          </span>
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white">
            {stats.totalParticipants}
          </span>
          <span className="text-xs text-slate-400 font-medium">Contestants</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Verified Leaderboard entries
        </p>
      </div>

      {/* Highest Score */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Highest Score
          </span>
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform">
            <Flame className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black font-['Outfit'] text-gradient-gold">
            {stats.highestScore}
          </span>
          <span className="text-xs text-slate-400 font-medium">/ {maxScore} pts</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <span className="text-amber-400 font-semibold">{stats.perfectScores}</span> full marks scored
        </p>
      </div>

      {/* Average Score */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Average Score
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white">
            {stats.averageScore}
          </span>
          <span className="text-xs text-slate-400 font-medium">pts (Median: {stats.medianScore})</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Across all competitive rounds
        </p>
      </div>

      {/* Average Solved / Total Submissions */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avg Problems Solved
          </span>
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white">
            {stats.averageSolved}
          </span>
          <span className="text-xs text-slate-400 font-medium">problems</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <span className="text-purple-300 font-semibold">{stats.totalSubmissions || 0}</span> total submissions logged
        </p>
      </div>

    </div>
  );
};
