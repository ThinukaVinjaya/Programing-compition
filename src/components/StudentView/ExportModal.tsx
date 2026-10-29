import React from 'react';
import { Participant, Competition } from '../../types';
import { Download, Printer, X, FileSpreadsheet, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: Competition | null;
  participants: Participant[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  competition,
  participants,
}) => {
  if (!isOpen) return null;

  const downloadCSV = () => {
    const headers = ['Rank', 'Name', 'HackerRank_Username', 'Score', 'Solved_Questions', 'Time_Penalty_Min', 'Submissions', 'Institution'];
    const rows = participants.map(p => [
      p.rank,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.username}"`,
      p.score,
      p.solvedQuestions,
      p.timePenalty || 0,
      p.submissionCount || 1,
      `"${(p.institution || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeTitle = (competition?.title || 'codequest_leaderboard').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `${safeTitle}_standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] text-white">Export Results</h3>
            <p className="text-xs text-slate-400">Save official standings for reporting</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6">
          Choose your preferred format to export all <strong className="text-white">{participants.length}</strong> participants from <strong className="text-indigo-300">{competition?.title || 'MS CodeQuest'}</strong>.
        </p>

        <div className="space-y-3">
          <button
            onClick={downloadCSV}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-navy-900 hover:bg-navy-800 border border-slate-700 hover:border-indigo-500/50 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Export to CSV</p>
                <p className="text-xs text-slate-400">Comma-separated spreadsheet file (.csv)</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              Download &rarr;
            </span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-navy-900 hover:bg-navy-800 border border-slate-700 hover:border-indigo-500/50 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Print / PDF Format</p>
                <p className="text-xs text-slate-400">Optimized printer stylesheet or browser PDF save</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              Print &rarr;
            </span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
