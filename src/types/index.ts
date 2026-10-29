export interface Participant {
  id: string;
  rank: number;
  name: string;
  username: string; // HackerRank username
  score: number;
  solvedQuestions: number;
  totalQuestions?: number;
  submissionCount?: number;
  timePenalty?: number; // In minutes or seconds
  status?: 'active' | 'disqualified' | 'pending';
  avatar?: string;
  institution?: string;
  isExcluded?: boolean;
  validationErrors?: string[];
  rawRowIndex?: number;
}

export interface Competition {
  id: string;
  title: string;
  edition: string;
  date: string;
  totalProblems: number;
  maxScore: number;
  description: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  lastUpdatedBy?: string;
  hackerRankContestName?: string;
  tieBreakingRule: 'solved_then_time' | 'solved_then_submissions' | 'score_only';
  rankingMethod: 'standard' | 'dense';
}

export interface ColumnMapping {
  username: string;
  name: string;
  score: string;
  solvedQuestions: string;
  submissionCount?: string;
  timePenalty?: string;
  institution?: string;
}

export interface ValidationIssue {
  rowIndex: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  value: any;
}

export interface LeaderboardStats {
  totalParticipants: number;
  highestScore: number;
  averageScore: number;
  medianScore: number;
  perfectScores: number;
  totalSubmissions: number;
  averageSolved: number;
}

export interface PublicationRecord {
  id: string;
  competitionId: string;
  competitionTitle: string;
  publishedAt: string;
  publishedBy: string;
  participantCount: number;
  highestScore: number;
  topWinnerName: string;
  topWinnerUsername: string;
  fileName: string;
}

export interface ExcelUploadState {
  file: File | null;
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet: string;
  rawHeaders: string[];
  rawRows: Record<string, any>[];
  totalRows: number;
}

export interface SurpriseRevealState {
  isCeremonyActive: boolean;
  revealedRanksRemaining: boolean; // Ranks 4+ revealed
  revealedBronze: boolean;         // Rank 3 revealed
  revealedSilver: boolean;         // Rank 2 revealed
  revealedGold: boolean;           // Rank 1 revealed
}
