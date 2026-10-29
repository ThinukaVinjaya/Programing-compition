import React from 'react';
import { Participant, SurpriseRevealState } from '../../types';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Sparkles, 
  ExternalLink, 
  CheckCircle,
  Timer,
  School,
  Lock,
  Eye,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PodiumProps {
  participants: Participant[];
  maxScore: number;
  totalProblems: number;
  revealState: SurpriseRevealState;
  onRevealBronze: () => void;
  onRevealSilver: () => void;
  onRevealGold: () => void;
}

export const Podium: React.FC<PodiumProps> = ({
  participants,
  maxScore,
  totalProblems,
  revealState,
  onRevealBronze,
  onRevealSilver,
  onRevealGold,
}) => {
  const first = participants.find(p => p.rank === 1) || participants[0];
  const second = participants.find(p => p.rank === 2) || participants[1];
  const third = participants.find(p => p.rank === 3) || participants[2];

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.2, y: 0.6 },
      colors: ['#f59e0b', '#38bdf8', '#818cf8', '#ec4899', '#ffffff']
    });
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.8, y: 0.6 },
      colors: ['#f59e0b', '#38bdf8', '#818cf8', '#ec4899', '#ffffff']
    });
  };

  if (!first) return null;

  return (
    <section className="mb-14 relative">
      {/* Header section with celebrate button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span>Winners Hall of Fame</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-white">
            Top Three Champions Podium
          </h2>
        </div>

        <button
          onClick={triggerCelebration}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/10 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Celebrate Champions</span>
        </button>
      </div>

      {/* Podium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

        {/* ---------------- 2ND PLACE (SILVER) ---------------- */}
        {second ? (
          revealState.revealedSilver ? (
            <div className="order-2 md:order-1 glass-card rounded-3xl p-6 border-slate-400/30 relative silver-glow group hover:-translate-y-1 transition-all duration-300 animate-fade-in">
              {/* Top Rank Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-slate-400 to-slate-200 text-navy-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <Medal className="w-3.5 h-3.5" />
                <span>2nd Place</span>
              </div>

              <div className="pt-4 text-center">
                {/* Avatar */}
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-slate-600 via-slate-400 to-slate-200 p-1 shadow-lg shadow-slate-400/20 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center text-2xl font-black text-slate-200">
                    {second.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Names */}
                <h3 className="text-xl font-bold text-white tracking-tight truncate" title={second.name}>
                  {second.name}
                </h3>
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-mono mt-0.5">
                  <span>@{second.username}</span>
                </div>

                {second.institution && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-2 truncate">
                    <School className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{second.institution}</span>
                  </div>
                )}

                {/* Score Highlight */}
                <div className="mt-5 p-3 rounded-2xl bg-slate-900/80 border border-slate-700/50">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs uppercase font-medium text-slate-400">Score</span>
                    <span className="text-2xl font-black text-gradient-silver">
                      {second.score} <span className="text-xs text-slate-400 font-normal">/ {maxScore}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-slate-300 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (second.score / maxScore) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-left">
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase">Solved</span>
                    <p className="text-xs font-bold text-emerald-400">{second.solvedQuestions} / {totalProblems}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase">Time</span>
                    <p className="text-xs font-bold text-slate-300">{second.timePenalty || 0} min</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MYSTERY 2ND PLACE (SILVER) CARD */
            <div className="order-2 md:order-1 glass-card rounded-3xl p-6 border-2 border-dashed border-slate-500/40 relative text-center bg-slate-950/60">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-slate-700">
                <Medal className="w-3.5 h-3.5 text-slate-400" />
                <span>2nd Place (Silver)</span>
              </div>

              <div className="pt-6 pb-2">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl font-black text-slate-400 shadow-inner animate-pulse">
                  ?
                </div>
                <h3 className="text-lg font-bold text-slate-300">Mystery Runner-Up</h3>
                <p className="text-xs text-slate-500 mt-1">Identity & Score Sealed</p>

                <div className="mt-6">
                  {revealState.revealedBronze ? (
                    <button
                      onClick={onRevealSilver}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 text-navy-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-slate-300/30 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
                    >
                      🥈 Click to Reveal 2nd Place!
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Reveal 3rd Place first</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : null}

        {/* ---------------- 1ST PLACE (GOLD) ---------------- */}
        {revealState.revealedGold ? (
          <div className="order-1 md:order-2 glass-card rounded-3xl p-7 border-amber-400/50 relative gold-glow group md:-translate-y-4 hover:md:-translate-y-6 transition-all duration-300 bg-gradient-to-b from-amber-500/15 via-navy-900/95 to-navy-950 animate-fade-in">
            {/* Top Golden Crown Badge */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-navy-950 font-black text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-xl shadow-amber-500/30">
              <Crown className="w-4 h-4 fill-navy-950" />
              <span>1st Place Champion</span>
            </div>

            <div className="pt-4 text-center">
              {/* Golden Avatar */}
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-1 shadow-2xl shadow-amber-500/30 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center text-3xl font-black text-amber-400">
                    {first.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-amber-400 rounded-full text-navy-950 shadow-md">
                  <Trophy className="w-4 h-4 fill-navy-950" />
                </div>
              </div>

              {/* Winner Names */}
              <h3 className="text-2xl font-black text-white tracking-tight truncate" title={first.name}>
                {first.name}
              </h3>
              <div className="flex items-center justify-center gap-1 text-amber-300/80 text-xs font-mono mt-0.5">
                <span>@{first.username}</span>
              </div>

              {first.institution && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 mt-2 truncate">
                  <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-medium truncate">{first.institution}</span>
                </div>
              )}

              {/* Score Highlight */}
              <div className="mt-5 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 shadow-inner">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Champion Score</span>
                  <span className="text-3xl font-black text-gradient-gold">
                    {first.score} <span className="text-xs text-amber-400/80 font-normal">/ {maxScore}</span>
                  </span>
                </div>
                <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden border border-amber-500/20">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.min(100, (first.score / maxScore) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-left">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">Problems Solved</span>
                  <p className="text-sm font-bold text-emerald-400">{first.solvedQuestions} / {totalProblems}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">Total Penalty</span>
                  <p className="text-sm font-bold text-amber-200">{first.timePenalty || 0} min</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* MYSTERY 1ST PLACE (GOLD) CARD */
          <div className="order-1 md:order-2 glass-card rounded-3xl p-7 border-2 border-dashed border-amber-500/50 relative text-center bg-gradient-to-b from-amber-950/30 to-navy-950 md:-translate-y-4">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 font-black text-xs uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>1st Place (Grand Champion)</span>
            </div>

            <div className="pt-6 pb-2">
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-4xl font-black text-amber-400 shadow-inner animate-pulse">
                👑 ?
              </div>
              <h3 className="text-xl font-black text-white">Grand Champion Sealed</h3>
              <p className="text-xs text-amber-300/80 mt-1">Final Surprise Award</p>

              <div className="mt-6">
                {revealState.revealedSilver ? (
                  <button
                    onClick={onRevealGold}
                    className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-navy-950 font-black text-xs uppercase tracking-wider shadow-2xl shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
                  >
                    👑 Click to Reveal 1st Place Champion!
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-navy-950 border border-amber-500/20 text-xs text-amber-300/60">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reveal 2nd Place first</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 3RD PLACE (BRONZE) ---------------- */}
        {third ? (
          revealState.revealedBronze ? (
            <div className="order-3 glass-card rounded-3xl p-6 border-amber-700/40 relative bronze-glow group hover:-translate-y-1 transition-all duration-300 animate-fade-in">
              {/* Top Rank Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <Medal className="w-3.5 h-3.5" />
                <span>3rd Place</span>
              </div>

              <div className="pt-4 text-center">
                {/* Avatar */}
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-800 via-orange-600 to-amber-500 p-1 shadow-lg shadow-orange-600/20 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center text-2xl font-black text-orange-200">
                    {third.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Names */}
                <h3 className="text-xl font-bold text-white tracking-tight truncate" title={third.name}>
                  {third.name}
                </h3>
                <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-mono mt-0.5">
                  <span>@{third.username}</span>
                </div>

                {third.institution && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-2 truncate">
                    <School className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{third.institution}</span>
                  </div>
                )}

                {/* Score Highlight */}
                <div className="mt-5 p-3 rounded-2xl bg-slate-900/80 border border-slate-700/50">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs uppercase font-medium text-slate-400">Score</span>
                    <span className="text-2xl font-black text-gradient-bronze">
                      {third.score} <span className="text-xs text-slate-400 font-normal">/ {maxScore}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (third.score / maxScore) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-left">
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase">Solved</span>
                    <p className="text-xs font-bold text-emerald-400">{third.solvedQuestions} / {totalProblems}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase">Time</span>
                    <p className="text-xs font-bold text-slate-300">{third.timePenalty || 0} min</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MYSTERY 3RD PLACE (BRONZE) CARD */
            <div className="order-3 glass-card rounded-3xl p-6 border-2 border-dashed border-orange-600/40 relative text-center bg-orange-950/30">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-orange-950 border border-orange-700/50 text-orange-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-orange-400" />
                <span>3rd Place (Bronze)</span>
              </div>

              <div className="pt-6 pb-2">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-orange-950/40 border border-orange-700/40 flex items-center justify-center text-3xl font-black text-orange-300 shadow-inner animate-pulse">
                  ?
                </div>
                <h3 className="text-lg font-bold text-orange-200">Mystery 3rd Place</h3>
                <p className="text-xs text-orange-400/80 mt-1">Identity & Score Sealed</p>

                <div className="mt-6">
                  {revealState.revealedRanksRemaining ? (
                    <button
                      onClick={onRevealBronze}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-700/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
                    >
                      🥉 Click to Reveal 3rd Place!
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Preview Ranks 4+ first</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : null}

      </div>
    </section>
  );
};
