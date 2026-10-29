import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/StudentView/HeroBanner';
import { SurpriseCeremonyBanner } from './components/StudentView/SurpriseCeremonyBanner';
import { Podium } from './components/StudentView/Podium';
import { StatsCards } from './components/StudentView/StatsCards';
import { LeaderboardTable } from './components/StudentView/LeaderboardTable';
import { ExportModal } from './components/StudentView/ExportModal';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { AdminPanel } from './components/Admin/AdminPanel';
import { 
  Competition, 
  Participant, 
  LeaderboardStats, 
  SurpriseRevealState 
} from './types';
import { 
  fetchPublishedLeaderboard, 
  subscribeToLeaderboardUpdates, 
  getCurrentAdminSession, 
  adminSignOut,
  getSurpriseRevealState,
  saveSurpriseRevealState,
  resetSurpriseRevealState,
  AdminUser 
} from './services/supabase';
import { Shield, Radio } from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  // Navigation View
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');

  // Competition & Results Data
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isDemoData, setIsDemoData] = useState(false);
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Surprise Ceremony State
  const [revealState, setRevealState] = useState<SurpriseRevealState>(getSurpriseRevealState);

  // Modals & Auth
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Compute stats on the fly from current participants
  const stats: LeaderboardStats = useMemo(() => {
    const totalParticipants = participants.length;
    const scores = participants.map(p => p.score);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const totalScore = scores.reduce((acc, s) => acc + s, 0);
    const averageScore = totalParticipants > 0 ? Number((totalScore / totalParticipants).toFixed(2)) : 0;

    let medianScore = 0;
    if (totalParticipants > 0) {
      const sorted = [...scores].sort((a, b) => a - b);
      const mid = Math.floor(totalParticipants / 2);
      medianScore = totalParticipants % 2 !== 0 
        ? sorted[mid] 
        : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
    }

    const perfectScores = participants.filter(p => p.score >= (competition?.maxScore || 100)).length;
    const totalSubmissions = participants.reduce((acc, p) => acc + (p.submissionCount || 0), 0);
    const totalSolved = participants.reduce((acc, p) => acc + p.solvedQuestions, 0);
    const averageSolved = totalParticipants > 0 ? Number((totalSolved / totalParticipants).toFixed(1)) : 0;

    return {
      totalParticipants,
      highestScore,
      averageScore,
      medianScore,
      perfectScores,
      totalSubmissions,
      averageSolved
    };
  }, [participants, competition]);

  // Load published leaderboard
  const loadLeaderboardData = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const data = await fetchPublishedLeaderboard();
      setCompetition(data.competition);
      setParticipants(data.participants);
      setIsDemoData(data.isDemoData);
      setLastPublished(data.publishedAt);

      if (showToast) {
        showTemporaryToast('Leaderboard standings synced with latest results!');
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const showTemporaryToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Initialize data and listeners on mount
  useEffect(() => {
    const activeAdmin = getCurrentAdminSession();
    if (activeAdmin) {
      setAdminUser(activeAdmin);
    }

    loadLeaderboardData();

    // Check ceremony state
    setRevealState(getSurpriseRevealState());

    const unsubscribe = subscribeToLeaderboardUpdates(() => {
      loadLeaderboardData(true);
      // Reset ceremony on new publication for a dramatic surprise
      resetSurpriseRevealState();
      setRevealState(getSurpriseRevealState());
    });

    return () => {
      unsubscribe();
    };
  }, [loadLeaderboardData]);

  // -------------------------------------------------------------
  // Sequential Surprise Reveal Handlers
  // -------------------------------------------------------------
  const handleRevealRanksRemaining = () => {
    const updated: SurpriseRevealState = {
      ...revealState,
      revealedRanksRemaining: true
    };
    setRevealState(updated);
    saveSurpriseRevealState(updated);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#6366f1', '#38bdf8', '#a855f7']
    });

    showTemporaryToast('Ranks 4+ revealed! Next: Click to reveal 3rd Place Bronze.');
  };

  const handleRevealBronze = () => {
    if (!revealState.revealedRanksRemaining) return;
    const updated: SurpriseRevealState = {
      ...revealState,
      revealedBronze: true
    };
    setRevealState(updated);
    saveSurpriseRevealState(updated);

    confetti({
      particleCount: 65,
      spread: 70,
      origin: { x: 0.8, y: 0.6 },
      colors: ['#ea580c', '#f97316', '#fdba74', '#ffffff']
    });

    showTemporaryToast('🥉 3rd Place Bronze revealed! Next: Click to reveal 2nd Place Silver.');
  };

  const handleRevealSilver = () => {
    if (!revealState.revealedBronze) return;
    const updated: SurpriseRevealState = {
      ...revealState,
      revealedSilver: true
    };
    setRevealState(updated);
    saveSurpriseRevealState(updated);

    confetti({
      particleCount: 75,
      spread: 70,
      origin: { x: 0.2, y: 0.6 },
      colors: ['#cbd5e1', '#94a3b8', '#e2e8f0', '#ffffff']
    });

    showTemporaryToast('🥈 2nd Place Silver revealed! Next: Click to reveal the Grand Champion Gold!');
  };

  const handleRevealGold = () => {
    if (!revealState.revealedSilver) return;
    const updated: SurpriseRevealState = {
      ...revealState,
      revealedGold: true
    };
    setRevealState(updated);
    saveSurpriseRevealState(updated);

    // Grand celebration explosion
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff', '#6366f1']
    });

    showTemporaryToast('👑 Grand 1st Place Champion Officially Crowned!');
  };

  const handleRevealAll = () => {
    const updated: SurpriseRevealState = {
      isCeremonyActive: true,
      revealedRanksRemaining: true,
      revealedBronze: true,
      revealedSilver: true,
      revealedGold: true
    };
    setRevealState(updated);
    saveSurpriseRevealState(updated);

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#38bdf8', '#818cf8', '#ec4899', '#ffffff']
    });
  };

  const handleResetCeremony = () => {
    resetSurpriseRevealState();
    setRevealState(getSurpriseRevealState());
    showTemporaryToast('Award ceremony reset for demonstration.');
  };

  const isCeremonyComplete = 
    revealState.revealedRanksRemaining &&
    revealState.revealedBronze &&
    revealState.revealedSilver &&
    revealState.revealedGold;

  const handleAdminSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setCurrentView('admin');
    showTemporaryToast(`Welcome, ${user.name || user.username}! Admin access granted.`);
  };

  const handleLogout = async () => {
    await adminSignOut();
    setAdminUser(null);
    setCurrentView('student');
    showTemporaryToast('Logged out of Admin Portal.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        adminUser={adminUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onRefresh={() => loadLeaderboardData(true)}
        isRefreshing={isRefreshing}
        lastPublished={lastPublished}
        isDemoData={isDemoData}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="px-5 py-3 rounded-2xl bg-indigo-600/95 text-white font-medium text-xs sm:text-sm border border-indigo-400/40 shadow-2xl shadow-indigo-900/60 flex items-center gap-2.5 backdrop-blur-md">
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'student' ? (
          <div>
            {/* Contest Header Banner */}
            <HeroBanner
              competition={competition}
              isDemoData={isDemoData}
              onOpenAdmin={() => {
                if (adminUser) {
                  setCurrentView('admin');
                } else {
                  setIsLoginModalOpen(true);
                }
              }}
            />

            {/* Surprise Award Ceremony Control Banner */}
            <SurpriseCeremonyBanner
              revealState={revealState}
              onRevealRanksRemaining={handleRevealRanksRemaining}
              onRevealBronze={handleRevealBronze}
              onRevealSilver={handleRevealSilver}
              onRevealGold={handleRevealGold}
              onRevealAll={handleRevealAll}
              onResetCeremony={handleResetCeremony}
              isCeremonyComplete={isCeremonyComplete}
            />

            {/* Top Three Winners Podium */}
            <Podium
              participants={participants}
              maxScore={competition?.maxScore || 100}
              totalProblems={competition?.totalProblems || 5}
              revealState={revealState}
              onRevealBronze={handleRevealBronze}
              onRevealSilver={handleRevealSilver}
              onRevealGold={handleRevealGold}
            />

            {/* Key Aggregate Metrics Cards */}
            <StatsCards
              stats={stats}
              maxScore={competition?.maxScore || 100}
            />

            {/* Full Ranked Leaderboard Table with Search & Sort */}
            <LeaderboardTable
              participants={participants}
              maxScore={competition?.maxScore || 100}
              totalProblems={competition?.totalProblems || 5}
              onOpenExport={() => setIsExportModalOpen(true)}
              revealState={revealState}
              onRevealRanksRemaining={handleRevealRanksRemaining}
            />
          </div>
        ) : (
          <div>
            {adminUser ? (
              <AdminPanel
                adminUser={adminUser}
                onViewStudentLeaderboard={() => setCurrentView('student')}
                onLeaderboardPublished={() => {
                  loadLeaderboardData();
                  // Reset ceremony state for the newly published contest
                  resetSurpriseRevealState();
                  setRevealState(getSurpriseRevealState());
                  showTemporaryToast('Leaderboard successfully published! Standings are sealed for the Surprise Award Ceremony.');
                }}
              />
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-white/10 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-['Outfit'] text-white">Administrator Access Required</h3>
                <p className="text-xs text-slate-400">
                  Please log in with administrator credentials (thinuka / thinuka@123) to manage Excel spreadsheets, compute rankings, and publish contest results.
                </p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Open Admin Login Modal
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-navy-950/80 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-['Outfit']">MS CodeQuest</span>
            <span>•</span>
            <span>Official Collegiate Algorithm Championship</span>
          </div>

          <p className="text-center md:text-right text-slate-400 text-[11px] max-w-lg">
            Scored via verified Excel contest exports with MongoDB persistent storage and real-time surprise award ceremony.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        competition={competition}
        participants={participants}
      />

    </div>
  );
};
