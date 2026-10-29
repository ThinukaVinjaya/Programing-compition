import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Competition, Participant, PublicationRecord, SurpriseRevealState } from '../types';
import { DEMO_COMPETITION, DEMO_PARTICIPANTS } from '../utils/demoData';

const CONFIG_STORAGE_KEY = 'ms_codequest_supabase_config';
const LOCAL_LEADERBOARD_KEY = 'ms_codequest_live_leaderboard';
const LOCAL_COMPETITION_KEY = 'ms_codequest_live_competition';
const LOCAL_HISTORY_KEY = 'ms_codequest_publication_history';
const ADMIN_SESSION_KEY = 'ms_codequest_admin_session';
const CEREMONY_STATE_KEY = 'ms_codequest_ceremony_state';

// Create a cross-tab BroadcastChannel for instant student refresh
const updateChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ms_codequest_updates') : null;

// Helper to retrieve saved config
export function getSavedSupabaseConfig(): { url: string; anonKey: string } {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  return {
    url: envUrl,
    anonKey: envKey
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  supabaseInstance = null; // Reset cached client
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSavedSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
}

// Singleton client
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSavedSupabaseConfig();
  if (url && anonKey && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
    }
  }
  return null;
}

// -------------------------------------------------------------
// Authentication (thinuka / thinuka@123)
// -------------------------------------------------------------

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export async function adminSignIn(usernameOrEmail: string, password: string): Promise<{ user: AdminUser | null; error: string | null }> {
  const cleanInput = (usernameOrEmail || '').trim().toLowerCase();

  // 1. Try local Express / MongoDB backend auth endpoint
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanInput, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(data.user));
        return { user: data.user, error: null };
      }
    }
  } catch (e) {
    // Backend fetch failed, continue to standard validation
  }

  // 2. Direct validation for requested admin credentials: thinuka / thinuka@123
  if (
    (cleanInput === 'thinuka' || cleanInput === 'thinuka@codequest.org') &&
    password === 'thinuka@123'
  ) {
    const thinukaUser: AdminUser = {
      id: 'admin-thinuka-id',
      username: 'thinuka',
      email: 'thinuka@codequest.org',
      name: 'Thinuka (Arbiter Director)',
      role: 'super_admin'
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(thinukaUser));
    return { user: thinukaUser, error: null };
  }

  // Fallback demo admin
  if (cleanInput === 'admin@codequest.org' && password === 'CodeQuest2026!') {
    const demoUser: AdminUser = {
      id: 'demo-admin-id',
      username: 'admin',
      email: 'admin@codequest.org',
      name: 'MS CodeQuest Super Admin',
      role: 'super_admin'
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(demoUser));
    return { user: demoUser, error: null };
  }

  // 3. Supabase Auth if configured
  const supabase = getSupabase();
  if (supabase && cleanInput.includes('@')) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanInput, password });
      if (!error && data.user) {
        const adminUser: AdminUser = {
          id: data.user.id,
          username: data.user.email?.split('@')[0] || 'admin',
          email: data.user.email || cleanInput,
          name: data.user.user_metadata?.full_name || cleanInput.split('@')[0],
          role: data.user.user_metadata?.role || 'admin'
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminUser));
        return { user: adminUser, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase auth error:', err);
    }
  }

  return { user: null, error: 'Invalid admin credentials. Use username "thinuka" and password "thinuka@123"' };
}

export async function adminSignOut(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
  }
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getCurrentAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }
  return null;
}

// -------------------------------------------------------------
// Leaderboard & Competition Fetching
// -------------------------------------------------------------

export async function fetchPublishedLeaderboard(): Promise<{
  competition: Competition | null;
  participants: Participant[];
  isDemoData: boolean;
  publishedAt: string | null;
}> {
  // 1. Try Backend API (connected to MongoDB)
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.competition && data.participants?.length > 0) {
        return {
          competition: data.competition,
          participants: data.participants,
          isDemoData: false,
          publishedAt: data.publishedAt
        };
      }
    }
  } catch (e) {
    // Fallthrough to Supabase or local storage
  }

  // 2. Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: compData, error: compError } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

      if (!compError && compData) {
        const { data: results, error: resError } = await supabase
          .from('leaderboard_results')
          .select('*')
          .eq('competition_id', compData.id)
          .order('rank', { ascending: true });

        if (!resError && results && results.length > 0) {
          const mappedParticipants: Participant[] = results.map((r: any) => ({
            id: r.id,
            rank: r.rank,
            name: r.name,
            username: r.username,
            score: Number(r.score),
            solvedQuestions: Number(r.solved_questions || 0),
            submissionCount: r.submission_count ? Number(r.submission_count) : undefined,
            timePenalty: r.time_penalty ? Number(r.time_penalty) : undefined,
            institution: r.institution || undefined,
            status: 'active'
          }));

          const comp: Competition = {
            id: compData.id,
            title: compData.title,
            edition: compData.edition,
            date: compData.date,
            totalProblems: compData.total_problems,
            maxScore: Number(compData.max_score),
            description: compData.description || '',
            status: 'published',
            publishedAt: compData.published_at,
            lastUpdatedBy: compData.last_updated_by,
            hackerRankContestName: compData.hackerrank_contest_name,
            tieBreakingRule: compData.tie_breaking_rule || 'solved_then_time',
            rankingMethod: compData.ranking_method || 'standard'
          };

          return {
            competition: comp,
            participants: mappedParticipants,
            isDemoData: false,
            publishedAt: compData.published_at
          };
        }
      }
    } catch (err) {
      console.warn('Could not query Supabase, checking local storage:', err);
    }
  }

  // 3. Check persistent local storage for published data
  try {
    const localCompRaw = localStorage.getItem(LOCAL_COMPETITION_KEY);
    const localPartsRaw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);

    if (localCompRaw && localPartsRaw) {
      const comp = JSON.parse(localCompRaw);
      const parts = JSON.parse(localPartsRaw);
      if (Array.isArray(parts) && parts.length > 0) {
        return {
          competition: comp,
          participants: parts,
          isDemoData: false,
          publishedAt: comp.publishedAt
        };
      }
    }
  } catch (e) {
    console.warn('Local storage parse error:', e);
  }

  // Fallback to sample demo data
  return {
    competition: DEMO_COMPETITION,
    participants: DEMO_PARTICIPANTS,
    isDemoData: true,
    publishedAt: DEMO_COMPETITION.publishedAt
  };
}

// -------------------------------------------------------------
// Publication Workflow
// -------------------------------------------------------------

export async function publishLeaderboard(
  competition: Competition,
  participants: Participant[],
  adminUser: AdminUser,
  fileName: string
): Promise<{ success: boolean; record: PublicationRecord; error?: string }> {
  const publishedAt = new Date().toISOString();
  const updatedComp: Competition = {
    ...competition,
    status: 'published',
    publishedAt,
    lastUpdatedBy: adminUser.username || adminUser.email
  };

  const topWinner = participants[0] || { name: 'N/A', username: 'N/A', score: 0 };
  const highestScore = Math.max(...participants.map(p => p.score), 0);

  const publicationRecord: PublicationRecord = {
    id: 'pub-' + Date.now(),
    competitionId: competition.id,
    competitionTitle: competition.title,
    publishedAt,
    publishedBy: adminUser.name || adminUser.username || 'Thinuka',
    participantCount: participants.length,
    highestScore,
    topWinnerName: topWinner.name,
    topWinnerUsername: topWinner.username,
    fileName
  };

  // 1. Post to Express / MongoDB backend
  try {
    await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competition: updatedComp,
        participants,
        adminUser,
        fileName
      })
    });
  } catch (e) {
    console.warn('Backend sync notice:', e);
  }

  // 2. Also save to Supabase if configured
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: compRecord } = await supabase
        .from('competitions')
        .upsert({
          id: competition.id.includes('-') && competition.id.length >= 32 ? competition.id : undefined,
          title: competition.title,
          edition: competition.edition,
          date: competition.date,
          total_problems: competition.totalProblems,
          max_score: competition.maxScore,
          description: competition.description,
          hackerrank_contest_name: competition.hackerRankContestName,
          status: 'published',
          tie_breaking_rule: competition.tieBreakingRule,
          ranking_method: competition.rankingMethod,
          published_at: publishedAt,
          last_updated_by: adminUser.username || adminUser.email
        })
        .select()
        .single();

      const compId = compRecord?.id || competition.id;

      await supabase.from('leaderboard_results').delete().eq('competition_id', compId);

      const rowsToInsert = participants.map(p => ({
        competition_id: compId,
        rank: p.rank,
        username: p.username,
        name: p.name,
        score: p.score,
        solved_questions: p.solvedQuestions,
        submission_count: p.submissionCount || 0,
        time_penalty: p.timePenalty || 0,
        institution: p.institution || null
      }));

      const CHUNK_SIZE = 100;
      for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
        const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
        await supabase.from('leaderboard_results').insert(chunk);
      }

      await supabase.from('publication_history').insert({
        competition_id: compId,
        competition_title: competition.title,
        published_at: publishedAt,
        published_by: adminUser.name || adminUser.username || 'Thinuka',
        participant_count: participants.length,
        highest_score: highestScore,
        top_winner_name: topWinner.name,
        top_winner_username: topWinner.username,
        file_name: fileName
      });
    } catch (err: any) {
      console.warn('Supabase publish warning:', err.message);
    }
  }

  // 3. Always save locally to ensure offline-first reliability
  try {
    localStorage.setItem(LOCAL_COMPETITION_KEY, JSON.stringify(updatedComp));
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(participants));

    const existingHistRaw = localStorage.getItem(LOCAL_HISTORY_KEY);
    const existingHist: PublicationRecord[] = existingHistRaw ? JSON.parse(existingHistRaw) : [];
    existingHist.unshift(publicationRecord);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(existingHist.slice(0, 50)));

    // Reset surprise ceremony state so the grand reveal happens for the new publication!
    resetSurpriseRevealState();
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }

  // 4. Broadcast to other tabs & window listeners for realtime student refresh!
  try {
    if (updateChannel) {
      updateChannel.postMessage({
        type: 'LEADERBOARD_PUBLISHED',
        publishedAt,
        competitionTitle: competition.title
      });
    }
    window.dispatchEvent(new CustomEvent('ms_codequest_published', {
      detail: { publishedAt, competitionTitle: competition.title }
    }));
  } catch (e) {
    // Ignore broadcast errors
  }

  return {
    success: true,
    record: publicationRecord
  };
}

// -------------------------------------------------------------
// Publication History
// -------------------------------------------------------------

export async function fetchPublicationHistory(): Promise<PublicationRecord[]> {
  try {
    const res = await fetch('/api/history');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.history?.length > 0) {
        return data.history;
      }
    }
  } catch (e) {
    // Ignore
  }

  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }

  return [
    {
      id: 'demo-history-1',
      competitionId: DEMO_COMPETITION.id,
      competitionTitle: DEMO_COMPETITION.title,
      publishedAt: DEMO_COMPETITION.publishedAt || new Date().toISOString(),
      publishedBy: 'Thinuka (Event Director)',
      participantCount: DEMO_PARTICIPANTS.length,
      highestScore: 100,
      topWinnerName: DEMO_PARTICIPANTS[0].name,
      topWinnerUsername: DEMO_PARTICIPANTS[0].username,
      fileName: 'ms_codequest_official_results.xlsx'
    }
  ];
}

// -------------------------------------------------------------
// Surprise Reveal Mode State Management
// -------------------------------------------------------------

export function getSurpriseRevealState(): SurpriseRevealState {
  try {
    const raw = localStorage.getItem(CEREMONY_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }
  return {
    isCeremonyActive: true,
    revealedRanksRemaining: false,
    revealedBronze: false,
    revealedSilver: false,
    revealedGold: false
  };
}

export function saveSurpriseRevealState(state: SurpriseRevealState): void {
  try {
    localStorage.setItem(CEREMONY_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore
  }
}

export function resetSurpriseRevealState(): void {
  const initial: SurpriseRevealState = {
    isCeremonyActive: true,
    revealedRanksRemaining: false,
    revealedBronze: false,
    revealedSilver: false,
    revealedGold: false
  };
  saveSurpriseRevealState(initial);
}

// -------------------------------------------------------------
// Realtime Subscription
// -------------------------------------------------------------

export function subscribeToLeaderboardUpdates(onUpdate: () => void): () => void {
  const handleCustomEvent = () => onUpdate();
  window.addEventListener('ms_codequest_published', handleCustomEvent);

  let channelListener: ((ev: MessageEvent) => void) | null = null;
  if (updateChannel) {
    channelListener = (ev: MessageEvent) => {
      if (ev.data?.type === 'LEADERBOARD_PUBLISHED') {
        onUpdate();
      }
    };
    updateChannel.addEventListener('message', channelListener);
  }

  const supabase = getSupabase();
  let supabaseChannel: any = null;
  if (supabase) {
    try {
      supabaseChannel = supabase
        .channel('public:leaderboard_updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leaderboard_results' },
          () => onUpdate()
        )
        .subscribe();
    } catch (err) {
      console.warn('Could not subscribe to Supabase Realtime channel:', err);
    }
  }

  return () => {
    window.removeEventListener('ms_codequest_published', handleCustomEvent);
    if (updateChannel && channelListener) {
      updateChannel.removeEventListener('message', channelListener);
    }
    if (supabase && supabaseChannel) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}
