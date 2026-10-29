import * as XLSX from 'xlsx';
import { ColumnMapping, LeaderboardStats, Participant, ValidationIssue } from '../types';

export interface ParsedSheetData {
  sheetNames: string[];
  selectedSheet: string;
  rawHeaders: string[];
  rawRows: Record<string, any>[];
  totalRows: number;
}

/**
 * Parses an Excel or CSV file using SheetJS
 */
export async function parseExcelFile(file: File): Promise<ParsedSheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Spreadsheet has no sheets.');
        }

        const sheetNames = workbook.SheetNames;
        const firstSheetName = sheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse JSON with raw header row
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Spreadsheet appears to be completely empty.');
        }

        // Extract header names
        const headerRow: any[] = rawJson[0] || [];
        const rawHeaders: string[] = headerRow.map((h, idx) => 
          h !== undefined && h !== null && String(h).trim() !== '' ? String(h).trim() : `Column_${idx + 1}`
        );

        // Convert subsequent rows into object array
        const rawRows: Record<string, any>[] = [];
        for (let r = 1; r < rawJson.length; r++) {
          const rowData = rawJson[r];
          // Skip completely empty lines
          if (!rowData || !Array.isArray(rowData) || rowData.every(val => val === null || val === undefined || val === '')) {
            continue;
          }

          const rowObj: Record<string, any> = { __rawRowIndex: r };
          rawHeaders.forEach((colName, cIdx) => {
            rowObj[colName] = rowData[cIdx] !== undefined ? rowData[cIdx] : '';
          });
          rawRows.push(rowObj);
        }

        resolve({
          sheetNames,
          selectedSheet: firstSheetName,
          rawHeaders,
          rawRows,
          totalRows: rawRows.length
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to parse Excel file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed reading file from disk'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Automatically detects column mappings using fuzzy regex matching
 */
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    username: '',
    name: '',
    score: '',
    solvedQuestions: '',
    submissionCount: '',
    timePenalty: '',
    institution: ''
  };

  const patterns = {
    username: [/^(hackerrank|hr|hacker_rank|hr_username|username|handle|candidate_id|user_id|participant_id|id)$/i, /username/i, /hackerrank/i, /handle/i],
    name: [/^(full_?name|student_?name|participant_?name|candidate_?name|name|contestant)$/i, /name/i],
    score: [/^(score|points|total_?score|total_?marks|marks|final_?score|point)$/i, /score/i, /marks/i, /points/i],
    solvedQuestions: [/^(solved|solved_?questions?|problems?_?solved|questions?_?solved|ac_?count|problems?)$/i, /solved/i, /problem/i, /question/i],
    submissionCount: [/^(submissions?|submission_?count|total_?submissions?|attempts?)$/i, /submission/i, /attempt/i],
    timePenalty: [/^(time_?penalty|penalty|time_?taken|time|duration|mins?)$/i, /time/i, /penalty/i],
    institution: [/^(institution|college|university|school|affiliation|organization|org)$/i, /college/i, /uni/i]
  };

  for (const [key, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      const match = headers.find(h => regex.test(h.trim()));
      if (match) {
        mapping[key as keyof ColumnMapping] = match;
        break;
      }
    }
  }

  return mapping;
}

/**
 * Validates rows for required fields, scores, and duplicate usernames
 */
export function validateMappedRows(
  rows: Record<string, any>[],
  mapping: ColumnMapping
): { issues: ValidationIssue[]; duplicateUsernames: Set<string> } {
  const issues: ValidationIssue[] = [];
  const usernameOccurrences = new Map<string, number[]>();
  const duplicateUsernames = new Set<string>();

  rows.forEach((row, idx) => {
    const rawIndex = row.__rawRowIndex || idx + 1;

    // 1. Username Validation
    const usernameVal = mapping.username ? String(row[mapping.username] || '').trim() : '';
    if (!usernameVal) {
      issues.push({
        rowIndex: rawIndex,
        field: 'username',
        message: 'Missing participant username/handle',
        severity: 'error',
        value: row[mapping.username]
      });
    } else {
      const normalized = usernameVal.toLowerCase();
      if (!usernameOccurrences.has(normalized)) {
        usernameOccurrences.set(normalized, [rawIndex]);
      } else {
        usernameOccurrences.get(normalized)?.push(rawIndex);
        duplicateUsernames.add(normalized);
      }
    }

    // 2. Score Validation
    if (mapping.score) {
      const rawScore = row[mapping.score];
      const parsedScore = Number(rawScore);
      if (rawScore === undefined || rawScore === null || rawScore === '' || isNaN(parsedScore)) {
        issues.push({
          rowIndex: rawIndex,
          field: 'score',
          message: 'Score must be a valid number',
          severity: 'error',
          value: rawScore
        });
      } else if (parsedScore < 0) {
        issues.push({
          rowIndex: rawIndex,
          field: 'score',
          message: 'Score cannot be negative',
          severity: 'error',
          value: rawScore
        });
      }
    } else {
      issues.push({
        rowIndex: rawIndex,
        field: 'score',
        message: 'No score column mapped',
        severity: 'error',
        value: null
      });
    }

    // 3. Name check (warning only)
    if (mapping.name) {
      const nameVal = String(row[mapping.name] || '').trim();
      if (!nameVal) {
        issues.push({
          rowIndex: rawIndex,
          field: 'name',
          message: 'Name is empty; will fallback to username',
          severity: 'warning',
          value: null
        });
      }
    }
  });

  // Add duplicate issues
  duplicateUsernames.forEach(username => {
    const rowList = usernameOccurrences.get(username) || [];
    rowList.forEach(rIdx => {
      issues.push({
        rowIndex: rIdx,
        field: 'username',
        message: `Duplicate username "${username}" found in rows ${rowList.join(', ')}`,
        severity: 'warning',
        value: username
      });
    });
  });

  return { issues, duplicateUsernames };
}

/**
 * Calculates rank and leaderboard metrics strictly from imported data
 */
export function calculateLeaderboard(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  tieBreakingRule: 'solved_then_time' | 'solved_then_submissions' | 'score_only',
  rankingMethod: 'standard' | 'dense'
): { participants: Participant[]; stats: LeaderboardStats } {
  // 1. Map raw rows into participant objects
  const participants: Participant[] = rows.map((row, idx) => {
    const username = mapping.username ? String(row[mapping.username] || '').trim() : `user_${idx + 1}`;
    const name = mapping.name ? String(row[mapping.name] || '').trim() || username : username;
    const score = mapping.score ? Number(row[mapping.score]) || 0 : 0;
    const solvedQuestions = mapping.solvedQuestions ? Number(row[mapping.solvedQuestions]) || 0 : 0;
    const submissionCount = mapping.submissionCount ? Number(row[mapping.submissionCount]) || 0 : 0;
    const timePenalty = mapping.timePenalty ? Number(row[mapping.timePenalty]) || 0 : 0;
    const institution = mapping.institution ? String(row[mapping.institution] || '').trim() : undefined;

    return {
      id: `p-${idx + 1}-${username.replace(/[^a-zA-Z0-9]/g, '_')}`,
      rank: 1,
      name,
      username,
      score,
      solvedQuestions,
      submissionCount,
      timePenalty,
      institution,
      status: 'active',
      rawRowIndex: row.__rawRowIndex || idx + 1
    };
  });

  // 2. Sort according to tie-breaking rules
  participants.sort((a, b) => {
    // Primary: Score DESC
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Tie-break rule 1
    if (tieBreakingRule === 'solved_then_time') {
      // Solved questions DESC
      if (b.solvedQuestions !== a.solvedQuestions) {
        return b.solvedQuestions - a.solvedQuestions;
      }
      // Time penalty ASC (lower is better)
      if ((a.timePenalty || 0) !== (b.timePenalty || 0)) {
        return (a.timePenalty || 0) - (b.timePenalty || 0);
      }
      // Submissions ASC
      if ((a.submissionCount || 0) !== (b.submissionCount || 0)) {
        return (a.submissionCount || 0) - (b.submissionCount || 0);
      }
    } else if (tieBreakingRule === 'solved_then_submissions') {
      if (b.solvedQuestions !== a.solvedQuestions) {
        return b.solvedQuestions - a.solvedQuestions;
      }
      if ((a.submissionCount || 0) !== (b.submissionCount || 0)) {
        return (a.submissionCount || 0) - (b.submissionCount || 0);
      }
    }

    // Final tie-break: Alphabetical username ASC
    return a.username.localeCompare(b.username);
  });

  // 3. Assign Ranks
  let currentRank = 1;
  let denseRank = 1;

  for (let i = 0; i < participants.length; i++) {
    if (i > 0) {
      const prev = participants[i - 1];
      const curr = participants[i];

      const isExactTie = 
        curr.score === prev.score &&
        curr.solvedQuestions === prev.solvedQuestions &&
        (curr.timePenalty || 0) === (prev.timePenalty || 0) &&
        (curr.submissionCount || 0) === (prev.submissionCount || 0);

      if (!isExactTie) {
        currentRank = i + 1; // Standard Olympic (1, 2, 2, 4)
        denseRank += 1;     // Dense (1, 2, 2, 3)
      }
    }

    participants[i].rank = rankingMethod === 'dense' ? denseRank : currentRank;
  }

  // 4. Compute Statistics
  const totalParticipants = participants.length;
  const scores = participants.map(p => p.score);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const totalScoreSum = scores.reduce((acc, s) => acc + s, 0);
  const averageScore = totalParticipants > 0 ? Number((totalScoreSum / totalParticipants).toFixed(2)) : 0;

  // Median score calculation
  let medianScore = 0;
  if (totalParticipants > 0) {
    const sortedScores = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(totalParticipants / 2);
    medianScore = totalParticipants % 2 !== 0 
      ? sortedScores[mid] 
      : Number(((sortedScores[mid - 1] + sortedScores[mid]) / 2).toFixed(2));
  }

  const perfectScores = participants.filter(p => p.score >= 100).length;
  const totalSubmissions = participants.reduce((acc, p) => acc + (p.submissionCount || 0), 0);
  const totalSolved = participants.reduce((acc, p) => acc + p.solvedQuestions, 0);
  const averageSolved = totalParticipants > 0 ? Number((totalSolved / totalParticipants).toFixed(1)) : 0;

  return {
    participants,
    stats: {
      totalParticipants,
      highestScore,
      averageScore,
      medianScore,
      perfectScores,
      totalSubmissions,
      averageSolved
    }
  };
}

/**
 * Creates a downloadable sample Excel workbook for MS CodeQuest
 */
export function generateSampleExcelBlob(): Blob {
  const sampleData = [
    {
      'HackerRank_Username': 'alex_coder_x',
      'Participant_Name': 'Alex Morgan',
      'Final_Score': 100,
      'Problems_Solved': 5,
      'Submissions': 6,
      'Time_Taken_Min': 44,
      'Institution': 'MIT'
    },
    {
      'HackerRank_Username': 'priya_algo',
      'Participant_Name': 'Priya Nair',
      'Final_Score': 100,
      'Problems_Solved': 5,
      'Submissions': 7,
      'Time_Taken_Min': 52,
      'Institution': 'IIT Bombay'
    },
    {
      'HackerRank_Username': 'dev_ninja99',
      'Participant_Name': 'Devon Brooks',
      'Final_Score': 95,
      'Problems_Solved': 5,
      'Submissions': 9,
      'Time_Taken_Min': 68,
      'Institution': 'Stanford'
    },
    {
      'HackerRank_Username': 'sarah_byte',
      'Participant_Name': 'Sarah Jenkins',
      'Final_Score': 90,
      'Problems_Solved': 4,
      'Submissions': 5,
      'Time_Taken_Min': 55,
      'Institution': 'Cambridge'
    },
    {
      'HackerRank_Username': 'rahul_codes',
      'Participant_Name': 'Rahul Verma',
      'Final_Score': 85,
      'Problems_Solved': 4,
      'Submissions': 8,
      'Time_Taken_Min': 72,
      'Institution': 'BITS Pilani'
    },
    {
      'HackerRank_Username': 'elena_v',
      'Participant_Name': 'Elena Volkova',
      'Final_Score': 80,
      'Problems_Solved': 4,
      'Submissions': 10,
      'Time_Taken_Min': 90,
      'Institution': 'ETH Zurich'
    },
    {
      'HackerRank_Username': 'liam_k',
      'Participant_Name': 'Liam Tanaka',
      'Final_Score': 75,
      'Problems_Solved': 4,
      'Submissions': 11,
      'Time_Taken_Min': 105,
      'Institution': 'University of Tokyo'
    },
    {
      'HackerRank_Username': 'maya_lin',
      'Participant_Name': 'Maya Lin',
      'Final_Score': 65,
      'Problems_Solved': 3,
      'Submissions': 6,
      'Time_Taken_Min': 60,
      'Institution': 'UC Berkeley'
    },
    {
      'HackerRank_Username': 'carlos_g',
      'Participant_Name': 'Carlos Gomez',
      'Final_Score': 55,
      'Problems_Solved': 3,
      'Submissions': 7,
      'Time_Taken_Min': 78,
      'Institution': 'Univ of Toronto'
    },
    {
      'HackerRank_Username': 'kenji_s',
      'Participant_Name': 'Kenji Sato',
      'Final_Score': 45,
      'Problems_Solved': 2,
      'Submissions': 4,
      'Time_Taken_Min': 40,
      'Institution': 'Kyoto University'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaderboard_Raw');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
