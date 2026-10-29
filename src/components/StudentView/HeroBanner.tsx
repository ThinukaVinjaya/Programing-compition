import React from 'react';
import { Competition } from '../../types';
import { 
  Calendar, 
  Code2, 
  Award, 
  Sparkles, 
  ShieldAlert, 
  Info,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface HeroBannerProps {
  competition: Competition | null;
  isDemoData: boolean;
  onOpenAdmin: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  competition,
  isDemoData,
  onOpenAdmin,
}) => {
  if (!competition) return null;

  return (
    <div className="relative mb-10 overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-gradient-to-r from-blue-600/15 via-indigo-600/20 to-purple-600/15 blur-3xl -z-10 pointer-events-none rounded-full" />

      {/* Demo Data Notice Bar */}
      {isDemoData && (
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/70 via-indigo-950/70 to-slate-900/70 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-violet-200 shadow-lg shadow-indigo-950/50">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-violet-600/30 text-violet-300">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </span>
            <span>
              <strong className="text-white">Sample Contest Preview:</strong> Showing verified sample competition results. Upload and publish your official contest Excel spreadsheet via the Admin Panel to show live results.
            </span>
          </div>
          <button
            onClick={onOpenAdmin}
            className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors shrink-0 shadow-sm"
          >
            Admin Import &rarr;
          </button>
        </div>
      )}

      {/* Main Banner Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                {competition.edition}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Official Results Published
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-['Outfit'] tracking-tight text-white">
              {competition.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed">
              {competition.description}
            </p>
          </div>

          {/* Quick contest specs card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-navy-900/80 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Contest Date</p>
                <p className="text-xs sm:text-sm font-semibold text-white">{competition.date}</p>
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl bg-navy-900/80 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Problems / Max Pts</p>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {competition.totalProblems} Problems • {competition.maxScore} Pts
                </p>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 px-4 py-3 rounded-xl bg-navy-900/80 border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/15 text-violet-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Tie-Breaking</p>
                <p className="text-xs sm:text-sm font-semibold text-white capitalize">
                  {competition.tieBreakingRule.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
