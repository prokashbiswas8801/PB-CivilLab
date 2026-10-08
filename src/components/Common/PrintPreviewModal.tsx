/**
 * PB CivilLab — Professional Engineering Report & Print Preview Engine
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * CRITICAL ARCHITECTURAL CONSTITUTION:
 * 1. SINGLE SOURCE OF TRUTH:
 *    Renders directly from the authoritative CalculationResult object.
 * 2. REAL-TIME SECTION TOGGLES:
 *    Preview updates immediately when sections are turned on or off.
 *    Persists user preferences across sessions.
 * 3. MANDATORY BRANDING ENFORCEMENT:
 *    Site logo, app name "PB CivilLab", and creator credits (Prokash Biswas)
 *    are permanently embedded across preview, print, and exports.
 * 4. A4 DYNAMIC ORIENTATION & MARGINS:
 *    Full support for A4 Portrait & Landscape with synchronized native print
 *    and multi-page vector PDF generation.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  FileText,
  Download,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Maximize2,
  Info,
  Lock,
  RotateCcw,
  Sliders,
  CheckSquare,
  Square,
  FileJson,
} from 'lucide-react';
import {
  CalculationResult,
  AppSettings,
  ReportProjectMeta,
  ReportStatus,
  ReportSectionOptions,
  DEFAULT_REPORT_SECTIONS,
} from '../../types';
import { Logo } from '../Logo';
import {
  generateCSVReport,
  generateExcelReport,
  generateJSONExport,
  downloadFile,
  exportCalculationToPDF,
} from '../../utils/exportEngine';
import { buildReportDocument } from '../../report/buildReportDocument';
import { EngineeringReportView } from '../../report/EngineeringReportView';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult | null;
  settings: AppSettings;
  initialProjectMeta?: ReportProjectMeta;
  defaultOrientation?: 'portrait' | 'landscape';
}

const STORAGE_KEY_SECTIONS = 'pb_civillab_report_section_preferences';

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  result,
  settings,
  initialProjectMeta,
  defaultOrientation = 'portrait',
}) => {
  // Generate a clean, stable document number
  const [defaultDocNo] = useState<string>(() => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `PBCL-${year}-${rand}`;
  });

  const [currentDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  // Project Metadata State — ZERO FABRICATION (optional fields empty by default)
  const [projectMeta, setProjectMeta] = useState<ReportProjectMeta>(() => ({
    projectName: initialProjectMeta?.projectName || '',
    projectId: initialProjectMeta?.projectId || '',
    client: initialProjectMeta?.client || '',
    contractor: initialProjectMeta?.contractor || '',
    consultant: initialProjectMeta?.consultant || '',
    location: initialProjectMeta?.location || '',
    drawingNumber: initialProjectMeta?.drawingNumber || '',
    drawingRevision: initialProjectMeta?.drawingRevision || '',
    documentNumber: initialProjectMeta?.documentNumber || defaultDocNo,
    calculationReference: initialProjectMeta?.calculationReference || '',
    preparedBy: initialProjectMeta?.preparedBy || '',
    checkedBy: initialProjectMeta?.checkedBy || '',
    approvedBy: initialProjectMeta?.approvedBy || '',
    reportStatus: initialProjectMeta?.reportStatus || 'Draft',
    date: initialProjectMeta?.date || currentDate,
    showEmptyFields: initialProjectMeta?.showEmptyFields || false,
  }));

  // Layout & Formatting State
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(defaultOrientation);
  const [margin, setMargin] = useState<'normal' | 'compact'>('normal');
  const [pageFormatMode, setPageFormatMode] = useState<'one-page' | 'multi-page'>('one-page');
  const [customReportTitle, setCustomReportTitle] = useState<string>('');

  // Section Visibility State with LocalStorage Persistence
  const [sections, setSections] = useState<ReportSectionOptions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SECTIONS);
      if (saved) {
        return { ...DEFAULT_REPORT_SECTIONS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_REPORT_SECTIONS };
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'sections' | 'meta'>('preview');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Synchronize dynamic print stylesheet for browser native print
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add('print-preview-modal-active');

    let styleEl = document.getElementById('pb-print-dynamic-page-style') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'pb-print-dynamic-page-style';
      document.head.appendChild(styleEl);
    }

    const marginValue = margin === 'compact' ? '10mm' : '15mm';
    styleEl.textContent = `
      @media print {
        @page {
          size: A4 ${orientation} !important;
          margin: ${marginValue} !important;
        }
      }
    `;

    return () => {
      document.body.classList.remove('print-preview-modal-active');
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [isOpen, orientation, margin]);

  // Persist section changes
  const updateSection = (key: keyof ReportSectionOptions, value: boolean) => {
    setSections(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  };

  const handleSelectAllSections = () => {
    const allOn: ReportSectionOptions = {
      showProjectInfo: true,
      showInputs: true,
      showPrimaryResult: true,
      showSecondaryResults: true,
      showCalculationTrace: true,
      showEngineeringBasis: true,
      showEngineeringNotes: true,
      showDetailedTables: true,
      showVerification: true,
    };
    setSections(allOn);
    try {
      localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(allOn));
    } catch {}
  };

  const handleResetSectionDefaults = () => {
    setSections(DEFAULT_REPORT_SECTIONS);
    try {
      localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(DEFAULT_REPORT_SECTIONS));
    } catch {}
  };

  if (!isOpen || !result) return null;

  const reportTitle = customReportTitle.trim() || result.title;
  const status = projectMeta.reportStatus || 'Draft';

  // Handle Native Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF Export with current preview options
  const handleExportPDF = (forceOnePage?: boolean) => {
    try {
      const isOnePage = forceOnePage !== undefined ? forceOnePage : (pageFormatMode === 'one-page');
      exportCalculationToPDF(result, {
        projectMeta,
        customTitle: reportTitle,
        settings,
        orientation,
        margin,
        sectionOptions: sections,
        fitToOnePage: isOnePage,
        autoDownload: true,
      });
      setExportNotice(
        isOnePage
          ? `Generated & downloaded A4 ${orientation} 1-Page Summary PDF (zero text cut & no overlap).`
          : `Generated & downloaded A4 ${orientation} Multi-Page PDF with dynamic pagination & repeating header.`
      );
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setExportNotice(`Failed to export PDF: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setExportNotice(null), 5000);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    try {
      const csvContent = generateCSVReport(result, projectMeta, sections);
      const safeTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `PB_CivilLab_${safeTitle}_${projectMeta.documentNumber || 'report'}.csv`;
      downloadFile(csvContent, filename, 'text/csv');
      setExportNotice(`Downloaded CSV Report: ${filename}`);
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err: any) {
      console.error('CSV export failed:', err);
      setExportNotice(`CSV export failed: ${err?.message || 'Error'}`);
    }
  };

  // Handle Excel Spreadsheet Export (CSV with UTF-8 BOM)
  const handleExportExcel = () => {
    try {
      const csvContent = generateExcelReport(result, projectMeta, sections);
      const safeTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `PB_CivilLab_${safeTitle}_${projectMeta.documentNumber || 'report'}.csv`;
      downloadFile(csvContent, filename, 'application/vnd.ms-excel');
      setExportNotice(`Downloaded Excel Spreadsheet: ${filename}`);
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err: any) {
      console.error('Excel export failed:', err);
      setExportNotice(`Excel export failed: ${err?.message || 'Error'}`);
    }
  };

  // Handle JSON Structured Engineering Data Export
  const handleExportJSON = () => {
    try {
      const jsonContent = generateJSONExport(result, projectMeta, sections);
      const safeTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `PB_CivilLab_${safeTitle}_${projectMeta.documentNumber || 'report'}.json`;
      downloadFile(jsonContent, filename, 'application/json');
      setExportNotice(`Downloaded structured JSON Package: ${filename}`);
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err: any) {
      console.error('JSON export failed:', err);
      setExportNotice(`JSON export failed: ${err?.message || 'Error'}`);
    }
  };

  // Project information populated items
  const projectInfoFields = [
    { label: 'Project Name', value: projectMeta.projectName },
    { label: 'Project ID', value: projectMeta.projectId },
    { label: 'Client / Owner', value: projectMeta.client },
    { label: 'Contractor', value: projectMeta.contractor },
    { label: 'Consultant', value: projectMeta.consultant },
    { label: 'Jobsite Location', value: projectMeta.location },
    { label: 'Drawing Number', value: projectMeta.drawingNumber },
    { label: 'Drawing Revision', value: projectMeta.drawingRevision },
    { label: 'Calculation Ref', value: projectMeta.calculationReference },
  ];

  const visibleProjectFields = projectMeta.showEmptyFields
    ? projectInfoFields.map(f => ({ ...f, value: f.value || 'Not specified' }))
    : projectInfoFields.filter(f => Boolean(f.value));

  // Counts for section adaptation
  const inputsCount = result.inputsSummary?.length || 0;
  const secondariesCount = result.secondaryValues?.length || 0;
  const breakdownCount = result.breakdown?.length || 0;
  const traceCount = result.calculationTrace?.length || 0;
  const hasBasis = Boolean(result.engineeringBasis || result.assumptions?.length);
  const hasNotes = Boolean(result.engineeringNotes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200 print-modal-overlay">
      <div className="w-full max-w-7xl h-[96vh] rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-[#0B0F19] shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 print-modal-inner">
        
        {/* HEADER TOOLBAR (Excluded in print) */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] flex items-center justify-between gap-3 no-print shrink-0 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                  PB CivilLab Engineering Report Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 font-semibold uppercase">
                  A4 {orientation.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Doc Ref: {projectMeta.documentNumber} · Status: <span className="font-bold text-slate-800 dark:text-slate-200">{status}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#151C2B] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'preview' ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sheet Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'sections' ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sections ({Object.values(sections).filter(Boolean).length}/9)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('meta')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'meta' ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Project Details
              </button>
            </div>

            {/* Export Actions */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Export structured CSV report matching previewed sections"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              title="Export structured spreadsheet for Microsoft Excel / Sheets (UTF-8 BOM)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              title="Export structured calculation JSON package with metadata"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportPDF(true)}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Export formatted 1-Page A4 Engineering PDF (guaranteed single page with zero text cut or overlap)"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>1-Page PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportPDF(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Export full multi-page technical report with repeating headers"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Multi-Page PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all active:scale-95"
              title="Print document on physical or PDF printer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {exportNotice && (
          <div className="px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between no-print">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{exportNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setExportNotice(null)}
              className="text-cyan-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN BODY: OPTIONS PANE + WYSIWYG SHEET */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: Report Configuration & Controls */}
          <div className="w-80 lg:w-96 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-4 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 shrink-0 no-print">
            
            {/* MANDATORY BRANDING NOTICE (Permanent, cannot be disabled) */}
            <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/10 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300 block uppercase tracking-wide">
                  Mandatory Identity & Branding
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  App branding (<strong className="text-slate-900 dark:text-slate-200">PB CivilLab</strong>) and creator credits (<strong className="text-slate-900 dark:text-slate-200">Prokash Biswas</strong>) are permanently included on all pages, print sheets, and data exports.
                </p>
              </div>
            </div>

            {/* Document Formatting (A4 Layout) */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-700 dark:text-cyan-400 block tracking-wider">
                A4 Document Layout & Style
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={e => setOrientation(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="portrait">A4 Portrait (210 × 297 mm)</option>
                    <option value="landscape">A4 Landscape (297 × 210 mm)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Sheet Margins</label>
                  <select
                    value={margin}
                    onChange={e => setMargin(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="normal">Normal (15 mm - A4 Standard)</option>
                    <option value="compact">Compact (10 mm)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Page Format Mode</label>
                <select
                  value={pageFormatMode}
                  onChange={e => setPageFormatMode(e.target.value as any)}
                  className="w-full rounded-lg border border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-500/10 p-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="one-page">A4 1-Page Summary (Clean, Compact, No Overlap)</option>
                  <option value="multi-page">Full Multi-Page Report (All Sections Expanded)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Document Status</label>
                <select
                  value={status}
                  onChange={e => setProjectMeta({ ...projectMeta, reportStatus: e.target.value as ReportStatus })}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 focus:outline-none focus:border-cyan-500/50 font-mono"
                >
                  <option value="Draft">Draft (Standard Default)</option>
                  <option value="For Review">For Review</option>
                  <option value="Checked">Checked</option>
                  <option value="Approved">Approved</option>
                  <option value="For Construction">For Construction</option>
                  <option value="As-Built">As-Built</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Report Title Override</label>
                <input
                  type="text"
                  value={customReportTitle}
                  onChange={e => setCustomReportTitle(e.target.value)}
                  placeholder={result.title}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* REPORT SECTION CONTROLS (Live WYSIWYG Toggles) */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-cyan-700 dark:text-cyan-400 tracking-wider">
                  Report Sections
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={handleSelectAllSections}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-400">·</span>
                  <button
                    type="button"
                    onClick={handleResetSectionDefaults}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Defaults
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                {/* 1. Project Information */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showProjectInfo}
                      onChange={e => updateSection('showProjectInfo', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Project & Client Metadata</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {visibleProjectFields.length} field{visibleProjectFields.length === 1 ? '' : 's'}
                  </span>
                </label>

                {/* 2. Primary Result */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showPrimaryResult}
                      onChange={e => updateSection('showPrimaryResult', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Primary Result Banner</span>
                  </span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                    {result.primaryUnit}
                  </span>
                </label>

                {/* 3. Inputs */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showInputs}
                      onChange={e => updateSection('showInputs', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Calculation Inputs</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {inputsCount > 0 ? `${inputsCount} param${inputsCount === 1 ? '' : 's'}` : 'None'}
                  </span>
                </label>

                {/* 4. Secondary Results */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showSecondaryResults}
                      onChange={e => updateSection('showSecondaryResults', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Secondary Calculated Outputs</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {secondariesCount > 0 ? `${secondariesCount} output${secondariesCount === 1 ? '' : 's'}` : 'None'}
                  </span>
                </label>

                {/* 5. Detailed Tables & Step Breakdown */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showDetailedTables}
                      onChange={e => updateSection('showDetailedTables', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Detailed Breakdown & Step Table</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {breakdownCount > 0 ? `${breakdownCount} steps` : 'None'}
                  </span>
                </label>

                {/* 6. Calculation Trace */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showCalculationTrace}
                      onChange={e => updateSection('showCalculationTrace', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Mathematical Equation & Trace</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {traceCount > 0 ? `${traceCount} steps` : 'Formula'}
                  </span>
                </label>

                {/* 7. Engineering Basis */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showEngineeringBasis}
                      onChange={e => updateSection('showEngineeringBasis', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Assumptions & Engineering Basis</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {hasBasis ? 'Standard' : 'None'}
                  </span>
                </label>

                {/* 8. Engineering Notes */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showEngineeringNotes}
                      onChange={e => updateSection('showEngineeringNotes', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Jobsite Notes & Precautions</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {hasNotes ? 'Available' : 'None'}
                  </span>
                </label>

                {/* 9. Sign-off */}
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sections.showVerification}
                      onChange={e => updateSection('showVerification', e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Quality Sign-Off Fields</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">3 Roles</span>
                </label>
              </div>
            </div>

            {/* Project Metadata Section */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-cyan-700 dark:text-cyan-400 tracking-wider">
                  Project Details
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={projectMeta.showEmptyFields}
                    onChange={e => setProjectMeta({ ...projectMeta, showEmptyFields: e.target.checked })}
                    className="rounded border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-500"
                  />
                  <span>Show empty</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Project Name</label>
                  <input
                    type="text"
                    value={projectMeta.projectName}
                    onChange={e => setProjectMeta({ ...projectMeta, projectName: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Project ID</label>
                  <input
                    type="text"
                    value={projectMeta.projectId}
                    onChange={e => setProjectMeta({ ...projectMeta, projectId: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Client / Owner</label>
                  <input
                    type="text"
                    value={projectMeta.client}
                    onChange={e => setProjectMeta({ ...projectMeta, client: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Jobsite Location</label>
                  <input
                    type="text"
                    value={projectMeta.location}
                    onChange={e => setProjectMeta({ ...projectMeta, location: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Drawing No</label>
                  <input
                    type="text"
                    value={projectMeta.drawingNumber}
                    onChange={e => setProjectMeta({ ...projectMeta, drawingNumber: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Revision</label>
                  <input
                    type="text"
                    value={projectMeta.drawingRevision}
                    onChange={e => setProjectMeta({ ...projectMeta, drawingRevision: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Document No</label>
                  <input
                    type="text"
                    value={projectMeta.documentNumber}
                    onChange={e => setProjectMeta({ ...projectMeta, documentNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs font-mono text-cyan-700 dark:text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Date</label>
                  <input
                    type="text"
                    value={projectMeta.date}
                    onChange={e => setProjectMeta({ ...projectMeta, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Quality Sign-Off Block Inputs */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-white/10">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-700 dark:text-cyan-400 block tracking-wider">
                Sign-Off / Verification
              </span>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Prepared By</label>
                <input
                  type="text"
                  value={projectMeta.preparedBy}
                  onChange={e => setProjectMeta({ ...projectMeta, preparedBy: e.target.value })}
                  placeholder="e.g. Engr. Prokash Biswas"
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Checked By</label>
                  <input
                    type="text"
                    value={projectMeta.checkedBy}
                    onChange={e => setProjectMeta({ ...projectMeta, checkedBy: e.target.value })}
                    placeholder="Leave blank if pending"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Approved By</label>
                  <input
                    type="text"
                    value={projectMeta.approvedBy}
                    onChange={e => setProjectMeta({ ...projectMeta, approvedBy: e.target.value })}
                    placeholder="Leave blank if pending"
                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#151C2B] p-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CANVAS: WYSIWYG A4 CALCULATION SHEET */}
          <div className="flex-1 bg-[#070B12] p-4 sm:p-6 lg:p-8 overflow-y-auto flex justify-center print-modal-canvas">
            
            {/* The Print Sheet Target Container */}
            <div
              id="pb-civillab-printable-sheet"
              className={`w-full ${
                orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]'
              } bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 font-sans print-sheet ${
                margin === 'compact' ? 'p-6 sm:p-8' : 'p-8 sm:p-12'
              }`}
              style={{
                minHeight: orientation === 'landscape' ? '210mm' : '297mm',
              }}
            >
              {/* 1. MANDATORY OFFICIAL ENGINEERING HEADER */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between break-inside-avoid">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-sky-600 flex items-center justify-center text-white font-mono font-bold text-base shrink-0 shadow-sm relative overflow-hidden mt-0.5">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="w-full h-px bg-sky-400 top-1/2 absolute" />
                      <div className="h-full w-px bg-sky-400 left-1/2 absolute" />
                    </div>
                    <span className="relative z-10 text-white font-black tracking-tight">PB</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-wood text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        PB CivilLab
                      </span>
                      <span className="text-[10px] px-2 py-0.5 border border-slate-900 font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-900">
                        Civil Engineering Smart Toolkit
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-medium">
                      Civil Engineering Calculation Sheet · Engineered by Prokash Biswas · Calculate Smarter. Build Better.
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div className="border-2 border-slate-900 px-3 py-1 font-mono text-center bg-slate-50">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                      Document No
                    </span>
                    <strong className="text-xs text-slate-900">{projectMeta.documentNumber}</strong>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    Date: {projectMeta.date}
                  </div>
                </div>
              </div>

              {/* 2. CALCULATION TITLE & STATUS BANNER */}
              <div className="mb-4 pb-2 border-b border-slate-300 flex items-center justify-between break-inside-avoid">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block font-mono">
                    Calculation Type
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-950 tracking-tight leading-tight">
                    {reportTitle}
                  </h1>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block font-mono">
                    Document Status
                  </span>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 border uppercase tracking-wider ${
                    status === 'Approved' || status === 'For Construction'
                      ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                      : status === 'For Review' || status === 'Checked'
                      ? 'border-sky-800 bg-sky-50 text-sky-900'
                      : 'border-slate-800 bg-slate-100 text-slate-900'
                  }`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* 3. PROJECT INFORMATION SECTION (OPTIONAL) */}
              {sections.showProjectInfo && visibleProjectFields.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Project & Client Information
                  </h3>
                  <div className={`grid ${orientation === 'landscape' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'} gap-2 border border-slate-300 p-2.5 text-xs bg-slate-50/70`}>
                    {visibleProjectFields.map((field, idx) => (
                      <div key={idx} className="break-words min-w-0">
                        <span className="block text-[9px] uppercase font-bold text-slate-500">
                          {field.label}
                        </span>
                        <span className="font-semibold text-slate-900 break-words block">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. PRIMARY ENGINEERING RESULT HIGHLIGHT BOX (OPTIONAL) */}
              {sections.showPrimaryResult && (
                <div className="border-2 border-slate-900 p-4 mb-4 bg-slate-100 flex items-center justify-between break-inside-avoid">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                      Primary Engineering Output Quantity
                    </span>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-950 mt-1 tracking-tight">
                      {result.primaryValue} <span className="text-xl font-bold">{result.primaryUnit}</span>
                    </div>
                    {result.secondaryValues && result.secondaryValues.length > 0 && (
                      <p className="text-xs text-slate-700 font-mono mt-1 font-semibold">
                        {result.secondaryValues[0].label}: {result.secondaryValues[0].value} {result.secondaryValues[0].unit || ''}
                      </p>
                    )}
                  </div>

                  <div className="border-l border-slate-400 pl-4 text-right text-xs space-y-1">
                    <span className="block text-[10px] uppercase text-slate-600 font-bold">Standard Precision</span>
                    <span className="font-mono font-bold text-slate-900">{settings.decimalPrecision ?? 2} Decimals</span>
                    <span className="block text-[9px] text-slate-500 font-mono">Category: {result.primaryCategory || 'General'}</span>
                  </div>
                </div>
              )}

              {/* 5. INPUT PARAMETERS TABLE (OPTIONAL) */}
              {sections.showInputs && result.inputsSummary && result.inputsSummary.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Specified Input Parameters
                  </h3>
                  <table className="w-full text-xs border border-collapse border-slate-800 calculation-table">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800">
                        <th className="p-1.5 text-left border-r border-slate-800 font-bold text-slate-900">Parameter Description</th>
                        <th className="p-1.5 text-right font-bold text-slate-900">Specified Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.inputsSummary.map((inp, idx) => (
                        <tr key={idx} className="border-b border-slate-300 boq-row">
                          <td className="p-1.5 border-r border-slate-800 font-medium text-slate-900">{inp.label}</td>
                          <td className="p-1.5 text-right font-mono font-bold text-slate-900">{inp.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6. CALCULATED OUTPUTS & SECONDARY QUANTITIES (OPTIONAL) */}
              {sections.showSecondaryResults && result.secondaryValues && result.secondaryValues.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Calculated Outputs & Secondary Quantities
                  </h3>
                  <table className="w-full text-xs border border-collapse border-slate-800 calculation-table">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800">
                        <th className="p-1.5 text-left border-r border-slate-800 font-bold text-slate-900">Output Item</th>
                        <th className="p-1.5 text-right font-bold text-slate-900">Computed Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.secondaryValues.map((sec, idx) => (
                        <tr key={idx} className="border-b border-slate-300 boq-row">
                          <td className="p-1.5 border-r border-slate-800 font-medium text-slate-900">{sec.label}</td>
                          <td className="p-1.5 text-right font-mono font-bold text-slate-950">
                            {sec.value} {sec.unit || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 7. DETAILED STEP BREAKDOWN TABLE (OPTIONAL) */}
              {sections.showDetailedTables && result.breakdown && result.breakdown.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Detailed Arithmetic Breakdown & Step Summary
                  </h3>
                  <table className="w-full text-xs border border-collapse border-slate-800 calculation-table">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800">
                        <th className="p-1.5 text-left border-r border-slate-800 font-bold text-slate-900 w-1/3">Step</th>
                        <th className="p-1.5 text-left border-r border-slate-800 font-bold text-slate-900 w-1/2">Expression</th>
                        <th className="p-1.5 text-right font-bold text-slate-900">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.breakdown.map((b, idx) => (
                        <tr key={idx} className="border-b border-slate-300 boq-row">
                          <td className="p-1.5 border-r border-slate-800 font-medium text-slate-900 font-sans">{b.step}</td>
                          <td className="p-1.5 border-r border-slate-800 text-slate-700 font-mono text-[11px]">{b.expression}</td>
                          <td className="p-1.5 text-right font-mono font-bold text-slate-950">{b.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 8. CALCULATION TRACE (MATHEMATICAL DERIVATION) (OPTIONAL) */}
              {sections.showCalculationTrace && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Governing Equation & Calculation Trace
                  </h3>
                  <div className="border border-slate-300 divide-y divide-slate-300 text-xs font-mono bg-white">
                    <div className="p-2 bg-slate-50">
                      <span className="font-bold text-slate-900 font-sans mr-2">Governing Formula:</span>
                      <span className="text-slate-800 font-mono">{result.formula || 'Standard Construction Formula'}</span>
                    </div>
                    {result.substitutedFormula && (
                      <div className="p-2 bg-slate-50">
                        <span className="font-bold text-slate-900 font-sans mr-2">Substituted Trace:</span>
                        <span className="text-cyan-800 font-mono font-semibold">{result.substitutedFormula}</span>
                      </div>
                    )}
                    {result.calculationTrace && result.calculationTrace.map((tr, idx) => (
                      <div key={idx} className="p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="font-bold text-slate-900 font-sans block sm:inline mr-2">
                            {tr.label}:
                          </span>
                          <span className="text-slate-700">{tr.expression}</span>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <span className="font-bold text-slate-950">{tr.result}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. ENGINEERING BASIS & CODE REFERENCES (OPTIONAL) */}
              {sections.showEngineeringBasis && (
                <div className="mb-4 border border-slate-300 p-3 text-xs bg-slate-50 break-inside-avoid">
                  <h4 className="font-bold uppercase text-[10px] text-slate-700 mb-1.5 tracking-wider font-mono">
                    Engineering Basis & Reference Parameters
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-800">
                    <div>
                      <strong>Formula / Method:</strong> {result.formula || result.engineeringBasis?.formulaMethod || 'Standard Construction Formula'}
                    </div>
                    <div>
                      <strong>Material Assumption:</strong> {result.engineeringBasis?.materialAssumption || 'Standard Construction Material'}
                    </div>
                    <div>
                      <strong>Constants / Density:</strong> {result.engineeringBasis?.densityConstants || 'Standard reference constants'}
                    </div>
                    <div>
                      <strong>Standard Reference:</strong> {result.engineeringBasis?.standardCode || 'Standard Theoretical Mass (BNBC / BDS 1313 / ASTM)'}
                    </div>
                  </div>
                  {result.assumptions && result.assumptions.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-200">
                      <span className="font-bold text-[10px] uppercase text-slate-600 block mb-1">Key Assumptions:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
                        {result.assumptions.map((a, idx) => (
                          <li key={idx}><strong>{a.label}:</strong> {a.value}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.engineeringBasis?.toleranceNote && (
                    <p className="mt-2 text-[10px] text-slate-600 leading-normal border-t border-slate-200 pt-1.5 italic">
                      {result.engineeringBasis.toleranceNote}
                    </p>
                  )}
                </div>
              )}

              {/* 10. JOBSITE PRACTICAL ENGINEERING NOTES (OPTIONAL) */}
              {sections.showEngineeringNotes && result.engineeringNotes && (
                <div className="mb-4 border border-slate-300 p-3 text-xs bg-slate-50 break-inside-avoid">
                  <span className="font-bold uppercase text-[10px] text-slate-700 block mb-1 font-mono">
                    Jobsite Quality Control & Practical Notes
                  </span>
                  <p className="text-slate-800 text-[11px] leading-relaxed">
                    {result.engineeringNotes}
                  </p>
                </div>
              )}

              {/* 11. VERIFICATION & SIGN-OFF BLOCK (OPTIONAL) */}
              {sections.showVerification && (
                <div className="mt-6 p-4 rounded-lg bg-slate-50 border-2 border-slate-900 break-inside-avoid print-sign-off qa-sign-off-block">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-300 pb-1.5">
                    <span className="block text-[10px] uppercase font-bold text-slate-800 tracking-wider font-mono">
                      Quality Assurance & Verification Sign-Off
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase">
                      Site QA Protocol
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center text-xs">
                    <div className="bg-white p-2.5 rounded border border-slate-300 sign-box">
                      <span className="block font-bold text-slate-900 break-words">
                        {projectMeta.preparedBy || 'Prepared By'}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1 border-t border-slate-800 pt-1">
                        Signature & Date
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-slate-300 sign-box">
                      <span className="block font-bold text-slate-900 break-words">
                        {projectMeta.checkedBy || 'Checked By'}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1 border-t border-slate-800 pt-1">
                        Signature & Date
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-slate-300 sign-box">
                      <span className="block font-bold text-slate-900 break-words">
                        {projectMeta.approvedBy || 'Approved By'}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1 border-t border-slate-800 pt-1">
                        Signature & Date
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 12. MANDATORY ENGINEERING DISCLAIMER */}
              <div className="mt-6 pt-2 border-t border-slate-300 text-[9px] text-slate-500 leading-normal break-inside-avoid">
                <strong>Engineering Note:</strong> This calculation provides computational assistance based on the inputs, assumptions, units and calculation method selected by the user. It does not replace project specifications, approved drawings, applicable codes and standards, manufacturer data, site verification, or professional engineering judgment.
              </div>

              {/* 13. MANDATORY OFFICIAL FOOTER WITH CREATOR CREDITS */}
              <div className="mt-4 pt-2 border-t border-slate-400 flex items-center justify-between text-[9px] text-slate-500 font-mono break-inside-avoid">
                <span>PB CivilLab · Calculate Smarter. Build Better. · Engineered by Prokash Biswas</span>
                <span>Doc: {projectMeta.documentNumber} · A4 {orientation.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
