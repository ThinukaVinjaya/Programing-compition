import React from 'react';
import { Competition, Participant } from '../../types';
import { AlertTriangle, CheckCircle, Trophy, Users, X, Send } from 'lucide-react';

interface ConfirmPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPublishing: boolean;
  competition: Competition;
  participants: Participant[];
}

export const ConfirmPublishModal: React.FC<ConfirmPublishModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPublishing,
  competition,
  participants,
}) => {
  if (!isOpen) return null;

  const topWinner = participants[0];
  const highestScore = Math.max(...participants.map(p => p.score), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={isPublishing}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] text-white">Confirm Leaderboard Publication</h3>
            <p className="text-xs text-slate-400">This action will immediately update public standings</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          You are about to publish official standings for <strong className="text-indigo-300">{competition.title}</strong> to Supabase. This will update the public student dashboard and broadcast live refresh signals to all active viewers.
        </p>

        {/* Snapshot Summary Box */}
        <div className="p-4 rounded-2xl bg-navy-900 border border-slate-700/80 space-y-3 mb-6 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-4 h-4 text-indigo-400" />
              Total Participants
            </span>
            <span className="font-bold text-white">{participants.length} contestants</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              1st Place Champion
            </span>
            <span className="font-bold text-amber-300">
              {topWinner ? `${topWinner.name} (@${topWinner.username})` : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Highest Score Recorded</span>
            <span className="font-bold text-emerald-400">{highestScore} pts</span>
          </div>

          <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-slate-800">
            <span className="text-slate-400">Tie-Breaking Mode</span>
            <span className="font-mono text-slate-300 uppercase text-[11px]">
              {competition.tieBreakingRule.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPublishing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
          >
            {isPublishing ? (
              <span>Publishing to Cloud...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish Live Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
