import React, { useState, useEffect } from 'react';
import { 
  Competition, 
  Participant, 
  ColumnMapping, 
  ValidationIssue, 
  LeaderboardStats, 
  PublicationRecord 
} from '../../types';
import { 
  AdminUser, 
  publishLeaderboard, 
  fetchPublicationHistory,
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  getSupabase
} from '../../services/supabase';
import { 
  parseExcelFile, 
  autoDetectColumns, 
  validateMappedRows, 
  calculateLeaderboard,
  generateSampleExcelBlob,
  ParsedSheetData
} from '../../utils/excelParser';
import { ConfirmPublishModal } from './ConfirmPublishModal';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Settings, 
  History, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Eye, 
  ShieldCheck, 
  Send, 
  Trash2, 
  Database, 
  FileCheck, 
  Layers, 
  BarChart3, 
  UserCheck, 
  ExternalLink,
  Download
} from 'lucide-react';

interface AdminPanelProps {
  adminUser: AdminUser;
  onViewStudentLeaderboard: () => void;
  onLeaderboardPublished: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  adminUser,
  onViewStudentLeaderboard,
  onLeaderboardPublished,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'studio' | 'history' | 'settings' | 'fixtures'>('studio');

  // Excel File State (Step A)
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [sheetData, setSheetData] = useState<ParsedSheetData | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Column Mapping & Validation State (Step B)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    username: '',
    name: '',
    score: '',
    solvedQuestions: '',
    submissionCount: '',
    timePenalty: '',
    institution: ''
  });
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [excludedRowIndices, setExcludedRowIndices] = useState<Set<number>>(new Set());

  // Generation & Tie-breaking State (Step C)
  const [competitionMeta, setCompetitionMeta] = useState<Competition>({
    id: 'comp-' + Date.now(),
    title: 'MS CodeQuest 2026 Championship',
    edition: 'Official Competitive Standings',
    date: new Date().toISOString().split('T')[0],
    totalProblems: 5,
    maxScore: 100,
    description: 'Official results from the MS CodeQuest programming competition.',
    status: 'draft',
    publishedAt: null,
    tieBreakingRule: 'solved_then_time',
    rankingMethod: 'standard'
  });

  const [generatedParticipants, setGeneratedParticipants] = useState<Participant[]>([]);
  const [generatedStats, setGeneratedStats] = useState<LeaderboardStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Publish State (Step D)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);

  // History & Settings State
  const [historyList, setHistoryList] = useState<PublicationRecord[]>([]);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  useEffect(() => {
    // Load existing history and configuration
    fetchPublicationHistory().then(setHistoryList);
    const config = getSavedSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.anonKey);
  }, []);

  // -------------------------------------------------------------------
  // Step A: Excel Upload & SheetJS Parsing
  // -------------------------------------------------------------------
  const handleFileSelected = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setPublishSuccessMessage(null);

    try {
      const parsed = await parseExcelFile(selectedFile);
      setSheetData(parsed);
      setRawRows(parsed.rawRows);

      // Auto-detect columns
      const detected = autoDetectColumns(parsed.rawHeaders);
      setColumnMapping(detected);

      // Reset downstream steps
      setExcludedRowIndices(new Set());
      setGeneratedParticipants([]);
      setGeneratedStats(null);

      // Run initial validation
      const { issues } = validateMappedRows(parsed.rawRows, detected);
      setValidationIssues(issues);
    } catch (err: any) {
      alert(`Error parsing Excel: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // -------------------------------------------------------------------
  // Step B: Column Mapping & Validation
  // -------------------------------------------------------------------
  const handleMappingChange = (field: keyof ColumnMapping, val: string) => {
    const updated = { ...columnMapping, [field]: val };
    setColumnMapping(updated);
    if (rawRows.length > 0) {
      const { issues } = validateMappedRows(rawRows, updated);
      setValidationIssues(issues);
    }
  };

  const toggleExcludeRow = (rawRowIndex: number) => {
    setExcludedRowIndices(prev => {
      const next = new Set(prev);
      if (next.has(rawRowIndex)) {
        next.delete(rawRowIndex);
      } else {
        next.add(rawRowIndex);
      }
      return next;
    });
  };

  // -------------------------------------------------------------------
  // Step C: Generate Leaderboard
  // -------------------------------------------------------------------
  const handleGenerateLeaderboard = () => {
    if (!columnMapping.username || !columnMapping.score) {
      alert('Please map at least the Username and Score columns before generating.');
      return;
    }

    setIsGenerating(true);

    try {
      // Filter out excluded rows
      const activeRows = rawRows.filter(r => !excludedRowIndices.has(r.__rawRowIndex));

      const { participants, stats } = calculateLeaderboard(
        activeRows,
        columnMapping,
        competitionMeta.tieBreakingRule,
        competitionMeta.rankingMethod
      );

      setGeneratedParticipants(participants);
      setGeneratedStats(stats);
    } catch (err: any) {
      alert(`Calculation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // -------------------------------------------------------------------
  // Step D: Publish Leaderboard
  // -------------------------------------------------------------------
  const handleConfirmPublish = async () => {
    if (generatedParticipants.length === 0) return;

    setIsPublishing(true);
    setPublishSuccessMessage(null);

    try {
      const result = await publishLeaderboard(
        competitionMeta,
        generatedParticipants,
        adminUser,
        file?.name || 'manual_import.xlsx'
      );

      if (result.success) {
        setIsConfirmOpen(false);
        setPublishSuccessMessage(`Leaderboard successfully published at ${new Date().toLocaleTimeString()}!`);
        onLeaderboardPublished();
        // Refresh history
        const updatedHistory = await fetchPublicationHistory();
        setHistoryList(updatedHistory);
      } else {
        alert(`Publication failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Publication error: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // -------------------------------------------------------------------
  // Settings & Test Connection
  // -------------------------------------------------------------------
  const handleSaveConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setConnectionStatus('Saved! Re-testing connection...');
    setTimeout(async () => {
      const client = getSupabase();
      if (client) {
        try {
          const { error } = await client.from('competitions').select('count', { count: 'exact', head: true });
          if (!error) {
            setConnectionStatus('Connected successfully to Supabase cloud database!');
          } else {
            setConnectionStatus(`Connected to Supabase, but encountered table query notice: ${error.message}. Ensure schema is applied.`);
          }
        } catch (e: any) {
          setConnectionStatus(`Connection test error: ${e.message}`);
        }
      } else {
        setConnectionStatus('Invalid Supabase URL or Key format.');
      }
    }, 500);
  };

  // -------------------------------------------------------------------
  // Fixtures / Sample Excel loader
  // -------------------------------------------------------------------
  const loadSampleExcelDirectly = async () => {
    const blob = generateSampleExcelBlob();
    const sampleFile = new File([blob], 'codequest_official_standings_sample.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    await handleFileSelected(sampleFile);
    setActiveTab('studio');
  };

  const downloadSampleExcelFile = () => {
    const blob = generateSampleExcelBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ms_codequest_sample_import.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const blockingErrors = validationIssues.filter(i => i.severity === 'error');
  const warnings = validationIssues.filter(i => i.severity === 'warning');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Admin Header Bar */}
      <div className="glass-card rounded-3xl p-6 mb-8 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white">
                MS CodeQuest Admin Console
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Arbiter Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Authenticated as <span className="text-slate-200 font-mono">{adminUser.email}</span> ({adminUser.role})
            </p>
          </div>
        </div>

        <button
          onClick={onViewStudentLeaderboard}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-200 hover:text-white transition-all self-start md:self-auto"
        >
          <Eye className="w-4 h-4 text-indigo-400" />
          <span>View Public Leaderboard</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'studio'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-navy-900/60 text-slate-400 hover:text-white hover:bg-navy-900 border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Leaderboard Generator (A - D)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-navy-900/60 text-slate-400 hover:text-white hover:bg-navy-900 border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Publication History & Logs</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {historyList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fixtures')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'fixtures'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-navy-900/60 text-slate-400 hover:text-white hover:bg-navy-900 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Sample Excel & Test Fixtures</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-navy-900/60 text-slate-400 hover:text-white hover:bg-navy-900 border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase DB Settings</span>
        </button>
      </div>

      {/* TAB 1: STUDIO WORKFLOW (A to D) */}
      {activeTab === 'studio' && (
        <div className="space-y-10">

          {/* Success Banner */}
          {publishSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-emerald-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{publishSuccessMessage}</span>
              </div>
              <button
                onClick={onViewStudentLeaderboard}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
              >
                Inspect Public Leaderboard &rarr;
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP A: EXCEL UPLOAD */}
          {/* ------------------------------------------------------------- */}
          <section className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  A
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] text-white">
                    Upload Contest Spreadsheet
                  </h3>
                  <p className="text-xs text-slate-400">
                    Parse contest exports directly with SheetJS (.xlsx, .xls, .csv)
                  </p>
                </div>
              </div>

              {file && (
                <button
                  onClick={() => { setFile(null); setSheetData(null); setRawRows([]); }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear File</span>
                </button>
              )}
            </div>

            {/* Drag & Drop Area */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
                  isDragging 
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]' 
                    : 'border-slate-700/80 hover:border-indigo-500/50 bg-navy-900/40'
                }`}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                  Drag and drop your contest spreadsheet here
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Supports standard contest export formats: Microsoft Excel (.xlsx, .xls) and CSV (.csv).
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-lg shadow-indigo-600/30 transition-all">
                    Browse Files
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={loadSampleExcelDirectly}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm font-medium text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Load Sample Data Sheet</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Info Card */}
                <div className="p-4 rounded-2xl bg-navy-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB • Detected <strong className="text-white">{rawRows.length}</strong> contestant rows
                      </p>
                    </div>
                  </div>

                  {sheetData && sheetData.sheetNames.length > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Sheet:</span>
                      <select
                        value={sheetData.selectedSheet}
                        className="bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
                      >
                        {sheetData.sheetNames.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Raw Rows Preview (First 5) */}
                {sheetData && sheetData.rawHeaders.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Spreadsheet Raw Preview (First 5 Rows)
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-48 text-xs font-mono">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-navy-900/90 text-slate-300">
                          <tr>
                            <th className="py-2 px-3 border-b border-slate-800">#</th>
                            {sheetData.rawHeaders.map((h, i) => (
                              <th key={i} className="py-2 px-3 border-b border-slate-800 whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-400">
                          {rawRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20">
                              <td className="py-2 px-3 font-semibold text-slate-500">{idx + 1}</td>
                              {sheetData.rawHeaders.map((h, i) => (
                                <td key={i} className="py-2 px-3 whitespace-nowrap">
                                  {String(row[h] !== undefined ? row[h] : '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ------------------------------------------------------------- */}
          {/* STEP B: COLUMN MAPPING & LIVE DATA VALIDATION */}
          {/* ------------------------------------------------------------- */}
          {file && sheetData && (
            <section className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  B
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] text-white">
                    Column Mapping & Real-time Validation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verify auto-detected columns and inspect potential spreadsheet anomalies
                  </p>
                </div>
              </div>

              {/* Column Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                
                {/* Username */}
                <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center justify-between">
                    <span>HackerRank Username *</span>
                    <span className="text-[10px] text-amber-400 font-normal">Required</span>
                  </label>
                  <select
                    value={columnMapping.username}
                    onChange={(e) => handleMappingChange('username', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  >
                    <option value="">-- Select Column --</option>
                    {sheetData.rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Participant Name */}
                <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Participant Full Name
                  </label>
                  <select
                    value={columnMapping.name}
                    onChange={(e) => handleMappingChange('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  >
                    <option value="">-- Fallback to Username --</option>
                    {sheetData.rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Score */}
                <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center justify-between">
                    <span>Score / Points *</span>
                    <span className="text-[10px] text-amber-400 font-normal">Required</span>
                  </label>
                  <select
                    value={columnMapping.score}
                    onChange={(e) => handleMappingChange('score', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  >
                    <option value="">-- Select Column --</option>
                    {sheetData.rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Solved Questions */}
                <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Problems Solved
                  </label>
                  <select
                    value={columnMapping.solvedQuestions}
                    onChange={(e) => handleMappingChange('solvedQuestions', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  >
                    <option value="">-- Optional (Defaults to 0) --</option>
                    {sheetData.rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Time Penalty / Duration */}
                <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Time / Penalty (Min)
                  </label>
                  <select
                    value={columnMapping.timePenalty}
                    onChange={(e) => handleMappingChange('timePenalty', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  >
                    <option value="">-- Optional --</option>
                    {sheetData.rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Submissions / Institution */}
                <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Institution / University
                  </label>
                  <select
                    value={columnMapping.institution}
                    onChange={(e) => handleMappingChange('institution', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  >
                    <option value="">-- Optional --</option>
                    {sheetData.rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Validation Feedback Banner */}
              <div className="mb-4">
                {blockingErrors.length === 0 && warnings.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All spreadsheet rows validated successfully! No missing usernames or invalid scores detected.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockingErrors.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Detected <strong>{blockingErrors.length}</strong> row(s) with blocking errors (missing username or score).</span>
                        </div>
                        <span className="font-semibold text-red-400">Action Required</span>
                      </div>
                    )}
                    {warnings.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Detected <strong>{warnings.length}</strong> warning(s) (such as duplicate handles or missing full names).</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Issues List with Exclude Toggle */}
              {validationIssues.length > 0 && (
                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-2 text-xs">
                  <p className="font-bold text-white mb-2">Flagged Rows Inspection:</p>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {validationIssues.map((issue, idx) => {
                      const isExcluded = excludedRowIndices.has(issue.rowIndex);
                      return (
                        <div 
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                            isExcluded
                              ? 'bg-slate-900/50 border-slate-800 opacity-60'
                              : issue.severity === 'error'
                              ? 'bg-red-950/30 border-red-800/40 text-red-200'
                              : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white">Row {issue.rowIndex}: </span>
                            <span>{issue.message}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleExcludeRow(issue.rowIndex)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                              isExcluded
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30'
                            }`}
                          >
                            {isExcluded ? 'Include Row' : 'Exclude Row'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP C: GENERATE LEADERBOARD PREVIEW */}
          {/* ------------------------------------------------------------- */}
          {file && sheetData && (
            <section className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  C
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] text-white">
                    Leaderboard Rules & Rank Generation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure tie-breaking logic and compute official ranks from imported data
                  </p>
                </div>
              </div>

              {/* Competition Configuration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Competition Title
                  </label>
                  <input
                    type="text"
                    value={competitionMeta.title}
                    onChange={(e) => setCompetitionMeta({ ...competitionMeta, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Edition / Season
                  </label>
                  <input
                    type="text"
                    value={competitionMeta.edition}
                    onChange={(e) => setCompetitionMeta({ ...competitionMeta, edition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Tie-Breaking Rule
                  </label>
                  <select
                    value={competitionMeta.tieBreakingRule}
                    onChange={(e: any) => setCompetitionMeta({ ...competitionMeta, tieBreakingRule: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  >
                    <option value="solved_then_time">Solved DESC &rarr; Time Penalty ASC</option>
                    <option value="solved_then_submissions">Solved DESC &rarr; Submissions ASC</option>
                    <option value="score_only">Score Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Ranking Method
                  </label>
                  <select
                    value={competitionMeta.rankingMethod}
                    onChange={(e: any) => setCompetitionMeta({ ...competitionMeta, rankingMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs sm:text-sm text-white"
                  >
                    <option value="standard">Standard Olympic (1, 2, 2, 4)</option>
                    <option value="dense">Dense Ranking (1, 2, 2, 3)</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleGenerateLeaderboard}
                  disabled={isGenerating || !columnMapping.username || !columnMapping.score}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Generate Leaderboard</span>
                </button>

                {generatedParticipants.length > 0 && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{generatedParticipants.length} contestants ranked</span>
                  </span>
                )}
              </div>

              {/* Statistics & Preview of Generated Leaderboard */}
              {generatedStats && generatedParticipants.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-slate-800">
                  {/* Stats Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Ranked</span>
                      <p className="text-xl font-black text-white">{generatedStats.totalParticipants}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-navy-900 border border-amber-500/20">
                      <span className="text-[10px] text-amber-400 uppercase font-semibold">Highest Score</span>
                      <p className="text-xl font-black text-amber-400">{generatedStats.highestScore}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Average Score</span>
                      <p className="text-xl font-black text-white">{generatedStats.averageScore}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Median Score</span>
                      <p className="text-xl font-black text-white">{generatedStats.medianScore}</p>
                    </div>
                  </div>

                  {/* Generated Table Preview (Top 10) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Generated Standings Preview (Top 10 of {generatedParticipants.length})
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Olympic Standard Ties Applied
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800 text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-navy-900 text-slate-400 uppercase font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Rank</th>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Username</th>
                            <th className="py-2.5 px-3">Score</th>
                            <th className="py-2.5 px-3">Solved</th>
                            <th className="py-2.5 px-3">Penalty / Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-medium">
                          {generatedParticipants.slice(0, 10).map((p) => (
                            <tr key={p.id} className="hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-mono font-bold">
                                {p.rank === 1 ? '🥇 #1' : p.rank === 2 ? '🥈 #2' : p.rank === 3 ? '🥉 #3' : `#${p.rank}`}
                              </td>
                              <td className="py-2.5 px-3 text-white font-semibold">{p.name}</td>
                              <td className="py-2.5 px-3 font-mono text-indigo-300">@{p.username}</td>
                              <td className="py-2.5 px-3 font-black text-white">{p.score}</td>
                              <td className="py-2.5 px-3 text-emerald-400">{p.solvedQuestions}</td>
                              <td className="py-2.5 px-3 text-slate-400">{p.timePenalty || 0} min</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP D: PUBLISH LEADERBOARD */}
          {/* ------------------------------------------------------------- */}
          {generatedParticipants.length > 0 && (
            <section className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-navy-950 to-navy-950">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    D
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] text-white">
                      Publish Official Results
                    </h3>
                    <p className="text-xs text-slate-400">
                      Persistently save results to Supabase and trigger instant public student view refresh
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-emerald-600/30 cursor-pointer self-start sm:self-auto"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Leaderboard Live</span>
                </button>
              </div>
            </section>
          )}

        </div>
      )}

      {/* TAB 2: PUBLICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] text-white">Publication History & Audit Log</h3>
            <p className="text-xs text-slate-400">Record of all past imports, winners, and timestamps</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-900 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Published At</th>
                  <th className="py-3 px-4">Contest Title</th>
                  <th className="py-3 px-4">Participants</th>
                  <th className="py-3 px-4">Top Winner</th>
                  <th className="py-3 px-4">Highest Score</th>
                  <th className="py-3 px-4">Published By</th>
                  <th className="py-3 px-4">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {historyList.map(h => (
                  <tr key={h.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(h.publishedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{h.competitionTitle}</td>
                    <td className="py-3 px-4 font-mono">{h.participantCount} contestants</td>
                    <td className="py-3 px-4 font-semibold text-amber-300">
                      {h.topWinnerName} (@{h.topWinnerUsername})
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{h.highestScore}</td>
                    <td className="py-3 px-4 text-slate-400">{h.publishedBy}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{h.fileName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPABASE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 max-w-2xl space-y-6">
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] text-white">Supabase Cloud Database Settings</h3>
            <p className="text-xs text-slate-400">
              Configure or update Supabase credentials. Changes take effect immediately in the app.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Supabase URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-xs sm:text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Supabase Anon Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2.5 rounded-xl bg-navy-900 border border-slate-700 text-xs sm:text-sm text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-colors shadow-lg shadow-indigo-600/20"
              >
                Save & Test Connection
              </button>
            </div>

            {connectionStatus && (
              <div className="p-3.5 rounded-2xl bg-navy-900 border border-slate-700 text-xs text-indigo-300">
                {connectionStatus}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-navy-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-white">Database Setup Tip:</p>
            <p>
              To initialize your Supabase database tables and Row Level Security (RLS) policies, open your Supabase SQL Editor and run the provided <code className="text-indigo-300">supabase_schema.sql</code> script located in the project root.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: SAMPLE DATA & TEST FIXTURES */}
      {activeTab === 'fixtures' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 max-w-2xl space-y-6">
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] text-white">Sample Contest Excel Fixtures</h3>
            <p className="text-xs text-slate-400">
              Generate realistic test spreadsheets with zero setup to verify your upload, column mapping, and rank generation pipeline.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-navy-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">One-Click Auto-Load Sample Spreadsheet</p>
                  <p className="text-xs text-slate-400">
                    Instantly loads 10 authentic contestant rows directly into Step A of the generator.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadSampleExcelDirectly}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Auto-Load Sheet into Generator Now
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-navy-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Download Sample .xlsx File</p>
                  <p className="text-xs text-slate-400">
                    Save the generated spreadsheet to your computer to test the drag-and-drop feature.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadSampleExcelFile}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Download ms_codequest_sample_import.xlsx
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmPublishModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmPublish}
        isPublishing={isPublishing}
        competition={competitionMeta}
        participants={generatedParticipants}
      />

    </div>
  );
};
