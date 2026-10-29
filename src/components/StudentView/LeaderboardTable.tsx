import React, { useState, useMemo } from 'react';
import { Participant, SurpriseRevealState } from '../../types';
import { 
  Search, 
  ArrowUpDown, 
  Download, 
  Trophy, 
  Medal, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  Eye,
  Sparkles
} from 'lucide-react';

interface LeaderboardTableProps {
  participants: Participant[];
  maxScore: number;
  totalProblems: number;
  onOpenExport: () => void;
  revealState?: SurpriseRevealState;
  onRevealRanksRemaining?: () => void;
}

type SortKey = 'rank' | 'score' | 'solved' | 'name' | 'time';

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  participants,
  maxScore,
  totalProblems,
  onOpenExport,
  revealState,
  onRevealRanksRemaining,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'top10' | 'perfect' | 'high_solved'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const isRanksHidden = revealState ? !revealState.revealedRanksRemaining : false;

  // Filter and sort
  const filteredParticipants = useMemo(() => {
    let result = [...participants];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        (p.institution && p.institution.toLowerCase().includes(q)) ||
        String(p.rank) === q
      );
    }

    // Quick filter
    if (filterMode === 'top10') {
      result = result.filter(p => p.rank <= 10);
    } else if (filterMode === 'perfect') {
      result = result.filter(p => p.score >= maxScore);
    } else if (filterMode === 'high_solved') {
      result = result.filter(p => p.solvedQuestions >= Math.max(1, totalProblems - 1));
    }

    // Sort
    result.sort((a, b) => {
      let comp = 0;
      if (sortKey === 'rank') comp = a.rank - b.rank;
      else if (sortKey === 'score') comp = b.score - a.score;
      else if (sortKey === 'solved') comp = b.solvedQuestions - a.solvedQuestions;
      else if (sortKey === 'time') comp = (a.timePenalty || 0) - (b.timePenalty || 0);
      else if (sortKey === 'name') comp = a.name.localeCompare(b.name);

      return sortAsc ? comp : -comp;
    });

    return result;
  }, [participants, searchQuery, sortKey, sortAsc, filterMode, maxScore, totalProblems]);

  // Pagination
  const totalPages = Math.ceil(filteredParticipants.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredParticipants.slice(start, start + pageSize);
  }, [filteredParticipants, page, pageSize]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'rank' ? true : false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-navy-950 font-black shadow-md shadow-amber-500/20">
          <Trophy className="w-4 h-4 fill-navy-950" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 text-navy-950 font-black shadow-md shadow-slate-300/20">
          <Medal className="w-4 h-4 fill-navy-950" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-700 text-white font-black shadow-md shadow-orange-500/20">
          <Medal className="w-4 h-4 fill-white" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 font-mono font-bold text-xs">
        #{rank}
      </span>
    );
  };

  const getAvatarGradient = (name: string) => {
    const charCode = name.charCodeAt(0) || 65;
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-purple-600 to-pink-600',
      'from-cyan-600 to-blue-600',
      'from-emerald-600 to-teal-600',
      'from-violet-600 to-purple-700',
      'from-amber-600 to-orange-600',
    ];
    return gradients[charCode % gradients.length];
  };

  // Helper to check if row details should be masked due to ceremony mode
  const isParticipantMasked = (rank: number) => {
    if (!revealState) return false;
    if (rank === 1 && !revealState.revealedGold) return true;
    if (rank === 2 && !revealState.revealedSilver) return true;
    if (rank === 3 && !revealState.revealedBronze) return true;
    return false;
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
      
      {/* Table Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-white">
            Official Standings Table
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isRanksHidden 
              ? 'Standings sealed for award ceremony. Preview to unlock.'
              : `Showing ${filteredParticipants.length} of ${participants.length} contestants ranked`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              disabled={isRanksHidden}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search contestant, handle, uni..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-navy-900/90 border border-slate-700/80 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm text-white placeholder-slate-500 transition-all disabled:opacity-40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-900/90 border border-slate-800 text-xs">
            <button
              onClick={() => { setFilterMode('all'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setFilterMode('top10'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'top10' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => { setFilterMode('perfect'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'perfect' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Perfect 100
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-200 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SURPRISE REVEAL: IF STEP 1 NOT CLICKED YET, SHOW SEALED BANNER */}
      {/* ------------------------------------------------------------- */}
      {isRanksHidden ? (
        <div className="py-16 px-6 text-center rounded-2xl bg-gradient-to-b from-navy-900 to-navy-950 border-2 border-dashed border-indigo-500/40 space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <Lock className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white">
              Standings Sealed for Surprise Award Ceremony
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              All ranks from <strong>Rank 4 downwards</strong> are currently hidden to maintain suspense. Click the Preview button to unveil the top rankers!
            </p>
          </div>

          {onRevealRanksRemaining && (
            <button
              onClick={onRevealRanksRemaining}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Eye className="w-5 h-5 text-indigo-200" />
              <span>Preview Remaining Top Rankers (Rank 4+)</span>
            </button>
          )}

          <p className="text-[11px] text-slate-500">
            Note: Top 3 medalists (1st, 2nd, and 3rd) remain locked on the podium for the grand final reveal.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / Tablet Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800/80 animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-900/90 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th 
                    onClick={() => handleSort('rank')} 
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors w-20"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Rank</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('name')} 
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Participant</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>

                  <th className="py-3.5 px-4">
                    <span>HackerRank Handle</span>
                  </th>

                  <th 
                    onClick={() => handleSort('score')} 
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors w-44"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Score</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('solved')} 
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors w-32"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Solved</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>

                  <th 
                    onClick={() => handleSort('time')} 
                    className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors w-32"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Penalty/Time</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-sm">
                {paginatedList.length > 0 ? (
                  paginatedList.map((p) => {
                    const isTop3 = p.rank <= 3;
                    const isMasked = isParticipantMasked(p.rank);

                    return (
                      <tr 
                        key={p.id}
                        className={`transition-colors ${
                          isMasked 
                            ? 'bg-slate-950/40 text-slate-500' 
                            : isTop3 
                            ? p.rank === 1 ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]' 
                            : p.rank === 2 ? 'bg-slate-400/[0.03] hover:bg-slate-400/[0.06]' 
                            : 'bg-orange-500/[0.03] hover:bg-orange-500/[0.06]'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-4 font-mono">
                          {getRankBadge(p.rank)}
                        </td>

                        {/* Participant Details */}
                        <td className="py-4 px-4">
                          {isMasked ? (
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-400">
                                🔒
                              </div>
                              <div>
                                <p className="font-semibold text-slate-400 tracking-tight flex items-center gap-1.5">
                                  <span>[Mystery {p.rank === 1 ? 'Grand Champion' : p.rank === 2 ? '2nd Place' : '3rd Place'}]</span>
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Reveal via Podium above
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getAvatarGradient(p.name)} p-[2px] shrink-0 shadow-sm`}>
                                <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center font-bold text-xs text-white">
                                  {p.name.slice(0, 2).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <p className="font-semibold text-white tracking-tight">
                                  {p.name}
                                </p>
                                {p.institution && (
                                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Building2 className="w-3 h-3 text-slate-500" />
                                    <span>{p.institution}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* HackerRank Handle */}
                        <td className="py-4 px-4">
                          {isMasked ? (
                            <span className="font-mono text-xs text-slate-500">
                              @••••••••
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900 border border-slate-700/60 font-mono text-xs text-indigo-300">
                              @{p.username}
                            </span>
                          )}
                        </td>

                        {/* Score with Progress Bar */}
                        <td className="py-4 px-4">
                          {isMasked ? (
                            <span className="font-mono text-slate-500 font-bold text-sm">
                              🔒 Sealed Pts
                            </span>
                          ) : (
                            <div>
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-black text-white text-base">
                                  {p.score}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  / {maxScore}
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    p.score >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                    p.score >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                                    p.score >= 50 ? 'bg-gradient-to-r from-indigo-500 to-purple-400' :
                                    'bg-slate-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (p.score / maxScore) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Solved Questions */}
                        <td className="py-4 px-4">
                          {isMasked ? (
                            <span className="text-xs text-slate-500 font-mono">
                              🔒 Sealed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{p.solvedQuestions} / {totalProblems}</span>
                            </span>
                          )}
                        </td>

                        {/* Submissions & Time */}
                        <td className="py-4 px-4 text-xs text-slate-300 font-mono">
                          {isMasked ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <div className="flex flex-col">
                              <span>{p.timePenalty ? `${p.timePenalty} min` : '—'}</span>
                              <span className="text-[10px] text-slate-500">
                                {p.submissionCount ? `${p.submissionCount} attempts` : '1 attempt'}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto">
                        <p className="text-base font-semibold text-white mb-1">No contestants match filter</p>
                        <p className="text-xs text-slate-500 mb-4">Try clearing your search query or reset filters</p>
                        <button
                          onClick={() => { setSearchQuery(''); setFilterMode('all'); }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="block md:hidden space-y-3 animate-fade-in">
            {paginatedList.length > 0 ? (
              paginatedList.map((p) => {
                const isMasked = isParticipantMasked(p.rank);
                return (
                  <div 
                    key={p.id}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isMasked 
                        ? 'bg-slate-950/60 border-slate-800 text-slate-500' 
                        : 'bg-navy-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {getRankBadge(p.rank)}
                        <div>
                          <p className="font-bold text-white text-sm">
                            {isMasked ? `🔒 Mystery ${p.rank === 1 ? 'Champion' : p.rank === 2 ? '2nd' : '3rd'}` : p.name}
                          </p>
                          <p className="text-xs text-indigo-300 font-mono">
                            {isMasked ? '@••••••••' : `@${p.username}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-white">
                          {isMasked ? '🔒' : p.score}
                        </span>
                        <span className="text-[10px] text-slate-500"> / {maxScore}</span>
                      </div>
                    </div>

                    {!isMasked && p.institution && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{p.institution}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      {isMasked ? (
                        <span className="text-slate-500 italic">Unveil via Podium cards</span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{p.solvedQuestions}/{totalProblems} Solved</span>
                          </span>
                          <span className="text-slate-400 font-mono">
                            {p.timePenalty ? `${p.timePenalty} min` : '—'} • {p.submissionCount || 1} att.
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                No contestants found.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400">
              <div>
                Showing Page <span className="font-bold text-white">{page}</span> of{' '}
                <span className="font-bold text-white">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl bg-navy-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pageNum = page - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-xl font-medium transition-all ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-navy-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl bg-navy-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
