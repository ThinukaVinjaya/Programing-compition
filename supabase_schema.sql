-- ====================================================================
-- MS CodeQuest Leaderboard & Admin Panel - Supabase Database Schema
-- ====================================================================

-- 1. Create Competitions Table
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'MS CodeQuest 2026',
    edition TEXT NOT NULL DEFAULT 'Spring Championship',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_problems INTEGER NOT NULL DEFAULT 5,
    max_score NUMERIC(8, 2) NOT NULL DEFAULT 100.00,
    description TEXT,
    hackerrank_contest_name TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    tie_breaking_rule TEXT NOT NULL DEFAULT 'solved_then_time',
    ranking_method TEXT NOT NULL DEFAULT 'standard' CHECK (ranking_method IN ('standard', 'dense')),
    published_at TIMESTAMPTZ,
    last_updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Participants Master Table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE, -- HackerRank handle
    name TEXT NOT NULL,
    institution TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Leaderboard Results Table (Contest Snapshot)
CREATE TABLE IF NOT EXISTS public.leaderboard_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    rank INTEGER NOT NULL,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    score NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    solved_questions INTEGER NOT NULL DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    time_penalty NUMERIC(10, 2) DEFAULT 0, -- in minutes or seconds
    institution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Publication History Table
CREATE TABLE IF NOT EXISTS public.publication_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    competition_title TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_by TEXT NOT NULL,
    participant_count INTEGER NOT NULL,
    highest_score NUMERIC(8, 2) NOT NULL,
    top_winner_name TEXT NOT NULL,
    top_winner_username TEXT NOT NULL,
    file_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Administrator Roles Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- Indexes for High Performance Search and Sorting
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_leaderboard_competition_rank ON public.leaderboard_results(competition_id, rank ASC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_username ON public.leaderboard_results(username);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status);
CREATE INDEX IF NOT EXISTS idx_publication_history_pubdate ON public.publication_history(published_at DESC);

-- ====================================================================
-- Row Level Security (RLS) Configuration
-- ====================================================================

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE id = auth.uid()
        )
        OR
        (auth.jwt() ->> 'email') IN (
            SELECT email FROM public.admin_users
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Competitions
-- Public / Students can view published competitions
CREATE POLICY "Public can read published competitions"
    ON public.competitions
    FOR SELECT
    TO public
    USING (status = 'published');

-- Admins have full access to competitions
CREATE POLICY "Admins have full access to competitions"
    ON public.competitions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policies for Participants
CREATE POLICY "Public can read participants"
    ON public.participants
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can manage participants"
    ON public.participants
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policies for Leaderboard Results
CREATE POLICY "Public can read leaderboard results"
    ON public.leaderboard_results
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can manage leaderboard results"
    ON public.leaderboard_results
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policies for Publication History
CREATE POLICY "Public can read publication history"
    ON public.publication_history
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can insert publication history"
    ON public.publication_history
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policies for Admin Users
CREATE POLICY "Admins can read admin user list"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ====================================================================
-- Supabase Realtime Setup
-- Enable realtime broadcasting on public leaderboard updates
-- ====================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.publication_history;
