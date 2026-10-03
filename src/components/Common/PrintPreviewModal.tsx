/**
 * PB CivilLab — Professional Engineering Report & Print Preview Engine
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * CRITICAL ARCHITECTURAL CONSTITUTION:
 * 1. SINGLE SOURCE OF TRUTH:
 *    Renders directly from the authoritative CalculationResult object.
 *    Never recalculates values or intermediate variables.
 * 2. ZERO FABRICATED DATA:
 *    Defaults to 'Draft' status. No fake drawings or artificial approval statuses.
 * 3. A4 PROFESSIONAL ENGINEERING CALCULATION SHEET:
 *    Designed for technical submissions, client reviews, and jobsite documentation.
 * 4. MULTI-FORMAT EXPORTS:
 *    Print, Export PDF, Export CSV, Export Excel Spreadsheet.
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { CalculationResult, AppSettings, ReportProjectMeta, ReportStatus } from '../../types';
import { Logo } from '../Logo';
import { generateCSVReport, downloadFile } from '../../utils/exportEngine';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult | null;
  settings: AppSettings;
  initialProjectMeta?: ReportProjectMeta;
  defaultOrientation?: 'portrait' | 'landscape';
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  result,
  settings,
  initialProjectMeta,
  defaultOrientation = 'portrait',
}) => {
  // Generate a clean, stable document number (No fake office codes)
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

  // Project Metadata State — ZERO FABRICATION (all optional fields empty by default)
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

  // Layout & Section toggles
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(defaultOrientation);
  const [margin, setMargin] = useState<'normal' | 'compact'>('normal');
  const [showProjectInfo, setShowProjectInfo] = useState<boolean>(true);
  const [showCalculationTrace, setShowCalculationTrace] = useState<boolean>(true);
  const [showEngineeringBasis, setShowEngineeringBasis] = useState<boolean>(true);
  const [showEngineeringNotes, setShowEngineeringNotes] = useState<boolean>(true);
  const [showVerification, setShowVerification] = useState<boolean>(true);
  const [customReportTitle, setCustomReportTitle] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'preview' | 'meta'>('preview');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen || !result) return null;

  const reportTitle = customReportTitle.trim() || result.title;
  const status = projectMeta.reportStatus || 'Draft';

  // Handle Browser Native Print (which uses our @media print stylesheet)
  const handlePrint = () => {
    window.print();
  };

  // Handle Export PDF workflow
  const handleExportPDF = () => {
    setExportNotice('Opening system print dialog — select "Save as PDF" to generate an official vector A4 PDF.');
    setTimeout(() => {
      window.print();
      setTimeout(() => setExportNotice(null), 3000);
    }, 400);
  };

  // Handle CSV Export (Single source of truth)
  const handleExportCSV = () => {
    const csvContent = generateCSVReport(result, projectMeta);
    const safeTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${safeTitle}_${projectMeta.documentNumber || 'report'}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
    setExportNotice(`Downloaded CSV Report: ${filename}`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Handle Excel Spreadsheet Export (CSV with UTF-8 BOM for flawless characters)
  const handleExportExcel = () => {
    const csvContent = '\uFEFF' + generateCSVReport(result, projectMeta);
    const safeTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${safeTitle}_${projectMeta.documentNumber || 'report'}.csv`;
    downloadFile(csvContent, filename, 'application/vnd.ms-excel');
    setExportNotice(`Downloaded Excel Spreadsheet: ${filename}`);
    setTimeout(() => setExportNotice(null), 3000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[95vh] rounded-2xl border border-white/15 bg-[#0B0F19] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* HEADER TOOLBAR (Excluded in print) */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-[#111827] flex items-center justify-between gap-3 no-print shrink-0 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  PB CivilLab Engineering Calculation Sheet
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold uppercase">
                  A4 Print & Export
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Doc Ref: {projectMeta.documentNumber} · Status: <span className="font-bold text-slate-200">{status}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-white/10 bg-[#151C2B] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'preview' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sheet Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('meta')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'meta' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Project Details
              </button>
            </div>

            {/* Export Actions */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              title="Export raw calculated data as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Export structured data for Microsoft Excel / Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Export selectable-text vector PDF"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all active:scale-95"
              title="Print document on physical printer or PDF printer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-1"
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
              <Check className="w-4 h-4 text-cyan-400" />
              <span>{exportNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setExportNotice(null)}
              className="text-cyan-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN BODY: OPTIONS PANE + WYSIWYG SHEET */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: Report Configuration & Metadata Inputs */}
          <div className="w-80 lg:w-96 border-r border-white/10 bg-[#0F172A] p-4 overflow-y-auto space-y-4 text-xs text-slate-300 shrink-0 no-print">
            
            {/* Sheet Orientation & Layout */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 block tracking-wider">
                Document Formatting (A4)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={e => setOrientation(e.target.value as any)}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="portrait">Portrait (A4)</option>
                    <option value="landscape">Landscape (A4)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Margins</label>
                  <select
                    value={margin}
                    onChange={e => setMargin(e.target.value as any)}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="normal">Normal (15 mm)</option>
                    <option value="compact">Compact (10 mm)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Document Status</label>
                <select
                  value={status}
                  onChange={e => setProjectMeta({ ...projectMeta, reportStatus: e.target.value as ReportStatus })}
                  className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500/50 font-mono"
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
                <label className="text-[10px] text-slate-400 block mb-1">Report Title Override</label>
                <input
                  type="text"
                  value={customReportTitle}
                  onChange={e => setCustomReportTitle(e.target.value)}
                  placeholder={result.title}
                  className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Project Metadata Section */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 tracking-wider">
                  Project Information (Optional)
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400">
                  <input
                    type="checkbox"
                    checked={projectMeta.showEmptyFields}
                    onChange={e => setProjectMeta({ ...projectMeta, showEmptyFields: e.target.checked })}
                    className="rounded border-white/20 bg-[#151C2B] text-cyan-500"
                  />
                  <span>Show empty</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Project Name</label>
                  <input
                    type="text"
                    value={projectMeta.projectName}
                    onChange={e => setProjectMeta({ ...projectMeta, projectName: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Project ID</label>
                  <input
                    type="text"
                    value={projectMeta.projectId}
                    onChange={e => setProjectMeta({ ...projectMeta, projectId: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Client / Owner</label>
                  <input
                    type="text"
                    value={projectMeta.client}
                    onChange={e => setProjectMeta({ ...projectMeta, client: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Jobsite Location</label>
                  <input
                    type="text"
                    value={projectMeta.location}
                    onChange={e => setProjectMeta({ ...projectMeta, location: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Contractor</label>
                  <input
                    type="text"
                    value={projectMeta.contractor}
                    onChange={e => setProjectMeta({ ...projectMeta, contractor: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Consultant</label>
                  <input
                    type="text"
                    value={projectMeta.consultant}
                    onChange={e => setProjectMeta({ ...projectMeta, consultant: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Drawing No</label>
                  <input
                    type="text"
                    value={projectMeta.drawingNumber}
                    onChange={e => setProjectMeta({ ...projectMeta, drawingNumber: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Revision</label>
                  <input
                    type="text"
                    value={projectMeta.drawingRevision}
                    onChange={e => setProjectMeta({ ...projectMeta, drawingRevision: e.target.value })}
                    placeholder="Not specified"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Document No</label>
                  <input
                    type="text"
                    value={projectMeta.documentNumber}
                    onChange={e => setProjectMeta({ ...projectMeta, documentNumber: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Date</label>
                  <input
                    type="text"
                    value={projectMeta.date}
                    onChange={e => setProjectMeta({ ...projectMeta, date: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Quality Sign-Off Block Inputs */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 block tracking-wider">
                Sign-Off / Verification
              </span>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Prepared By</label>
                <input
                  type="text"
                  value={projectMeta.preparedBy}
                  onChange={e => setProjectMeta({ ...projectMeta, preparedBy: e.target.value })}
                  placeholder="e.g. Engr. Prokash Biswas"
                  className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Checked By</label>
                  <input
                    type="text"
                    value={projectMeta.checkedBy}
                    onChange={e => setProjectMeta({ ...projectMeta, checkedBy: e.target.value })}
                    placeholder="Leave blank if pending"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Approved By</label>
                  <input
                    type="text"
                    value={projectMeta.approvedBy}
                    onChange={e => setProjectMeta({ ...projectMeta, approvedBy: e.target.value })}
                    placeholder="Leave blank if pending"
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Section Toggles */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 block tracking-wider">
                Include / Exclude Sections
              </span>
              <div className="space-y-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={showProjectInfo}
                    onChange={e => setShowProjectInfo(e.target.checked)}
                    className="rounded border-white/20 bg-[#151C2B] text-cyan-500"
                  />
                  <span>Project Information Section</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={showCalculationTrace}
                    onChange={e => setShowCalculationTrace(e.target.checked)}
                    className="rounded border-white/20 bg-[#151C2B] text-cyan-500"
                  />
                  <span>Mathematical Calculation Trace</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={showEngineeringBasis}
                    onChange={e => setShowEngineeringBasis(e.target.checked)}
                    className="rounded border-white/20 bg-[#151C2B] text-cyan-500"
                  />
                  <span>Engineering Basis & References</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={showEngineeringNotes}
                    onChange={e => setShowEngineeringNotes(e.target.checked)}
                    className="rounded border-white/20 bg-[#151C2B] text-cyan-500"
                  />
                  <span>Practical Jobsite Notes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={showVerification}
                    onChange={e => setShowVerification(e.target.checked)}
                    className="rounded border-white/20 bg-[#151C2B] text-cyan-500"
                  />
                  <span>Verification Sign-Off Block</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT CANVAS: A4 CALCULATION SHEET (WYSIWYG & PRINTABLE TARGET) */}
          <div className="flex-1 bg-[#070B12] p-4 sm:p-6 lg:p-8 overflow-y-auto flex justify-center">
            
            {/* The Print Sheet Target Container */}
            <div
              id="pb-civillab-printable-sheet"
              className={`w-full ${
                orientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'
              } bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 font-sans print-sheet ${
                margin === 'compact' ? 'p-6 sm:p-8' : 'p-8 sm:p-12'
              }`}
              style={{
                minHeight: orientation === 'landscape' ? '210mm' : '297mm',
              }}
            >
              {/* 1. OFFICIAL ENGINEERING HEADER */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between break-inside-avoid">
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
                    Civil Engineering Calculation Sheet · Prokash Biswas · Calculate Smarter. Build Better.
                  </p>
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

              {/* 3. PROJECT INFORMATION SECTION */}
              {showProjectInfo && visibleProjectFields.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Project Information
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-slate-300 p-2.5 text-xs bg-slate-50/70">
                    {visibleProjectFields.map((field, idx) => (
                      <div key={idx} className="truncate">
                        <span className="block text-[9px] uppercase font-bold text-slate-500">
                          {field.label}
                        </span>
                        <span className="font-semibold text-slate-900 truncate block">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. INPUT PARAMETERS TABLE */}
              {result.inputsSummary && result.inputsSummary.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Specified Input Parameters
                  </h3>
                  <table className="w-full text-xs border border-collapse border-slate-800">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800">
                        <th className="p-1.5 text-left border-r border-slate-800 font-bold text-slate-900">Parameter Description</th>
                        <th className="p-1.5 text-right font-bold text-slate-900">Specified Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.inputsSummary.map((inp, idx) => (
                        <tr key={idx} className="border-b border-slate-300">
                          <td className="p-1.5 border-r border-slate-800 font-medium text-slate-900">{inp.label}</td>
                          <td className="p-1.5 text-right font-mono font-bold text-slate-900">{inp.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. PRIMARY ENGINEERING RESULT HIGHLIGHT BOX */}
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

              {/* 6. CALCULATED OUTPUTS TABLE */}
              {result.secondaryValues && result.secondaryValues.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Calculated Outputs & Secondary Quantities
                  </h3>
                  <table className="w-full text-xs border border-collapse border-slate-800">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800">
                        <th className="p-1.5 text-left border-r border-slate-800 font-bold text-slate-900">Output Item</th>
                        <th className="p-1.5 text-right font-bold text-slate-900">Computed Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.secondaryValues.map((sec, idx) => (
                        <tr key={idx} className="border-b border-slate-300">
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

              {/* 7. CALCULATION TRACE (MATHEMATICAL PRESENTATION) */}
              {showCalculationTrace && (result.calculationTrace || result.breakdown) && (
                <div className="mb-4 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-1 mb-2 font-mono">
                    Calculation Trace & Mathematical Derivation
                  </h3>
                  <div className="border border-slate-300 divide-y divide-slate-300 text-xs font-mono bg-white">
                    {result.calculationTrace && result.calculationTrace.length > 0 ? (
                      result.calculationTrace.map((tr, idx) => (
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
                      ))
                    ) : (
                      result.breakdown.map((b, idx) => (
                        <div key={idx} className="p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 font-sans">{b.step}</span>
                          <span className="text-slate-700">{b.expression} = <strong className="text-slate-950">{b.result}</strong></span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 8. ENGINEERING BASIS & CODE REFERENCES */}
              {showEngineeringBasis && (
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
                  {result.engineeringBasis?.toleranceNote && (
                    <p className="mt-2 text-[10px] text-slate-600 leading-normal border-t border-slate-200 pt-1.5 italic">
                      {result.engineeringBasis.toleranceNote}
                    </p>
                  )}
                </div>
              )}

              {/* 9. JOBSITE PRACTICAL ENGINEERING NOTES */}
              {showEngineeringNotes && result.engineeringNotes && (
                <div className="mb-4 border border-slate-300 p-3 text-xs bg-slate-50 break-inside-avoid">
                  <span className="font-bold uppercase text-[10px] text-slate-700 block mb-1 font-mono">
                    Engineering & Quality Control Notes
                  </span>
                  <p className="text-slate-800 text-[11px] leading-relaxed">
                    {result.engineeringNotes}
                  </p>
                </div>
              )}

              {/* 10. VERIFICATION & SIGN-OFF BLOCK */}
              {showVerification && (
                <div className="mt-6 pt-3 border-t-2 border-slate-900 break-inside-avoid print-sign-off">
                  <span className="block text-[10px] uppercase font-bold text-slate-600 mb-4 tracking-wider font-mono">
                    Quality Assurance & Verification Sign-Off
                  </span>
                  <div className="grid grid-cols-3 gap-6 text-center text-xs">
                    <div className="border-t border-slate-800 pt-1.5">
                      <span className="block font-bold text-slate-900 truncate">
                        {projectMeta.preparedBy || 'Prepared By'}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Signature & Date</span>
                    </div>
                    <div className="border-t border-slate-800 pt-1.5">
                      <span className="block font-bold text-slate-900 truncate">
                        {projectMeta.checkedBy || 'Checked By'}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Signature & Date</span>
                    </div>
                    <div className="border-t border-slate-800 pt-1.5">
                      <span className="block font-bold text-slate-900 truncate">
                        {projectMeta.approvedBy || 'Approved By'}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Signature & Date</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. ENGINEERING DISCLAIMER */}
              <div className="mt-6 pt-2 border-t border-slate-300 text-[9px] text-slate-500 leading-normal break-inside-avoid">
                <strong>Engineering Note:</strong> This calculation provides computational assistance based on the inputs, assumptions, units and calculation method selected by the user. It does not replace project specifications, approved drawings, applicable codes and standards, manufacturer data, site verification, or professional engineering judgment.
              </div>

              {/* 12. OFFICIAL FOOTER */}
              <div className="mt-4 pt-2 border-t border-slate-400 flex items-center justify-between text-[9px] text-slate-500 font-mono break-inside-avoid">
                <span>PB CivilLab · Calculate Smarter. Build Better. · Prokash Biswas</span>
                <span>Doc: {projectMeta.documentNumber} · Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
