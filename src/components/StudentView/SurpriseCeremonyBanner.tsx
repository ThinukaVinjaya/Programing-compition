import React from 'react';
import { SurpriseRevealState } from '../../types';
import { 
  Sparkles, 
  Eye, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  RotateCcw, 
  Crown, 
  Medal, 
  Trophy,
  PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SurpriseCeremonyBannerProps {
  revealState: SurpriseRevealState;
  onRevealRanksRemaining: () => void;
  onRevealBronze: () => void;
  onRevealSilver: () => void;
  onRevealGold: () => void;
  onRevealAll: () => void;
  onResetCeremony: () => void;
  isCeremonyComplete: boolean;
}

export const SurpriseCeremonyBanner: React.FC<SurpriseCeremonyBannerProps> = ({
  revealState,
  onRevealRanksRemaining,
  onRevealBronze,
  onRevealSilver,
  onRevealGold,
  onRevealAll,
  onResetCeremony,
  isCeremonyComplete,
}) => {
  return (
    <div className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-navy-900 via-indigo-950/80 to-navy-900 border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Banner Title & Stage */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-navy-950 flex items-center gap-1.5 shadow-md">
              <PartyPopper className="w-3.5 h-3.5" />
              Award Ceremony Mode
            </span>
            <span className="text-xs text-indigo-300 font-mono">
              Official Surprise Reveal
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white">
            {isCeremonyComplete ? (
              <span className="text-gradient-gold">All Champions Revealed!</span>
            ) : (
              <span>Standings Sealed: Live Award Reveal</span>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {isCeremonyComplete ? (
              'The award ceremony is complete. All participants and medalists are officially revealed on the podium and standings.'
            ) : (
              'Follow the ceremonial sequence: First preview the top rankers (Rank 4+), then reveal 3rd Place Bronze, 2nd Place Silver, and finally the Grand 1st Place Champion!'
            )}
          </p>
        </div>

        {/* Ceremony Sequence Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {!revealState.revealedRanksRemaining ? (
            <button
              onClick={onRevealRanksRemaining}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm shadow-xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
            >
              <Eye className="w-5 h-5 text-indigo-200" />
              <span>Step 1: Preview Ranks 4+ (Remaining Top Rankers)</span>
            </button>
          ) : !revealState.revealedBronze ? (
            <button
              onClick={onRevealBronze}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 hover:brightness-110 text-white font-black text-sm shadow-xl shadow-orange-700/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
            >
              <Medal className="w-5 h-5" />
              <span>Step 2: Reveal 3rd Place (Bronze)</span>
            </button>
          ) : !revealState.revealedSilver ? (
            <button
              onClick={onRevealSilver}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 text-navy-950 font-black text-sm shadow-xl shadow-slate-300/30 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
            >
              <Medal className="w-5 h-5" />
              <span>Step 3: Reveal 2nd Place (Silver)</span>
            </button>
          ) : !revealState.revealedGold ? (
            <button
              onClick={onRevealGold}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-navy-950 font-black text-sm shadow-2xl shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
            >
              <Crown className="w-5 h-5 fill-navy-950" />
              <span>Step 4: Reveal Grand Champion (1st Place Gold)!</span>
            </button>
          ) : (
            <button
              onClick={onResetCeremony}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              <span>Replay Surprise Ceremony</span>
            </button>
          )}

          {!isCeremonyComplete && (
            <button
              onClick={onRevealAll}
              className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
            >
              Reveal All Instantly
            </button>
          )}
        </div>
      </div>

      {/* 4-Step Progress Indicator Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-950/80">
        
        {/* Step 1 */}
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
          revealState.revealedRanksRemaining 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-navy-950 border-indigo-500/30 text-indigo-200 shadow-md shadow-indigo-600/20'
        }`}>
          {revealState.revealedRanksRemaining ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
          )}
          <div className="truncate">
            <p className="text-[10px] uppercase font-bold text-slate-400">Step 1</p>
            <p className="text-xs font-semibold truncate">Ranks 4+ Remaining</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
          revealState.revealedBronze 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : revealState.revealedRanksRemaining
            ? 'bg-navy-950 border-orange-500/40 text-orange-200 shadow-md shadow-orange-600/20'
            : 'bg-navy-950/40 border-slate-800 text-slate-500 opacity-60'
        }`}>
          {revealState.revealedBronze ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
          )}
          <div className="truncate">
            <p className="text-[10px] uppercase font-bold text-slate-400">Step 2</p>
            <p className="text-xs font-semibold truncate">3rd Place (Bronze)</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
          revealState.revealedSilver 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : revealState.revealedBronze
            ? 'bg-navy-950 border-slate-400/40 text-slate-200 shadow-md shadow-slate-400/20'
            : 'bg-navy-950/40 border-slate-800 text-slate-500 opacity-60'
        }`}>
          {revealState.revealedSilver ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-slate-400 text-navy-950 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
          )}
          <div className="truncate">
            <p className="text-[10px] uppercase font-bold text-slate-400">Step 3</p>
            <p className="text-xs font-semibold truncate">2nd Place (Silver)</p>
          </div>
        </div>

        {/* Step 4 */}
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
          revealState.revealedGold 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : revealState.revealedSilver
            ? 'bg-navy-950 border-amber-500/50 text-amber-200 shadow-md shadow-amber-500/30'
            : 'bg-navy-950/40 border-slate-800 text-slate-500 opacity-60'
        }`}>
          {revealState.revealedGold ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-amber-400 text-navy-950 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
          )}
          <div className="truncate">
            <p className="text-[10px] uppercase font-bold text-slate-400">Step 4</p>
            <p className="text-xs font-semibold truncate">1st Place (Champion)</p>
          </div>
        </div>

      </div>
    </div>
  );
};
