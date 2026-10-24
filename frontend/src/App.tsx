import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Briefcase,
  Search,
  Check,
  Copy,
  ChevronRight,
  X,
  FileText,
  Mail,
  Calendar,
  Building2,
  RefreshCw,
  Send,
  Shield,
  Layers,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  SlidersHorizontal,
  Download,
  Info
} from 'lucide-react';
import { EmailItem, DatasetMetrics, IngestedJobRecord } from './types';
import { API_ENDPOINTS } from './config';

export const App: React.FC = () => {
  const [records, setRecords] = useState<EmailItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EmailItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'scams' | 'genuine' | 'followups' | 'applied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState<string>('');
  const [showGroundTruth, setShowGroundTruth] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [metrics, setMetrics] = useState<DatasetMetrics>({
    totalRecords: 0,
    activePipelines: 0,
    stalledApplications: 0,
    scamsNeutralized: 0,
    validationAccuracy: null,
    hasGroundTruthLabels: false,
  });

  // On mount, load default sample inbox and run initial audit
  useEffect(() => {
    handleLoadDefaultInbox();
  }, []);

  // Sync draft template when selecting record
  useEffect(() => {
    if (selectedRecord?.followUpTemplate) {
      setCustomDraft(selectedRecord.followUpTemplate);
    }
  }, [selectedRecord]);

  // Load standard seed inbox
  const handleLoadDefaultInbox = async () => {
    setIsAuditing(true);
    try {
      const resSample = await fetch(API_ENDPOINTS.sampleInbox);
      const sampleData = await resSample.json();
      const rawList = sampleData.emails || [];

      const resAudit = await fetch(API_ENDPOINTS.auditDataset, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: rawList }),
      });
      const auditData = await resAudit.json();
      if (auditData.success && auditData.results) {
        setRecords(auditData.results);
        setMetrics(auditData.metrics);
      }
    } catch (err) {
      console.error('Error loading default inbox:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // 1-Click Load Kaggle Sample CSV Dataset
  const handleLoadKaggleSample = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.sampleKaggleCsv);
      const data = await res.json();

      if (data.success && data.records) {
        // Direct parsed records without roundtripping 48MB text
        await auditRecords(data.records);
      } else {
        alert(data.error || 'Failed to load local fake_job_postings.csv');
      }
    } catch (err) {
      console.error('Failed to load Kaggle sample CSV:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom CSV file upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid .csv file.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch(API_ENDPOINTS.uploadCsv, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.records) {
        await auditRecords(uploadData.records);
      } else {
        alert(uploadData.error || 'Failed to parse CSV file.');
      }
    } catch (err) {
      console.error('CSV upload error:', err);
      alert('Error reading CSV file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run security audit on current records
  const auditRecords = async (itemsToAudit = records) => {
    if (itemsToAudit.length === 0) return;
    setIsAuditing(true);
    try {
      const res = await fetch(API_ENDPOINTS.auditDataset, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: itemsToAudit }),
      });
      const data = await res.json();
      if (data.success && data.results) {
        setRecords(data.results);
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Audit execution error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyDraft = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Filter records
  const filteredRecords = records.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (item.company || '').toLowerCase().includes(q) ||
      (item.role || '').toLowerCase().includes(q) ||
      (item.subject || '').toLowerCase().includes(q) ||
      (item.from || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'scams') return item.isScam;
    if (activeTab === 'genuine') return item.status === 'interview' || item.status === 'offer';
    if (activeTab === 'followups') return item.needsFollowUp;
    if (activeTab === 'applied') return item.status === 'applied';
    return true;
  });

  return (
    <div className="min-h-screen bg-page text-textSecondary flex flex-col font-sans selection:bg-[#E5E0D8] selection:text-textPrimary antialiased">
      {/* 1. Header & Brand Masthead */}
      <header className="border-b border-borderDefault bg-card/95 sticky top-0 z-30 px-6 py-4 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-page border border-borderDefault flex items-center justify-center text-textPrimary shadow-sm">
              <Shield className="w-5 h-5 text-espresso" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-textPrimary tracking-tight">
                  CareerShield
                </h1>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded border border-borderDefault bg-page text-textMuted font-medium">
                  Dataset & Inbox Auditor
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-badge-successBg text-badge-successText border border-badge-successBorder font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-badge-successText"></span>
                  System Ready
                </span>
              </div>
              <p className="text-xs text-textMuted mt-0.5">
                Job Application Tracker, Kaggle Dataset Benchmark & Risk Auditor • Reference: Oct 24, 2026
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleLoadDefaultInbox}
              disabled={isLoading || isAuditing}
              className="px-3 py-2 rounded-lg border border-borderDefault bg-card hover:bg-page text-textPrimary text-xs font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              title="Load original 15-email candidate inbox"
            >
              <Mail className="w-3.5 h-3.5 text-textMuted" />
              <span>Candidate Inbox</span>
            </button>

            <button
              onClick={handleLoadKaggleSample}
              disabled={isLoading || isAuditing}
              className="px-3.5 py-2 rounded-lg border border-borderDefault bg-card hover:bg-page text-textPrimary text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              title="Load benchmark labeled Kaggle job postings dataset"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Load Kaggle Sample CSV</span>
            </button>

            <button
              onClick={() => auditRecords()}
              disabled={isAuditing}
              className="px-4 py-2 rounded-lg bg-espresso hover:bg-espresso-hover text-white text-xs font-semibold tracking-wide transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing with Gemini...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Run Security Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Upload Dropzone & Configuration Control Bar */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 transition-colors bg-card shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 ${
            isDragOver ? 'border-[#D97706] bg-[#FEF3C7]/20' : 'border-borderDefault'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-page border border-borderDefault flex items-center justify-center text-textMuted">
              <Upload className="w-5 h-5 text-textSecondary" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider font-mono">
                CSV Job Posting Ingestion Dropzone
              </h3>
              <p className="text-xs text-textMuted">
                Drag & drop any CSV dataset (e.g. Kaggle Real/Fake Job Postings) or browse from disk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isAuditing}
              className="px-3 py-1.5 rounded-lg border border-borderDefault bg-page hover:bg-[#EDE8E1] text-textPrimary text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom CSV</span>
            </button>

            {/* Toggle switch for Ground Truth comparison */}
            <label className="flex items-center gap-2 cursor-pointer bg-page px-3 py-1.5 rounded-lg border border-borderDefault text-xs font-medium select-none shadow-xs">
              <input
                type="checkbox"
                checked={showGroundTruth}
                onChange={(e) => setShowGroundTruth(e.target.checked)}
                className="rounded border-borderDefault text-[#D97706] focus:ring-0 cursor-pointer"
              />
              <span className="text-textPrimary">Show Ground Truth Comparison</span>
            </label>
          </div>
        </div>

        {/* 2. Dataset Audit Summary Ribbon (5-Metric Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Metric 1 */}
          <div className="bg-card border border-borderDefault rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-textMuted font-medium">
                Records Ingested
              </span>
              <Briefcase className="w-4 h-4 text-textMuted" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-textPrimary">
                {metrics.totalRecords}
              </span>
              <span className="text-xs text-textMuted font-mono">records</span>
            </div>
            <p className="mt-1 text-[11px] text-textMuted truncate">
              {metrics.hasGroundTruthLabels ? 'Kaggle benchmark dataset' : 'Inbox communications'}
            </p>
          </div>

          {/* Metric 2 */}
          <div className="bg-card border border-borderDefault rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-textMuted font-medium">
                Active Pipelines
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-badge-successText">
                {metrics.activePipelines}
              </span>
              <span className="text-xs text-badge-successText font-mono">interviews & offers</span>
            </div>
            <p className="mt-1 text-[11px] text-textMuted">
              Verified corporate roles
            </p>
          </div>

          {/* Metric 3 */}
          <div className="bg-card border border-badge-scamBorder rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-badge-scamText font-semibold">
                Scams Flagged
              </span>
              <ShieldAlert className="w-4 h-4 text-badge-scamText" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-badge-scamText">
                {metrics.scamsNeutralized}
              </span>
              <span className="text-xs text-badge-scamText font-mono">threats blocked</span>
            </div>
            <p className="mt-1 text-[11px] text-badge-scamText/90">
              Extortion & deceptive postings
            </p>
          </div>

          {/* Metric 4 */}
          <div className="bg-card border border-borderDefault rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-badge-followupText font-medium">
                Stalled Applications
              </span>
              <Clock className="w-4 h-4 text-badge-followupText" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-badge-followupText">
                {metrics.stalledApplications}
              </span>
              <span className="text-xs text-badge-followupText font-mono">&ge; 7 days quiet</span>
            </div>
            <p className="mt-1 text-[11px] text-textMuted">
              Follow-up drafts generated
            </p>
          </div>

          {/* Metric 5: Model Validation Score vs Ground Truth */}
          <div className="bg-card border border-borderDefault rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0369A1] font-semibold">
                Model Validation
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#0369A1]" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1.5">
              {metrics.validationAccuracy !== null ? (
                <>
                  <span className="text-2xl font-bold text-[#0369A1]">
                    {metrics.validationAccuracy}%
                  </span>
                  <span className="text-xs text-[#0369A1] font-mono">accuracy</span>
                </>
              ) : (
                <span className="text-sm font-mono text-textMuted py-1">
                  Awaiting Labeled CSV
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-textMuted">
              {metrics.hasGroundTruthLabels ? 'Precision vs Kaggle ground truth' : 'Load labeled CSV to validate'}
            </p>
          </div>
        </div>

        {/* 3. Main Data Table with Segmented Filter Controls */}
        <div className="bg-card border border-borderDefault rounded-xl overflow-hidden shadow-sm">
          {/* Segmented Controls & Search Toolbar */}
          <div className="p-4 border-b border-borderDefault flex flex-col md:flex-row items-center justify-between gap-3 bg-page/60">
            {/* Pill Filter Tabs */}
            <div className="flex items-center flex-wrap gap-1.5 bg-card p-1 rounded-lg border border-borderDefault w-full md:w-auto text-xs font-medium shadow-sm">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-page text-textPrimary font-semibold shadow-xs'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                All Records ({records.length})
              </button>
              <button
                onClick={() => setActiveTab('scams')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'scams'
                    ? 'bg-badge-scamBg text-badge-scamText font-semibold'
                    : 'text-textSecondary hover:text-badge-scamText'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-badge-scamText" />
                Scams Flagged ({metrics.scamsNeutralized})
              </button>
              <button
                onClick={() => setActiveTab('genuine')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'genuine'
                    ? 'bg-badge-successBg text-badge-successText font-semibold'
                    : 'text-textSecondary hover:text-badge-successText'
                }`}
              >
                Genuine Roles ({metrics.activePipelines})
              </button>
              <button
                onClick={() => setActiveTab('followups')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'followups'
                    ? 'bg-badge-followupBg text-badge-followupText font-semibold'
                    : 'text-textSecondary hover:text-badge-followupText'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-badge-followupText" />
                Follow-ups Due ({metrics.stalledApplications})
              </button>
              <button
                onClick={() => setActiveTab('applied')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'applied'
                    ? 'bg-page text-textPrimary font-semibold shadow-xs'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                Applied
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search entity, role, or sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-borderDefault rounded-lg pl-8 pr-3 py-1.5 text-xs text-textPrimary placeholder-textMuted focus:outline-none focus:border-espresso shadow-xs transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-borderDefault bg-page/40 text-[11px] font-mono uppercase tracking-wider text-textMuted">
                  <th className="py-3 px-4 font-semibold">Company & Title</th>
                  <th className="py-3 px-4 font-semibold">Source / Sender</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status Badge</th>
                  {showGroundTruth && (
                    <th className="py-3 px-4 font-semibold">Ground Truth</th>
                  )}
                  <th className="py-3 px-4 font-semibold">Fraud Risk & Audit Findings</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderDefault">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={showGroundTruth ? 7 : 6} className="py-12 text-center text-textMuted font-mono">
                      No records match the current filter parameters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
                    const isScam = !!item.isScam;
                    const isOffer = item.status === 'offer';
                    const isInterview = item.status === 'interview';
                    const isRejected = item.status === 'rejected';

                    const hasGroundTruth = item.groundTruthFraudulent !== undefined;
                    const matchesGroundTruth = item.modelMatchGroundTruth === true;

                    return (
                      <tr
                        key={String(item.id)}
                        onClick={() => setSelectedRecord(item)}
                        className={`cursor-pointer transition-colors ${
                          isScam
                            ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2] border-l-4 border-l-[#EF4444]'
                            : item.needsFollowUp
                            ? 'hover:bg-[#FBF9F6] border-l-4 border-l-[#F59E0B]'
                            : 'hover:bg-[#FBF9F6] border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* Company & Title */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-textPrimary text-[13px] flex items-center gap-1.5">
                            {item.company || item.companyName || 'Enterprise Entity'}
                            {item.telecommuting && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-page border border-borderDefault text-textMuted font-medium">
                                Remote
                              </span>
                            )}
                          </div>
                          <div className="text-textSecondary text-xs truncate max-w-xs mt-0.5">
                            {item.role || item.title || item.subject}
                          </div>
                        </td>

                        {/* Source / Sender */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span
                            className={
                              isScam
                                ? 'text-badge-scamText font-medium'
                                : 'text-textSecondary'
                            }
                          >
                            {item.from}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-textMuted text-[11px] whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isScam && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-badge-scamBg text-badge-scamText border border-badge-scamBorder">
                              <AlertTriangle className="w-3 h-3 text-badge-scamText" />
                              Predatory Scam
                            </span>
                          )}
                          {isOffer && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase bg-badge-successBg text-badge-successText border border-badge-successBorder">
                              <ShieldCheck className="w-3 h-3" />
                              Verified Offer
                            </span>
                          )}
                          {isInterview && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                              Interview Active
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
                              Closed
                            </span>
                          )}
                          {item.status === 'applied' && !item.needsFollowUp && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase bg-badge-appliedBg text-badge-appliedText border border-badge-appliedBorder">
                              Applied / In Review
                            </span>
                          )}
                          {item.needsFollowUp && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase bg-badge-followupBg text-badge-followupText border border-badge-followupBorder">
                              <Clock className="w-3 h-3 text-badge-followupText" />
                              Follow-up Due ({item.daysElapsed}d)
                            </span>
                          )}
                        </td>

                        {/* Ground Truth Validation Column (Conditional) */}
                        {showGroundTruth && (
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {hasGroundTruth ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                    item.groundTruthFraudulent
                                      ? 'bg-badge-scamBg text-badge-scamText border-badge-scamBorder'
                                      : 'bg-badge-successBg text-badge-successText border-badge-successBorder'
                                  }`}
                                >
                                  {item.groundTruthFraudulent ? 'Fraud (1)' : 'Real (0)'}
                                </span>
                                {matchesGroundTruth ? (
                                  <span title="Model prediction matches ground truth">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  </span>
                                ) : (
                                  <span title="Model prediction disagreed with label">
                                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-textMuted font-mono text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {/* Fraud Risk & Audit Findings */}
                        <td className="py-3.5 px-4 max-w-sm">
                          {isScam ? (
                            <div className="text-badge-scamText text-xs">
                              <p className="font-semibold">{item.scamReason}</p>
                              {item.auditNotes && item.auditNotes.length > 0 && (
                                <ul className="list-disc list-inside text-[11px] text-badge-scamText/90 mt-1 space-y-0.5">
                                  {item.auditNotes.map((n, i) => (
                                    <li key={i}>{n}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : item.needsFollowUp ? (
                            <div className="flex items-center gap-2">
                              <span className="text-textSecondary text-xs">
                                Inactive for {item.daysElapsed} days. 2-sentence formal follow-up prepared.
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecord(item);
                                }}
                                className="px-2 py-0.5 rounded border border-badge-followupBorder bg-badge-followupBg text-badge-followupText hover:bg-[#FDE68A] font-semibold text-[11px] whitespace-nowrap transition-colors"
                              >
                                View Draft
                              </button>
                            </div>
                          ) : (
                            <div className="text-textSecondary text-xs">
                              {item.auditNotes && item.auditNotes.length > 0 ? (
                                <span>{item.auditNotes[0]}</span>
                              ) : (
                                <span>Corporate posting authenticated without fraud markers.</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Action Details */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="p-1 rounded hover:bg-page text-textMuted hover:text-textPrimary transition-colors"
                            title="Inspect Audit"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 4. Detail & Action Slide-Over Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-card border-l border-borderDefault p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-borderDefault pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-textMuted font-medium">
                      Audit File Record #{selectedRecord.id}
                    </span>
                    {selectedRecord.isScam && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444] text-white uppercase">
                        High Risk Scam
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-textPrimary mt-1">
                    {selectedRecord.company || selectedRecord.companyName || 'Enterprise Entity'}
                  </h2>
                  <p className="text-xs text-textSecondary">
                    {selectedRecord.role || selectedRecord.title || selectedRecord.subject}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 rounded-lg hover:bg-page text-textMuted hover:text-textPrimary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Security Audit Evaluation Breakdown */}
              <div
                className={`p-4 rounded-xl border text-xs ${
                  selectedRecord.isScam
                    ? 'bg-badge-scamBg border-badge-scamBorder text-badge-scamText'
                    : 'bg-page border-borderDefault text-textSecondary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono uppercase tracking-wider text-[11px] text-textMuted flex items-center gap-1.5 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    Security Audit Evaluation
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedRecord.groundTruthFraudulent !== undefined && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-card border border-borderDefault text-textSecondary">
                        Ground Truth: {selectedRecord.groundTruthFraudulent ? 'Fraud' : 'Genuine'}
                      </span>
                    )}
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-card border border-borderDefault text-textPrimary font-medium">
                      Confidence: {Math.round((selectedRecord.confidence || 0.95) * 100)}%
                    </span>
                  </div>
                </div>

                {selectedRecord.isScam ? (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-start gap-2 text-badge-scamText font-bold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{selectedRecord.scamReason}</span>
                    </div>
                    {selectedRecord.auditNotes && (
                      <ul className="list-disc list-inside space-y-1 pl-6 text-badge-scamText/90 text-[11px]">
                        {selectedRecord.auditNotes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-1.5 text-badge-successText font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authentic Corporate Opportunity Authenticated</span>
                    </div>
                    {selectedRecord.auditNotes && (
                      <ul className="list-disc list-inside space-y-1 pl-6 text-textSecondary text-[11px]">
                        {selectedRecord.auditNotes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Follow-Up Action Drafting Module */}
              {selectedRecord.needsFollowUp && (
                <div className="p-4 rounded-xl border border-badge-followupBorder bg-badge-followupBg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-badge-followupText font-semibold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Follow-up Recommended ({selectedRecord.daysElapsed} days since submission)</span>
                    </div>
                    <button
                      onClick={() => handleCopyDraft(customDraft, String(selectedRecord.id))}
                      className="px-2.5 py-1 rounded bg-[#D97706] hover:bg-[#B45309] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-xs"
                    >
                      {copiedId === String(selectedRecord.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy to Clipboard</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-badge-followupText/90">
                    Concise 2-sentence formal follow-up draft. Editable prior to dispatch:
                  </p>

                  <textarea
                    rows={4}
                    value={customDraft}
                    onChange={(e) => setCustomDraft(e.target.value)}
                    className="w-full bg-card border border-badge-followupBorder rounded-lg p-3 text-xs text-textPrimary font-sans focus:outline-none focus:border-[#D97706] shadow-xs"
                  />
                </div>
              )}

              {/* Metadata Record */}
              <div className="bg-page border border-borderDefault rounded-xl p-4 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-borderDefault pb-2">
                  <span className="text-textMuted font-medium">CLASSIFICATION</span>
                  <span className="font-semibold text-textPrimary uppercase">
                    {selectedRecord.status}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-borderDefault pb-2">
                  <span className="text-textMuted font-medium">CONTACT / SOURCE</span>
                  <span className="text-textPrimary font-sans select-all break-all font-medium">
                    {selectedRecord.from}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-borderDefault pb-2">
                  <span className="text-textMuted font-medium">DATE</span>
                  <span className="text-textPrimary">
                    {new Date(selectedRecord.date).toUTCString()}
                  </span>
                </div>
                <div className="flex items-start justify-between pt-1">
                  <span className="text-textMuted font-medium">SUBJECT / TITLE</span>
                  <span className="text-textPrimary font-sans font-medium text-right max-w-xs">
                    {selectedRecord.subject || selectedRecord.title}
                  </span>
                </div>
              </div>

              {/* Full Original Job Description or Email Body */}
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-textMuted block mb-2 font-semibold">
                  Job Description / Raw Communication Payload
                </span>
                <div className="p-4 rounded-xl border border-borderDefault bg-page text-xs text-textPrimary font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto selection:bg-[#E5E0D8]">
                  {selectedRecord.body}
                </div>
              </div>
            </div>

            {/* Footer close button */}
            <div className="pt-6 border-t border-borderDefault mt-6">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-2.5 rounded-lg bg-page hover:bg-[#EDE8E1] border border-borderDefault text-textPrimary text-xs font-semibold transition-colors"
              >
                Dismiss Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Footer */}
      <footer className="mt-auto border-t border-borderDefault bg-card py-4 px-6 text-xs text-textMuted font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span>CareerShield Job Application Tracker & Risk Auditor</span>
          <span>•</span>
          <span>Google Gemini API Verification Engine & CSV Benchmark</span>
        </div>
        <div>
          <span>Utilitarian corporate edition. Compatible with Kaggle Real/Fake Job Postings dataset.</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
