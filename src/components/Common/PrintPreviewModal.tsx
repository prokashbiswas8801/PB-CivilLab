import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  Sliders,
  Check,
  ChevronDown,
  Layers,
  Settings,
  ShieldCheck,
  Eye,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Building2,
  UserCheck,
  PenTool,
} from 'lucide-react';
import { CalculationResult, AppSettings } from '../../types';
import { Logo } from '../Logo';
import { formatNumber } from '../../utils/units';

export interface PrintProjectMeta {
  projectName?: string;
  clientName?: string;
  location?: string;
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  drawingRef?: string;
  revision?: string;
  documentNo?: string;
  date?: string;
}

export interface PrintSettings {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
  orientation: 'portrait' | 'landscape';
  margins: 'normal' | 'narrow' | 'wide' | 'compact';
  colorMode: 'full_color' | 'monochrome' | 'bw_pure';
  scale: number; // 80, 90, 100
  showLogo: boolean;
  showProjectInfo: boolean;
  showPrimaryResult: boolean;
  showSecondaryTable: boolean;
  showInputTable: boolean;
  showFormula: boolean;
  showBreakdown: boolean;
  showAssumptions: boolean;
  showEngineeringNotes: boolean;
  showCodeReferences: boolean;
  showSignOffBlock: boolean;
  showFooter: boolean;
  customTitle?: string;
}

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult | null;
  settings: AppSettings;
  initialProjectMeta?: PrintProjectMeta;
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
  // Stable document number generated once and preserved
  const [docNumber] = useState<string>(() => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `PBCL-${year}-${rand}`;
  });

  // Project Metadata State
  const [projectMeta, setProjectMeta] = useState<PrintProjectMeta>(() => ({
    projectName: initialProjectMeta?.projectName || 'General Civil Engineering Works',
    clientName: initialProjectMeta?.clientName || 'Project Engineering Office',
    location: initialProjectMeta?.location || 'Jobsite Headquarters',
    preparedBy: initialProjectMeta?.preparedBy || 'Site Engineer',
    checkedBy: initialProjectMeta?.checkedBy || 'Resident Engineer / Consultant',
    approvedBy: initialProjectMeta?.approvedBy || 'Project Director',
    drawingRef: initialProjectMeta?.drawingRef || 'DRG-STR-01',
    revision: initialProjectMeta?.revision || 'Rev 0 (Approved For Construction)',
    documentNo: initialProjectMeta?.documentNo || docNumber,
    date: initialProjectMeta?.date || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  }));

  // Print Configuration Settings
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    pageSize: 'A4',
    orientation: defaultOrientation,
    margins: 'normal',
    colorMode: 'full_color',
    scale: 100,
    showLogo: true,
    showProjectInfo: true,
    showPrimaryResult: true,
    showSecondaryTable: true,
    showInputTable: true,
    showFormula: true,
    showBreakdown: true,
    showAssumptions: true,
    showEngineeringNotes: true,
    showCodeReferences: true,
    showSignOffBlock: true,
    showFooter: true,
    customTitle: result?.title || 'Civil Engineering Calculation Sheet',
  });

  // Keep custom title in sync when result changes
  useEffect(() => {
    if (result?.title) {
      setPrintSettings(prev => ({
        ...prev,
        customTitle: prev.customTitle || result.title,
      }));
    }
  }, [result]);

  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');

  if (!isOpen || !result) return null;

  // Execute Native Print
  const handlePrint = () => {
    window.print();
  };

  // Dynamic CSS variables according to selected margins and scale
  const getMarginClass = () => {
    switch (printSettings.margins) {
      case 'narrow': return 'p-4 sm:p-6';
      case 'wide': return 'p-8 sm:p-12';
      case 'compact': return 'p-3 sm:p-4';
      default: return 'p-6 sm:p-8';
    }
  };

  const getColorModeClasses = () => {
    switch (printSettings.colorMode) {
      case 'monochrome':
        return 'filter grayscale text-black bg-white';
      case 'bw_pure':
        return 'filter contrast-150 grayscale text-black bg-white';
      default:
        return 'text-slate-900 bg-white';
    }
  };

  // Engineering code profile badge
  const codeProfileName = settings.regionalProfile?.name || 'BNBC 2020 / ACI 318 Standard';
  const engineeringStatus = result.isPreliminary ? 'PRELIMINARY ESTIMATE' : 'CODE-REFERENCED CALCULATION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* Container Dialog */}
      <div className="w-full max-w-6xl h-[95vh] rounded-2xl border border-white/15 bg-[#0B0F19] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Toolbar (No Print) */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-[#111827] flex items-center justify-between gap-4 no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  PB CivilLab Engineering Report Engine
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  Print & PDF Preview
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Doc Ref: {projectMeta.documentNo} · {printSettings.pageSize} {printSettings.orientation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex rounded-lg border border-white/10 bg-[#151C2B] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'preview' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Preview Document
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Options & Fields
              </button>
            </div>

            {/* Direct Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
              title="Open browser print dialog to Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Close Print Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Dual-Pane Interface */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANE: Options & Metadata Controls (Scrollable) */}
          <div className="w-80 lg:w-96 border-r border-white/10 bg-[#0F172A] p-4 overflow-y-auto space-y-5 text-xs text-slate-300 shrink-0 no-print">
            
            {/* Quick Layout Selectors */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 block tracking-wider">
                Page & Layout Settings
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Page Format</label>
                  <select
                    value={printSettings.pageSize}
                    onChange={e => setPrintSettings({ ...printSettings, pageSize: e.target.value as any })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="Letter">Letter (8.5 × 11 in)</option>
                    <option value="Legal">Legal (8.5 × 14 in)</option>
                    <option value="A3">A3 (297 × 420 mm)</option>
                    <option value="A5">A5 (148 × 210 mm)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Orientation</label>
                  <select
                    value={printSettings.orientation}
                    onChange={e => setPrintSettings({ ...printSettings, orientation: e.target.value as any })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Margins</label>
                  <select
                    value={printSettings.margins}
                    onChange={e => setPrintSettings({ ...printSettings, margins: e.target.value as any })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="normal">Normal (15 mm)</option>
                    <option value="narrow">Narrow (8 mm)</option>
                    <option value="wide">Wide (22 mm)</option>
                    <option value="compact">Compact (5 mm)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Ink Mode</label>
                  <select
                    value={printSettings.colorMode}
                    onChange={e => setPrintSettings({ ...printSettings, colorMode: e.target.value as any })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="full_color">Technical Full Color</option>
                    <option value="monochrome">Grayscale / Monochrome</option>
                    <option value="bw_pure">Pure Black & White</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Document Header & Title Customization */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 block tracking-wider">
                Document Identification
              </span>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Custom Report Title</label>
                <input
                  type="text"
                  value={printSettings.customTitle}
                  onChange={e => setPrintSettings({ ...printSettings, customTitle: e.target.value })}
                  placeholder="e.g. Ground Floor RCC Slab Concrete Estimate"
                  className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Document Ref #</label>
                  <input
                    type="text"
                    value={projectMeta.documentNo}
                    onChange={e => setProjectMeta({ ...projectMeta, documentNo: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Revision</label>
                  <input
                    type="text"
                    value={projectMeta.revision}
                    onChange={e => setProjectMeta({ ...projectMeta, revision: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Project Workspace Information */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 block tracking-wider">
                Project Information (Jobsite)
              </span>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectMeta.projectName}
                  onChange={e => setProjectMeta({ ...projectMeta, projectName: e.target.value })}
                  placeholder="e.g. Residential Tower Block-A"
                  className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Client / Owner</label>
                  <input
                    type="text"
                    value={projectMeta.clientName}
                    onChange={e => setProjectMeta({ ...projectMeta, clientName: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Job Location</label>
                  <input
                    type="text"
                    value={projectMeta.location}
                    onChange={e => setProjectMeta({ ...projectMeta, location: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Prepared By (Engineer)</label>
                  <input
                    type="text"
                    value={projectMeta.preparedBy}
                    onChange={e => setProjectMeta({ ...projectMeta, preparedBy: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Checked By (Quality)</label>
                  <input
                    type="text"
                    value={projectMeta.checkedBy}
                    onChange={e => setProjectMeta({ ...projectMeta, checkedBy: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#151C2B] p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Section Toggles */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 block tracking-wider">
                Include / Exclude Sections
              </span>

              <div className="space-y-1.5">
                {[
                  { key: 'showLogo', label: 'Official Header & PB CivilLab Logo' },
                  { key: 'showProjectInfo', label: 'Project Metadata & Site Details' },
                  { key: 'showPrimaryResult', label: 'Primary Result Highlight Box' },
                  { key: 'showSecondaryTable', label: 'Computed Secondary Quantities Table' },
                  { key: 'showInputTable', label: 'Specified Field Input Parameters Table' },
                  { key: 'showFormula', label: 'Governing Formula & Substituted Math' },
                  { key: 'showBreakdown', label: 'Step-by-Step Calculation Breakdown' },
                  { key: 'showAssumptions', label: 'Design Assumptions & Material Factors' },
                  { key: 'showEngineeringNotes', label: 'Jobsite Practical Notes & Tips' },
                  { key: 'showCodeReferences', label: 'Building Code & Standards Compliance' },
                  { key: 'showSignOffBlock', label: 'Quality Assurance Sign-Off Block' },
                  { key: 'showFooter', label: 'Document Footer & Timestamp' },
                ].map(item => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={(printSettings as any)[item.key]}
                      onChange={e => setPrintSettings({ ...printSettings, [item.key]: e.target.checked })}
                      className="rounded border-white/20 bg-[#151C2B] text-cyan-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-slate-300 text-xs">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANE: WYSIWYG Live Sheet Preview (Scrollable Canvas) */}
          <div className="flex-1 bg-[#070B12] p-4 sm:p-8 overflow-y-auto flex justify-center">
            
            {/* The Physical Paper Preview Container */}
            <div
              id="pb-civillab-printable-sheet"
              className={`w-full ${
                printSettings.orientation === 'landscape' ? 'max-w-5xl' : 'max-w-4xl'
              } shadow-2xl rounded-sm border border-slate-300 transition-all font-sans print-sheet ${getColorModeClasses()} ${getMarginClass()}`}
              style={{
                minHeight: printSettings.orientation === 'landscape' ? '210mm' : '297mm',
              }}
            >
              {/* 1. Official Header & Logo */}
              {printSettings.showLogo && (
                <div className="border-b-2 border-black pb-3 mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-wood text-3xl font-extrabold text-black tracking-tight">
                        PB CivilLab
                      </span>
                      <span className="text-[10px] px-2 py-0.5 border border-black font-mono font-bold uppercase tracking-wider bg-gray-50 text-black">
                        Engineering Calculation Sheet
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 mt-1 font-semibold">
                      Civil Engineering Smart Toolkit · Prokash Biswas · Calculate Smarter. Build Better.
                    </p>
                    <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                      Standard Code Profile: <strong>{codeProfileName}</strong>
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-1">
                    <div className="border-2 border-black px-3 py-1 font-mono text-center bg-gray-50">
                      <span className="block text-[9px] uppercase tracking-wider text-gray-600 font-bold">Document Number</span>
                      <strong className="text-xs text-black">{projectMeta.documentNo}</strong>
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono">
                      Date: {projectMeta.date}
                    </div>
                  </div>
                </div>
              )}

              {/* Document Title Banner */}
              <div className="mb-4 pb-2 border-b border-gray-300 flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold font-sans text-black tracking-tight leading-tight">
                    {printSettings.customTitle || result.title}
                  </h1>
                  <span className="text-xs font-mono font-medium text-gray-600">
                    Module: {result.title}
                  </span>
                </div>

                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 border border-black uppercase tracking-wider text-black bg-gray-100">
                  {engineeringStatus}
                </span>
              </div>

              {/* 2. Project Metadata Bar */}
              {printSettings.showProjectInfo && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-black p-2.5 mb-4 text-xs bg-gray-50 break-inside-avoid">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-600">Project</span>
                    <span className="font-bold text-black truncate block">{projectMeta.projectName}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-600">Client</span>
                    <span className="font-medium text-black truncate block">{projectMeta.clientName}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-600">Location</span>
                    <span className="font-medium text-black truncate block">{projectMeta.location}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-600">Drawing / Revision</span>
                    <span className="font-mono text-black truncate block">{projectMeta.drawingRef} ({projectMeta.revision})</span>
                  </div>
                </div>
              )}

              {/* 3. Primary Result Highlight Box */}
              {printSettings.showPrimaryResult && (
                <div className="border-2 border-black p-4 mb-4 bg-gray-100 flex items-center justify-between break-inside-avoid">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block">
                      Primary Engineering Output Quantity
                    </span>
                    <div className="text-3xl font-extrabold font-mono text-black mt-1">
                      {result.primaryValue} <span className="text-xl font-bold">{result.primaryUnit}</span>
                    </div>
                    {result.secondaryValues && result.secondaryValues.length > 0 && (
                      <p className="text-xs text-gray-700 font-mono mt-1">
                        Equivalent Reference: {result.secondaryValues[0].label} = {result.secondaryValues[0].value} {result.secondaryValues[0].unit || ''}
                      </p>
                    )}
                  </div>

                  <div className="border-l border-gray-400 pl-4 text-right text-xs space-y-1">
                    <span className="block text-[10px] uppercase text-gray-600 font-bold">Precision</span>
                    <span className="font-mono font-bold text-black">{settings.decimalPrecision ?? 2} Decimals</span>
                    <span className="block text-[9px] text-gray-500 font-mono">Unit Category: {result.primaryCategory || 'General'}</span>
                  </div>
                </div>
              )}

              {/* 4. Secondary Computed Quantities Table */}
              {printSettings.showSecondaryTable && result.secondaryValues && result.secondaryValues.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                    Computed Output Quantities & Secondary Breakdown
                  </h4>
                  <table className="w-full text-xs border border-collapse border-black">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black">
                        <th className="p-1.5 text-left border-r border-black font-bold text-black">Item / Output Description</th>
                        <th className="p-1.5 text-right font-bold text-black">Computed Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.secondaryValues.map((sec, idx) => (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="p-1.5 border-r border-black font-medium text-black">{sec.label}</td>
                          <td className="p-1.5 text-right font-mono font-bold text-black">
                            {sec.value} {sec.unit || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. Specified Field Input Parameters Table */}
              {printSettings.showInputTable && result.inputsSummary && result.inputsSummary.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                    Specified Field Input Parameters & Site Dimensions
                  </h4>
                  <table className="w-full text-xs border border-collapse border-black">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black">
                        <th className="p-1.5 text-left border-r border-black font-bold text-black">Parameter Description</th>
                        <th className="p-1.5 text-right font-bold text-black">Specified Value & Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.inputsSummary.map((inp, idx) => (
                        <tr key={idx} className="border-b border-gray-300">
                          <td className="p-1.5 border-r border-black text-black">{inp.label}</td>
                          <td className="p-1.5 text-right font-mono font-bold text-black">{inp.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6. Governing Formula & Substituted Math Trace */}
              {printSettings.showFormula && (result.formula || result.substitutedFormula) && (
                <div className="mb-4 border border-black p-3 text-xs bg-gray-50 break-inside-avoid">
                  <span className="font-bold uppercase text-[10px] text-gray-700 block mb-1">
                    Governing Engineering Formula & Mathematical Trace
                  </span>
                  {result.formula && (
                    <div className="font-mono text-black font-bold mb-1">
                      Formula: {result.formula}
                    </div>
                  )}
                  {result.substitutedFormula && (
                    <div className="font-mono text-gray-800 text-[11px]">
                      Substituted Trace: {result.substitutedFormula}
                    </div>
                  )}
                </div>
              )}

              {/* 7. Step-by-Step Mathematical Breakdown */}
              {printSettings.showBreakdown && result.breakdown && result.breakdown.length > 0 && (
                <div className="mb-4 break-inside-avoid">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                    Step-by-Step Calculation Breakdown
                  </h4>
                  <div className="space-y-1.5 text-xs font-mono">
                    {result.breakdown.map((step, idx) => (
                      <div key={idx} className="p-2 border border-gray-300 bg-white flex items-center justify-between">
                        <span className="font-semibold text-black">{step.step}</span>
                        <span className="text-gray-700">{step.expression} = <strong className="text-black">{step.result}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Design Assumptions & Code References */}
              {printSettings.showAssumptions && result.assumptions && result.assumptions.length > 0 && (
                <div className="mb-4 text-xs break-inside-avoid">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                    Design Assumptions & Standard Material Factors
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-gray-800 text-[11px]">
                    {result.assumptions.map((ass, idx) => (
                      <li key={idx}>
                        <strong>{ass.label}:</strong> {ass.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 9. Jobsite Practical Engineering Notes */}
              {printSettings.showEngineeringNotes && result.engineeringNotes && (
                <div className="mb-4 border border-black p-3 text-xs bg-gray-50 break-inside-avoid">
                  <span className="font-bold uppercase text-[10px] text-gray-700 block mb-1">
                    Jobsite Execution & Quality Control Precautions
                  </span>
                  <p className="text-gray-800 text-[11px] leading-relaxed">
                    {result.engineeringNotes}
                  </p>
                </div>
              )}

              {/* 10. Building Code Compliance Reference */}
              {printSettings.showCodeReferences && (
                <div className="mb-6 border-t border-gray-300 pt-2 text-[10px] text-gray-600 font-mono break-inside-avoid">
                  <span>Compliance & Code Profile: </span>
                  <strong className="text-black">{codeProfileName}</strong>
                  <span> · Structural concrete, rebar detailing, and soil mechanics verified against BNBC 2020 / ACI 318 / IS 456 / ASTM specifications.</span>
                </div>
              )}

              {/* 11. Quality Assurance Verification & Sign-Off Block */}
              {printSettings.showSignOffBlock && (
                <div className="mt-8 pt-4 border-t-2 border-black break-inside-avoid print-sign-off">
                  <span className="block text-[10px] uppercase font-bold text-gray-600 mb-6 tracking-wider">
                    Jobsite Quality Assurance & Verification Sign-Off
                  </span>
                  <div className="grid grid-cols-3 gap-6 text-center text-xs">
                    <div className="border-t border-black pt-1.5">
                      <span className="block font-bold text-black">{projectMeta.preparedBy}</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">Prepared By · Signature & Date</span>
                    </div>
                    <div className="border-t border-black pt-1.5">
                      <span className="block font-bold text-black">{projectMeta.checkedBy}</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">Checked By · Signature & Date</span>
                    </div>
                    <div className="border-t border-black pt-1.5">
                      <span className="block font-bold text-black">{projectMeta.approvedBy}</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">Approved By · Signature & Date</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 12. Official Document Footer */}
              {printSettings.showFooter && (
                <div className="mt-8 pt-2 border-t border-gray-300 flex items-center justify-between text-[10px] text-gray-500 font-mono break-inside-avoid">
                  <span>PB CivilLab | {projectMeta.projectName} | {projectMeta.documentNo}</span>
                  <span>Generated: {new Date().toLocaleString()} · Page 1</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
